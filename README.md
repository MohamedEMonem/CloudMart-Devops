# E-Commerce Microservices — Phase 1: Bounded Contexts

A scalable e-commerce platform built with **Domain-Driven Design (DDD)** and a strict **microservices architecture**.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway / Client                     │
└───────┬──────┬──────┬──────┬──────┬──────┬──────────────────────┘
        │      │      │      │      │      │
   ┌────▼──┐ ┌─▼───┐ ┌▼────┐ ┌▼───┐ ┌▼────┐ ┌▼───────┐
   │Identity│ │Cata-│ │Inven│ │Cart│ │Order│ │Payment │
   │Service │ │log  │ │tory │ │Svc │ │Svc  │ │Service │
   └───┬────┘ └──┬──┘ └──┬──┘ └─┬──┘ └──┬──┘ └───┬────┘
       │         │       │      │       │         │
   ┌───▼───┐ ┌──▼──┐ ┌──▼──┐ ┌─▼──┐ ┌──▼──┐   (stateless)
   │Postgre│ │Mongo│ │Post │ │Red │ │Post │
   │SQL    │ │DB   │ │gres │ │is  │ │gres │
   └───────┘ └─────┘ └─────┘ └────┘ └─────┘
```

## Services

| Port | Service | Stack | Database |
|------|---------|-------|----------|
| 3001 | Identity & User | NestJS + Prisma | PostgreSQL (:5433) |
| 3002 | Product Catalog | NestJS + Mongoose | MongoDB (:27018) |
| 3003 | Inventory | NestJS + Prisma | PostgreSQL (:5434) |
| 3004 | Shopping Cart | Express + ioredis | Redis (:6380) |
| 3005 | Order Management | NestJS + Prisma | PostgreSQL (:5435) |
| 3006 | Payment | NestJS (stateless) | None |

## Quick Start

```bash
# Start all services + databases
docker-compose up --build

# Start only databases (for local development)
docker-compose up identity-db catalog-db inventory-db cart-redis order-db
```

## Key Principles

- **Database per Service**: No two services share a database
- **API Contracts**: Services communicate via REST APIs, never by direct DB access
- **Bounded Contexts**: Each service owns its domain and data
