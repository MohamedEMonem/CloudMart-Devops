# Infrastructure Bootstrapping (Ansible)

This directory contains the Ansible configuration management suite used to bootstrap the AWS EKS cluster for the CloudMart e-commerce platform.

While **Terraform** provisions the physical AWS hardware (VPC, EKS, RDS) and **Jenkins** manages the CI/CD application deployments, **Ansible** acts as the crucial bridge. It configures the raw Kubernetes cluster with the necessary routing and observability tooling before any application code is deployed.

---

## Architecture & Philosophy

In this microservices architecture, we utilize Ansible specifically for **Cluster Bootstrapping**.

Unlike traditional Ansible operations that use SSH to configure Linux servers, this project uses the `kubernetes.core` collection. This allows Ansible to operate in a fully declarative, API-driven manner—translating YAML playbooks directly into secure HTTPS web requests sent to the AWS EKS Control Plane.

### What `setup-infrastructure.yml` Deploys

1. **NGINX Ingress Controller:** Deployed via Helm to provision an AWS Network Load Balancer (NLB) and act as the central API Gateway and reverse proxy for all incoming web traffic.
2. **Monitoring Namespace:** Isolates all telemetry and observability tools from the core e-commerce applications.
3. **Kube-Prometheus-Stack:** Deploys Prometheus (time-series database) and Grafana (dashboarding) via Helm to monitor cluster health, node utilization, and pod metrics.

---

## Directory Structure

```text
ansible/
├── inventory.ini             # Local execution definition
├── setup-infrastructure.yml  # Master bootstrapping playbook
└── README.md                 # Documentation

```

---

## Prerequisites

Before executing the playbooks, ensure your local deployment environment is fully authenticated and prepared:

1. **Infrastructure:** The AWS EKS cluster must be successfully provisioned via the `terraform apply` workflow.
2. **AWS CLI:** Authenticated with an active IAM session (`aws sts get-caller-identity`).
3. **Local Tools:** `kubectl` and `helm` must be installed.
4. **Ansible & Python Dependencies:**

```bash
sudo apt update
sudo apt install ansible python3-kubernetes -y
ansible-galaxy collection install kubernetes.core

```

---

## Execution Guide

### Step 1: Authenticate with the EKS Cluster

Generate a short-lived IAM token and update your local kubeconfig to allow Ansible to communicate with the AWS Control Plane.

```bash
aws eks update-kubeconfig --region us-east-1 --name cloudmart-cluster-prod

```

### Step 2: Run the Master Playbook

Ensure your `inventory.ini` defines the `localhost` connection to prevent Ansible from attempting SSH connections. Execute the deployment:

```bash
ansible-playbook -i inventory.ini setup-infrastructure.yml

```

---

## Accessing Observability Tools

For security, the Prometheus and Grafana dashboards are not exposed to the public internet by default. You must use a secure `kubectl port-forward` tunnel to access them.

### Accessing Grafana

Grafana provides visual dashboards for cluster metrics.

1. **Retrieve the auto-generated admin password:**

```bash
kubectl get secret kube-prometheus-stack-grafana -n monitoring -o jsonpath="{.data.admin-password}" | base64 --decode ; echo

```

1. **Open the secure tunnel:**

```bash
kubectl port-forward svc/kube-prometheus-stack-grafana -n monitoring 3000:80

```

1. **Log in:** Open `http://localhost:3000` in your browser. User: `admin`.

### Accessing Prometheus

Prometheus allows direct PromQL querying of raw time-series metrics.

1. **Open the secure tunnel:**

```bash
kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090

```

1. **Access the UI:** Open `http://localhost:9090` in your browser.

---

## Useful DevOps Commands

Here is a cheat sheet of critical commands for managing and debugging this specific cluster configuration:

| Task | Command |
| --- | --- |
| **Check EKS Nodes** | `kubectl get nodes -o wide` |
| **Check NGINX Load Balancer** | `kubectl get svc -n ingress-nginx` |
| **Verify Monitoring Pods** | `kubectl get pods -n monitoring` |
| **View Live Ingress Rules** | `kubectl get ingress -A` |
| **Get Pod Resource Usage** | `kubectl top pods -A` |
| **Safely Delete Load Balancer*** | `kubectl delete svc ingress-nginx-controller -n ingress-nginx` |

**CRITICAL: You must execute the Load Balancer deletion command and wait 60 seconds before running `terraform destroy` to prevent AWS state locks.*

---

## Troubleshooting

**Error: `401 Unauthorized` during Playbook Execution**
AWS EKS uses short-lived STS tokens (valid for 15 minutes). If you encounter this error, your authentication has expired.

* **The Fix:** Re-run the `aws eks update-kubeconfig ...` command to generate a fresh token, then execute the playbook immediately.
* **WSL Users:** If you are running Windows Subsystem for Linux (WSL), your internal clock may drift after your machine wakes from sleep, invalidating AWS SSL certificates. Run `sudo hwclock -s` to sync your system clock, regenerate your kubeconfig, and try again.

**Error: `Failed to download Helm chart**`
If the Kubernetes cluster cannot reach the Helm repositories, ensure you do not have conflicting repositories cached locally.

* **The Fix:** Run `helm repo update` manually to refresh your indexes, then re-run the Ansible playbook.

---

## Official Documentation

For advanced parameter configurations, refer to the official documentation:

* [Ansible Kubernetes Core Collection](https://docs.ansible.com/ansible/latest/collections/kubernetes/core/index.html)
* [suspicious link removed]
* [Prometheus Helm Chart Details](https://github.com/prometheus-community/helm-charts)
