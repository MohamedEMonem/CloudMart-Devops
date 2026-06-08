import Redis from 'ioredis';

export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
});

// Cart keys expire after 7 days (abandoned cart cleanup)
export const CART_TTL_SECONDS = 7 * 24 * 60 * 60;
