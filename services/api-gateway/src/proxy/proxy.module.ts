import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { PROXY_ROUTES } from './proxy-routes.config';

/**
 * ProxyModule
 *
 * Registers one http-proxy-middleware instance per route defined in
 * proxy-routes.config.ts. Each proxied request is forwarded to the
 * internal Docker network target with the original path intact.
 *
 * The JWT middleware has already run by this point (in AppModule),
 * so every proxied request carries trusted x-user-* headers.
 */
@Module({})
export class ProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    for (const route of PROXY_ROUTES) {
      consumer
        .apply(
          createProxyMiddleware({
            target: route.target,
            changeOrigin: true,
            // Keep the path as-is — backend services already listen on /api/v1/…
            pathRewrite: (path, req) => (req as any).originalUrl,
            // Forward timeout for long-running requests
            proxyTimeout: 30_000,
            // Log proxy events in development
            on: {
              proxyReq: (proxyReq, req: any) => {
                console.log(`[Gateway] ${req.method} ${req.originalUrl || req.url} → ${route.target}${proxyReq.path}`);
                
                // Fix hanging requests when NestJS body-parser has already consumed the stream
                if (req.body && Object.keys(req.body).length > 0) {
                  const bodyData = JSON.stringify(req.body);
                  console.log('[Gateway] Rewriting body:', bodyData);
                  proxyReq.setHeader('Content-Type', 'application/json');
                  proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                  proxyReq.write(bodyData);
                }
              },
              error: (err, _req, res) => {
                console.error(`[Gateway] Proxy error: ${err.message}`);
                if (res && 'writeHead' in res) {
                  (res as any).writeHead(502, { 'Content-Type': 'application/json' });
                  (res as any).end(JSON.stringify({
                    statusCode: 502,
                    message: 'Service unavailable',
                    service: route.context,
                  }));
                }
              },
            },
          }),
        )
        .forRoutes(route.context + '*'); // match prefix + anything after it
    }
  }
}
