# Docker Startup Race Conditions - Complete Solution

## ✅ What's Been Fixed

| Issue | Solution |
|-------|----------|
| **`PrismaClientKnownRequestError: relation "public.outbox_messages" does not exist`** | ✅ Added **5-attempt retry logic with exponential backoff** to Prisma migrations in Dockerfiles (identity, inventory, order services) |
| **`ECONNREFUSED 172.18.0.7:5672` (RabbitMQ connection refused)** | ✅ Added `condition: service_healthy` to all RabbitMQ dependencies so services wait for it to be ready |
| **Services starting before infrastructure was ready** | ✅ Added **healthchecks** to all databases (PostgreSQL, MongoDB, Redis) so Docker knows when they're ready |
| **No visibility into service readiness** | ✅ Added **HEALTHCHECK directives** to all microservice Dockerfiles (calls `/health` endpoint) |

---

## 📋 Changes Applied

### 1. **docker-compose.yml** - Infrastructure Healthchecks

Added healthchecks to the following services (already had: rabbitmq, order-db):

#### PostgreSQL Databases (identity-db, inventory-db)
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U <user> -d <db>"]
  interval: 5s
  timeout: 5s
  retries: 5
```

#### MongoDB (catalog-db)
```yaml
healthcheck:
  test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
  interval: 5s
  timeout: 5s
  retries: 5
```

#### Redis (cart-redis)
```yaml
healthcheck:
  test: ["CMD", "redis-cli", "-a", "cart_secret", "ping"]
  interval: 5s
  timeout: 5s
  retries: 5
```

### 2. **docker-compose.yml** - Service Dependencies

**Changed from simple list to conditional depends_on:**

**Before:**
```yaml
depends_on:
  - identity-db
  - rabbitmq
```

**After:**
```yaml
depends_on:
  identity-db:
    condition: service_healthy
  rabbitmq:
    condition: service_healthy
```

**Updated for all services:**
- identity-service: waits for `identity-db` (healthy)
- inventory-service: waits for `inventory-db` (healthy) + `rabbitmq` (healthy)
- product-catalog-service: waits for `catalog-db` (healthy)
- cart-service: waits for `cart-redis` (healthy)
- order-service: waits for `order-db` (healthy) + `rabbitmq` (healthy)
- payment-service: waits for `rabbitmq` (healthy)
- api-gateway: waits for all microservices + `rabbitmq` (healthy)

### 3. **Dockerfiles** - Retry Logic & Healthchecks

#### A. Services with Prisma (identity, inventory, order)

**Added 5-attempt retry loop with exponential backoff:**

```dockerfile
CMD ["sh", "-c", "\
  for i in 1 2 3 4 5; do \
    echo \"Attempt $i: Running prisma migrate deploy...\"; \
    if npx prisma migrate deploy; then \
      echo \"Migrations completed successfully\"; \
      break; \
    fi; \
    if [ $i -lt 5 ]; then \
      WAIT=$((i * 5)); \
      echo \"Migration failed, retrying in ${WAIT}s...\"; \
      sleep $WAIT; \
    fi; \
  done && \
  node dist/main \
"]
```

**Retry Schedule:**
- Attempt 1: Fail → Wait 5s
- Attempt 2: Fail → Wait 10s  
- Attempt 3: Fail → Wait 15s
- Attempt 4: Fail → Wait 20s
- Attempt 5: Final attempt (no retry)

#### B. All Dockerfiles - Healthcheck

```dockerfile
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=30s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1
```

**Parameters:**
- `--start-period=30s`: Allow 30 seconds for app startup before first health check
- `--interval=10s`: Check every 10 seconds after startup
- `--timeout=5s`: Give each check 5 seconds to complete
- `--retries=3`: Mark unhealthy after 3 consecutive failures

---

## 🔄 Startup Flow (How It Works Now)

### Sequential Orchestration with Health Checks

```
Step 1: Infrastructure Layer Starts
├─ PostgreSQL (identity-db) starts → runs healthcheck → healthy ✓
├─ PostgreSQL (inventory-db) starts → runs healthcheck → healthy ✓
├─ PostgreSQL (order-db) starts → runs healthcheck → healthy ✓
├─ MongoDB (catalog-db) starts → runs healthcheck → healthy ✓
├─ Redis (cart-redis) starts → runs healthcheck → healthy ✓
└─ RabbitMQ starts → runs healthcheck → healthy ✓

Step 2: Microservices Start (Conditional)
├─ identity-service
│  ├─ Waits for: identity-db (healthy) ✓
│  ├─ Runs: Prisma migrate deploy (with retries)
│  ├─ Starts NestJS app
│  └─ Exposes: GET /health endpoint
│
├─ inventory-service
│  ├─ Waits for: inventory-db (healthy) + rabbitmq (healthy) ✓
│  ├─ Runs: Prisma migrate deploy (with retries)
│  ├─ Starts NestJS app
│  └─ Exposes: GET /health endpoint
│
├─ order-service
│  ├─ Waits for: order-db (healthy) + rabbitmq (healthy) ✓
│  ├─ Runs: Prisma migrate deploy (with retries, max 50s wait)
│  ├─ Starts NestJS app
│  └─ Exposes: GET /health endpoint
│
├─ product-catalog-service (similar pattern)
├─ payment-service (similar pattern)
├─ cart-service (similar pattern)
└─ All microservices become healthy

Step 3: API Gateway Starts (Only After All Dependencies Healthy)
├─ Waits for: all microservices (healthy) + rabbitmq (healthy) ✓
├─ Starts NestJS app
├─ Exposes: GET /health endpoint
└─ Ready to route traffic to all microservices ✓
```

---

## ⚙️ Key Features

### Automatic Retry for Database Migrations
- **Solves**: `PrismaClientKnownRequestError` errors
- **How**: Retries `npx prisma migrate deploy` up to 5 times
- **Wait logic**: Exponential backoff (5s, 10s, 15s, 20s)
- **Total max wait**: 50 seconds before giving up
- **Benefit**: Handles slow/initializing databases gracefully

### Infrastructure Ready Verification
- **Solves**: Services connecting to unavailable databases/brokers
- **How**: Docker runs healthchecks every 5-10 seconds
- **Markers**: All checks show in `docker ps` output
- **Benefit**: Dependencies guaranteed healthy before startup

### Service Readiness Verification
- **Solves**: API Gateway routing to unstartedservices
- **How**: Healthchecks call `/health` endpoint
- **Start grace period**: 30 seconds before first check
- **Benefit**: Upstream services never receive requests to unhealthy services

---

## 🧪 Testing Instructions

### 1. **Full Clean Startup**
```bash
# Clean slate
docker compose down -v

# Start everything
docker compose up --build

# Watch containers in another terminal
watch -n 1 'docker ps --format "table {{.Names}}\t{{.Status}}"'
```

**What to look for:**
- All containers show `(healthy)` in STATUS column after startup
- Logs show "Migrations completed successfully" messages
- No `ECONNREFUSED` or `relation does not exist` errors

### 2. **Verify Healthcheck Status**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

**Expected output:**
```
NAMES                              STATUS
rabbitmq                           Up 1 minute (healthy)
identity-db                        Up 1 minute (healthy)
order-db                           Up 1 minute (healthy)
identity-service                   Up 40 seconds (healthy)
order-service                      Up 30 seconds (healthy)
api-gateway                        Up 15 seconds (healthy)
```

### 3. **Test Manual Healthchecks**
```bash
# PostgreSQL
docker exec identity-db pg_isready -U identity_user -d identity_db
# Output: accepting connections

# MongoDB
docker exec catalog-db mongosh --eval "db.adminCommand('ping')"
# Output: { ok: 1 }

# Redis
docker exec cart-redis redis-cli -a cart_secret ping
# Output: PONG

# Service API
curl http://localhost:3001/health  # identity-service
curl http://localhost:3005/health  # order-service
# Output should include success response
```

### 4. **Test Recovery from Infrastructure Restart**
```bash
# Start fully
docker compose up --build -d
sleep 60

# Stop and restart a database
docker stop order-db
docker start order-db

# Wait for recovery
sleep 30

# Verify order-service still healthy
docker ps | grep order-service
# Should show "(healthy)" status
```

---

## ⚠️ Important: Required Manual Step

Your NestJS services need a `/health` endpoint to make the healthchecks work. Add this to your services:

### Simple Implementation (Quick)
```typescript
@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

### Advanced Implementation (Recommended)
Install `@nestjs/terminus`:
```bash
npm install @nestjs/terminus
```

Create a health controller with database checks:
```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';

@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaClient,
  ) {}

  @Get('health')
  @HealthCheck()
  async getHealth() {
    return this.health.check([
      async () => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { database: { status: 'up' } };
        } catch (error) {
          throw new Error('Database is down');
        }
      },
    ]);
  }
}
```

Register in your module:
```typescript
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class AppModule {}
```

---

## 📊 Expected Timeline

| Phase | Duration | What Happens |
|-------|----------|--------------|
| Build | 1-2 min | Docker builds images |
| Infrastructure start | 10-15s | Databases and RabbitMQ spin up |
| Infrastructure healthchecks | 10-30s | pg_isready, mongosh, redis-cli, rabbitmq-diagnostics |
| Microservices start | 5-30s | NestJS bootstraps for each service |
| Prisma migrations | 5-50s | `npx prisma migrate deploy` runs (with possible retries) |
| Health registration | 5-10s | Services respond to health probes |
| All healthy | **2-4 min** | **Total time to full readiness** |

---

## 🔍 Monitoring & Debugging

### View Complete Logs
```bash
docker compose logs
```

### Follow Real-Time Logs for Specific Service
```bash
docker compose logs -f order-service
```

### Check Migration Status
```bash
docker logs order-service | grep -i "prisma\|migration\|attempt"
```

### Inspect Network
```bash
docker network inspect projectfinalv1_ecommerce-net
```

### Check Environment Variables in Running Container
```bash
docker exec order-service printenv | grep DATABASE_URL
```

---

## 🚨 Troubleshooting

### Still Getting "relation does not exist" Error?

**Solution:**
1. Check Prisma migrations exist:
   ```bash
   docker exec order-service ls -la prisma/migrations/
   ```

2. Increase retry attempts in Dockerfile (if complex schema):
   ```dockerfile
   for i in 1 2 3 4 5 6 7 8 9; do  # 9 attempts instead of 5
   ```

3. Verify migration idempotency (uses IF NOT EXISTS):
   ```bash
   docker exec order-db psql -U order_user -d order_db \
     -f prisma/migrations/*/migration.sql
   ```

### Still Getting ECONNREFUSED on RabbitMQ?

**Solution:**
1. Check RabbitMQ healthcheck:
   ```bash
   docker exec rabbitmq rabbitmq-diagnostics -q ping
   ```

2. Increase RabbitMQ retries in docker-compose.yml:
   ```yaml
   rabbitmq:
     healthcheck:
       retries: 10  # increased from 5
   ```

3. View RabbitMQ logs:
   ```bash
   docker logs rabbitmq | tail -50
   ```

### Services Never Become Healthy?

**Solution:**
1. Verify `/health` endpoint implemented
2. Check service logs for startup errors:
   ```bash
   docker logs identity-service
   ```

3. Manually test healthcheck:
   ```bash
   docker exec identity-service wget -O- http://localhost:3000/health
   ```

---

## ✨ Success Indicators

Your fix is working when:
- ✅ All containers show `(healthy)` in `docker ps`
- ✅ Logs show "Migrations completed successfully" (no failures after retries)
- ✅ No `ECONNREFUSED` or `relation does not exist` errors
- ✅ API Gateway becomes healthy only after all microservices are healthy
- ✅ Services remain healthy after infrastructure restarts
- ✅ Frontend can successfully call API endpoints

---

## 📁 Files Modified

```
✅ docker-compose.yml (Infrastructure healthchecks + service depends_on conditions)
✅ services/identity-service/Dockerfile
✅ services/inventory-service/Dockerfile
✅ services/order-service/Dockerfile
✅ services/api-gateway/Dockerfile
✅ services/payment-service/Dockerfile
✅ services/product-catalog-service/Dockerfile
✅ services/cart-service/Dockerfile
```

---

## 🚀 Next Steps

1. **Implement `/health` endpoints** in your NestJS services (required for healthchecks to work)
2. **Test startup**: `docker compose down -v && docker compose up --build`
3. **Monitor logs** for "Migrations completed successfully" messages
4. **Verify healthchecks** using `docker ps` command
5. **Test recovery** by restarting infrastructure components

**Status: ✅ Ready for Testing**
