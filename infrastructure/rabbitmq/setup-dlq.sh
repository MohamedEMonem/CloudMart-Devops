#!/bin/sh
# ──────────────────────────────────────────────
# RabbitMQ DLQ Setup Script
#
# Run after RabbitMQ starts to create:
#   1. Dead Letter Exchange (DLX): order_events_dlx
#   2. Dead Letter Queue (DLQ):    order_events_dlq
#   3. Binding: DLX → DLQ via routing key
#
# The main queue (order_events) is configured by
# NestJS with x-dead-letter-exchange arguments.
# When a consumer nacks a message with requeue=false,
# RabbitMQ automatically routes it to the DLX → DLQ.
#
# Usage: docker exec rabbitmq sh /scripts/setup-dlq.sh
# ──────────────────────────────────────────────

set -e

echo "⏳ Waiting for RabbitMQ to be ready..."
rabbitmqctl wait --pid 1 --timeout 30

echo "📌 Declaring Dead Letter Exchange: order_events_dlx"
rabbitmqadmin declare exchange \
  name=order_events_dlx \
  type=direct \
  durable=true

echo "📌 Declaring Dead Letter Queue: order_events_dlq"
rabbitmqadmin declare queue \
  name=order_events_dlq \
  durable=true

echo "📌 Binding DLQ to DLX with routing key: order_events_dlq"
rabbitmqadmin declare binding \
  source=order_events_dlx \
  destination=order_events_dlq \
  routing_key=order_events_dlq

echo "✅ DLQ infrastructure ready"
echo ""
echo "Queues:"
rabbitmqadmin list queues name messages consumers
echo ""
echo "Exchanges:"
rabbitmqadmin list exchanges name type
