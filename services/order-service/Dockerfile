FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate
COPY tsconfig.json nest-cli.json ./
COPY src ./src/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=30s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

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
