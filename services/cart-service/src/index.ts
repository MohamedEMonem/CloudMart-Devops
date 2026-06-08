import express from 'express';
import { cartRouter } from './cart/cart.router';
import { healthRouter } from './health';
import { redisClient } from './config/redis';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/cart', cartRouter);

// Start server
async function bootstrap() {
  try {
    await redisClient.ping();
    console.log('✅ Redis connected');
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🛒 Cart Service running on port ${PORT}`);
  });
}

bootstrap();
