import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;    // userId
  email: string;
  role: string;
}

/**
 * Real-Time Events Gateway
 *
 * Socket.io WebSocket server running on the `/ws/v1` namespace.
 * Authenticates clients during the handshake via JWT, then
 * maintains a userId → Socket[] map for targeted pushes.
 *
 * Connection flow:
 *   1. Client connects with `auth: { token: '<jwt>' }` in handshake
 *   2. handleConnection() verifies token, extracts userId
 *   3. Socket is stored in the userSockets map
 *   4. When order.status.updated arrives from RabbitMQ,
 *      pushOrderUpdate() finds the socket and emits to it
 *   5. On disconnect, the socket is removed from the map
 *
 * Multiple tabs/devices per user are supported — each gets
 * a separate Socket entry in the array.
 */
@WebSocketGateway({
  cors: { origin: '*' }, // tighten in production
  namespace: 'ws/v1',
  transports: ['websocket', 'polling'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly jwtSecret = process.env.JWT_SECRET || 'default-secret';

  // ── userId → active socket connections ──────────
  // A user can have multiple tabs/devices open, so
  // we store an array of sockets per userId.
  private readonly userSockets = new Map<string, Socket[]>();

  afterInit() {
    this.logger.log('🔌 WebSocket Gateway initialized on namespace /ws/v1');
  }

  // ──────────────────────────────────────────────────
  // CONNECTION: Authenticate via JWT during handshake
  // ──────────────────────────────────────────────────
  handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or query params
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn(`[WS] Connection rejected — no token (socket: ${client.id})`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect(true);
        return;
      }

      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
      const userId = decoded.sub;

      // Store userId on the socket instance for later lookup
      (client as any).userId = userId;
      (client as any).userRole = decoded.role;

      // Register in the user → sockets map
      const existing = this.userSockets.get(userId) || [];
      existing.push(client);
      this.userSockets.set(userId, existing);

      // Join a room named after the userId for easy broadcasting
      client.join(`user:${userId}`);

      this.logger.log(
        `[WS] ✅ Connected — userId: ${userId}, socket: ${client.id}, ` +
        `active connections: ${existing.length}`,
      );

      // Acknowledge successful auth to the client
      client.emit('authenticated', { userId, role: decoded.role });
    } catch (err) {
      this.logger.warn(`[WS] Connection rejected — invalid token (socket: ${client.id})`);
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect(true);
    }
  }

  // ──────────────────────────────────────────────────
  // DISCONNECTION: Clean up the user → socket map
  // ──────────────────────────────────────────────────
  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      const filtered = sockets.filter((s) => s.id !== client.id);
      if (filtered.length > 0) {
        this.userSockets.set(userId, filtered);
      } else {
        this.userSockets.delete(userId);
      }
    }

    this.logger.log(`[WS] 🔌 Disconnected — userId: ${userId}, socket: ${client.id}`);
  }

  // ──────────────────────────────────────────────────
  // PUBLIC API: Push events to specific users
  // Called by the RabbitMQ consumer adapter.
  // ──────────────────────────────────────────────────

  /**
   * Push an order status update to a specific user.
   * Uses Socket.io rooms for efficient targeted delivery.
   */
  pushOrderUpdate(userId: string, payload: OrderStatusUpdatePayload) {
    const room = `user:${userId}`;
    const socketsInRoom = this.server?.to(room);

    if (!socketsInRoom) {
      this.logger.debug(`[WS] No active sockets for user ${userId} — event dropped`);
      return;
    }

    socketsInRoom.emit('order_update', payload);
    this.logger.log(`[WS] 📡 Pushed order_update to user ${userId} — order: ${payload.orderId}, status: ${payload.status}`);
  }

  /**
   * Broadcast a platform-wide notification to all connected users.
   * Useful for maintenance alerts, promotions, etc.
   */
  broadcastToAll(event: string, payload: any) {
    this.server.emit(event, payload);
    this.logger.log(`[WS] 📢 Broadcast '${event}' to all connected clients`);
  }

  /**
   * Get the number of currently connected unique users.
   */
  getConnectedUserCount(): number {
    return this.userSockets.size;
  }
}

// ── Event Payload Types ──────────────────────────
export interface OrderStatusUpdatePayload {
  orderId: string;
  userId: string;
  previousStatus: string;
  status: string;
  updatedAt: string;
}
