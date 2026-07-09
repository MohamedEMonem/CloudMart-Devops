# Infrastructure Configuration (Ansible)

This directory contains the Ansible playbooks used to configure our AWS EKS cluster and deploy essential cluster-level tooling for the CloudMart e-commerce platform.

---

## What is Ansible?

Ansible is an open-source IT automation engine that automates provisioning, configuration management, application deployment, and orchestration. It is agentless, meaning it doesn't require any software to be installed on the target nodes—it simply communicates over SSH or standard APIs to execute tasks.

## What does Ansible do in this project?

While Terraform provisions our physical AWS hardware (VPC, EKS, RDS) and Jenkins handles our CI/CD application deployments, **Ansible bridges the gap**.

In the e-commerce architecture, Ansible is strictly responsible for configuring the Kubernetes cluster immediately after it is provisioned. Specifically, the `setup-infrastructure.yml` playbook performs the following:

1. Installs the **Nginx Ingress Controller** to handle external traffic routing.
2. Creates the `monitoring` namespace.
3. Deploys the **Kube-Prometheus-Stack** (Prometheus & Grafana) via Helm for full system observability.

---

## Prerequisites

Before running Ansible, your local environment must have the following tools installed and authenticated:

1. **AWS Infrastructure:** The EKS cluster must already be provisioned via our Terraform scripts.
2. **AWS CLI:** Installed and authenticated with active credentials (`aws sts get-caller-identity`).
3. **Kubectl:** Installed to communicate with the cluster.
4. **Helm:** Installed locally (`helm version`).
5. **Ansible & Dependencies:** ```bash
   sudo apt update
   sudo apt install ansible python3-kubernetes -y
   ansible-galaxy collection install kubernetes.core```

---

## How to Run Ansible

### Step 1: Authenticate with the EKS Cluster

Generate your localized `kubeconfig` to allow Ansible to speak to the AWS cluster:

```bash
aws eks update-kubeconfig --region us-east-1 --name cloudmart-cluster-prod

```

### Step 2: Ensure the Inventory Exists

Ansible requires an inventory file, even for local executions. Ensure `inventory.ini` exists in the Ansible directory:

```ini
# inventory.ini
[local]
localhost ansible_connection=local

```

### Step 3: Execute the Playbook

Run the infrastructure setup playbook:

```bash
ansible-playbook -i inventory.ini setup-infrastructure.yml

```

---

## Troubleshooting

**Error: `401 Unauthorized` when running the playbook**
AWS EKS uses short-lived tokens (15 minutes). If you encounter an unauthorized error, your token has likely expired.

* **Fix:** Re-run the `aws eks update-kubeconfig ...` command to generate a fresh token, then immediately run the playbook.
* **WSL Users:** If you are using Windows Subsystem for Linux (WSL), your internal clock may have drifted after waking from sleep, which invalidates AWS tokens. Run `sudo hwclock -s` to sync your clock, regenerate your kubeconfig, and try again.

---

## Official Documentation

For more advanced configurations or module syntax, refer to the official documentation:

* [Ansible Official Documentation](https://docs.ansible.com/)
* [Ansible Kubernetes Core Collection](https://docs.ansible.com/ansible/latest/collections/kubernetes/core/index.html)
