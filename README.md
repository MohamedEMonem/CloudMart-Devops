# Team Members & responsibilities
<table>
  <thead>
    <tr>
      <th>Task</th>
      <th>Assigned to</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Supervised By</td><td>Ahmed Gamil</td></tr>
    <tr><td>Team lead</td><td>Mohamed Essam</td></tr>
    <tr><td>Ansible</td><td>Mohamed Essam</td></tr>
    <tr><td>Maintain backend code</td><td>Marwan Sherif/ Essam</td></tr>
    <tr><td>Terraform</td><td>Marwan Sherif</td></tr>
    <tr><td>Maintain frontend code</td><td>Habiba ehab</td></tr>
    <tr><td>Kubernetes</td><td>Habiba ehab / Tahany Edress</td></tr>
    <tr><td>Dockerization</td><td>Tahany Edress</td></tr>
    <tr><td>Nginx</td><td>Tahany Edress</td></tr>
    <tr><td>Prometheus / Grafana</td><td>Mahmoud Tayar</td></tr>
    <tr><td>CI/CD</td><td>Youssef Wali</td></tr>
    <tr><td>Create test cases</td><td>Youssef Wali</td></tr>
    <tr><td>Automated rollback</td><td>Included in (CI/CD, Artifact, Kubernetes)</td></tr>
    <tr><td>Git repository Moderation</td><td>Mohamed Essam / Team contribution</td></tr>
  </tbody>
</table>

## supervised by Eng.Ahmed Gamil

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
# CloudMart-Devops
This project automates e-commerce microservices deployment using Docker and Kubernetes. It features a full CI/CD pipeline with scalable AWS infrastructure via Terraform. Real-time monitoring ensures zero downtime and high availability.
