# CloudMart (Dokkan) - Automated E-Commerce Deployment Platform

**Supervised by:** Eng. Ahmed Gamil

![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![Terraform](https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white)
![Ansible](https://img.shields.io/badge/ansible-%231A1918.svg?style=for-the-badge&logo=ansible&logoColor=white)
![Jenkins](https://img.shields.io/badge/jenkins-%232C5263.svg?style=for-the-badge&logo=jenkins&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)

## Project Description (Project 4)

**Problem Addressed:** E-commerce websites often face downtime and require complex, highly coordinated deployments.

**Solution:** CloudMart is a highly scalable, multi-service e-commerce platform built with Domain-Driven Design (DDD). We have engineered a robust DevOps lifecycle focusing on automated CI/CD, containerization, real-time monitoring, and dynamic infrastructure provisioning to ensure maximum reliability and zero-downtime deployments.

### Core Deliverables Achieved

1. **Containerization:** All microservices are fully Dockerized.
2. **CI/CD Pipelines:** Automated build and deployment pipelines using Jenkins.
3. **Orchestration:** Deployed to AWS EKS (Kubernetes) with Horizontal Pod Autoscaling (HPA).
4. **Configuration Management:** Ansible playbooks for cluster initialization and tool deployment.
5. **Observability:** Prometheus and Grafana integrated for real-time service monitoring.
6. **Traffic Routing:** NGINX Ingress controller configured as a reverse proxy.
7. **Infrastructure as Code (IaC):** AWS EC2, EKS, RDS, S3, and ELB provisioned entirely via Terraform.
8. **Resilience:** Automated Kubernetes rollout/rollback strategies.

---

## Team Members & Responsibilities

| Task | Assigned To |
| :--- | :--- |
| **Ansible Configuration & Monitoring** | Mohamed Essam |
| **Git Repository Moderation** | Mohamed Essam / Team |
| **Terraform (AWS Infrastructure)** | Marwan Sherif |
| **Backend Code Maintenance** | Marwan Sherif / Mohamed Essam |
| **Kubernetes Architecture** | Habiba Ehab / Tahany Edress |
| **Frontend Code Maintenance** | Habiba Ehab |
| **Dockerization & NGINX Routing** | Tahany Edress |
| **CI/CD Pipelines (Jenkins)** | Youssef Wali |
| **Test Cases & Quality Assurance** | Youssef Wali |
| **Automated Rollbacks** | *Integrated across CI/CD & K8s Deployments* |

---

## Architecture Overview

### 1. Application Architecture (Bounded Contexts)

```text
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway / NGINX Ingress              │
└───────┬──────┬──────┬──────┬──────┬──────┬──────────────────────┘
        │      │      │      │      │      │
   ┌────▼──┐ ┌─▼───┐ ┌▼────┐ ┌▼───┐ ┌▼────┐ ┌▼───────┐
   │Identity│ │Cata-│ │Inven│ │Cart│ │Order│ │Payment │
   │Service │ │log  │ │tory │ │Svc │ │Svc  │ │Service │
   └───┬────┘ └──┬──┘ └──┬──┘ └─┬──┘ └──┬──┘ └───┬────┘
       │         │       │      │       │        │
   ┌───▼───┐ ┌──▼──┐ ┌──▼──┐ ┌─▼──┐ ┌──▼──┐   (stateless)
   │Postgre│ │Mongo│ │Post │ │Red │ │Post │
   │SQL    │ │DB   │ │gres │ │is  │ │gres │
   └───────┘ └─────┘ └─────┘ └────┘ └─────┘

```

### 2. DevOps & Cloud Architecture

* **Cloud Provider:** Amazon Web Services (AWS)
* **Provisioning (IaC):** Terraform (`/terraform`) provisions the VPC, Subnets, EKS Cluster, and RDS instances.
* **Bootstrapping:** Ansible (`/ansible`) configures the Kubernetes cluster, deploying the Kube-Prometheus-Stack and NGINX Ingress.
* **CI/CD:** Jenkins triggers on Git pushes, builds artifacts, and applies manifests from the `/k8s` directory.

---

## Microservices Stack

| Port | Service | Stack | Database |
| --- | --- | --- | --- |
| `3001` | **Identity & User** | NestJS + Prisma | PostgreSQL (:5433) |
| `3002` | **Product Catalog** | NestJS + Mongoose | MongoDB (:27018) |
| `3003` | **Inventory** | NestJS + Prisma | PostgreSQL (:5434) |
| `3004` | **Shopping Cart** | Express + ioredis | Redis (:6380) |
| `3005` | **Order Management** | NestJS + Prisma | PostgreSQL (:5435) |
| `3006` | **Payment** | NestJS (stateless) | None |

---

## Getting Started

### Local Development (Docker Compose)

To run the platform locally for development and testing:

```bash
# Start all services + databases
docker-compose up --build

# Start only databases (for backend development)
docker-compose up identity-db catalog-db inventory-db cart-redis order-db

```

### Cloud Deployment (AWS EKS)

To provision and deploy the production environment to AWS:

**1. Provision Infrastructure (Terraform):**

```bash
cd terraform
terraform init
terraform apply -var-file="production.tfvars"
aws eks update-kubeconfig --region us-east-1 --name cloudmart-cluster-prod

```

**2. Configure Cluster Tools (Ansible):**

```bash
cd ansible
ansible-playbook -i inventory.ini setup-infrastructure.yml

```

**3. Deploy Application (Jenkins / Kubectl):**
Trigger the `Jenkinsfile` pipeline via your CI/CD server, or apply manually in the specific order below to ensure dependencies are met:

```bash
cd k8s

# 1. Apply foundational configurations (Namespaces, Secrets, ConfigMaps)
kubectl apply -f base/

# 2. Spin up stateful backing services (PostgreSQL, MongoDB, Redis, RabbitMQ)
# It is recommended to wait 60-90 seconds for databases to fully initialize and pass health checks.
kubectl apply -f databases/

# 3. Deploy the backend NestJS microservices and API Gateway
# These pods will immediately attempt to connect to the databases provisioned in the previous step.
kubectl apply -f services/

# 4. Launch the Next.js frontend and apply the NGINX Ingress rules
# This finalizes the external routing, allowing internet traffic to reach the frontend via the ELB.
kubectl apply -f frontend/

```

---

## Key Design Principles

* **Database per Service:** No two services share a database, ensuring loose coupling.
* **API Contracts:** Services communicate via strict REST APIs and Message Queues (RabbitMQ), never by direct DB access.
* **Bounded Contexts:** Each service owns its domain, logic, and data entirely.
* **Infrastructure as Code:** All environments are reproducible and version-controlled.
