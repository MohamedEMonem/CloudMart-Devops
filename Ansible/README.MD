# Ansible Setup & Execution Guide

### 1. What is Ansible?

Ansible is an open-source, IT automation engine used for configuration management, application deployment, and task automation. It allows you to define your system state using YAML files (called **Playbooks**).

Its biggest advantage is that it is **agentless**. Unlike other tools that require you to install software on your target servers, Ansible connects directly via SSH and executes tasks, making it incredibly lightweight and secure.

### 2. What does it do *here*?

In the context of the CloudMart infrastructure, Ansible picks up exactly where Terraform leaves off.

While you use Terraform to physically provision the raw hardware on AWS (like creating VPCs, Security Groups, EC2 instances, or EKS clusters), those servers are just blank slates. Ansible connects to those newly created servers and configures the operating systems.

For example, it might:

* Install necessary packages (like Docker, kubelet, or Nginx).
* Apply security patches and create required user accounts.
* Pull your application code or container images and start the services.
* Ensure the environment matches the exact desired state defined in your playbooks.

### 3. Prerequisites Before Running

Before executing any playbooks, ensure the following are set up within your Ubuntu WSL environment:

* **Python:** Ansible is written in Python and requires it to run.
* **Ansible Installed:** You can install it via the package manager (`sudo apt update && sudo apt install ansible`) or via Python's package manager (`pip install ansible`).
* **SSH Access:** Because Ansible is agentless, your local machine needs SSH access to the target AWS instances. You must have the correct `.pem` key (or SSH public keys configured) and the correct permissions (`chmod 400 your-key.pem`).
* **An Inventory File:** This is a file (often `inventory.ini` or `hosts.yml`) that lists the IP addresses of the servers Terraform just created, grouped by their roles (e.g., `[webservers]`, `[dbservers]`).

### 4. How to Run

Once your prerequisites are met, you interact with Ansible entirely through the command line.

**Step A: Test the Connection**
Before running a massive playbook, verify that Ansible can securely connect to all the servers listed in your inventory file.

```bash
ansible all -i inventory.ini -m ping --private-key=/path/to/your-key.pem

```

*(If successful, you will receive a `pong` response from the target servers).*

**Step B: Check the Syntax**
Always validate your YAML syntax before applying it to avoid failing halfway through a deployment.

```bash
ansible-playbook playbook.yml --syntax-check

```

**Step C: Execute the Playbook**
Run the playbook to configure your infrastructure.

```bash
ansible-playbook -i inventory.ini playbook.yml --private-key=/path/to/your-key.pem

```

*(Tip: Add the `--check` flag at the end of that command to perform a "Dry Run," which shows you what would change without actually making any modifications).*

### 5. Documentation

For deep dives into specific modules, variables, and advanced playbook structures, refer to the official documentation:

* **Main Documentation:** [https://docs.ansible.com/](https://docs.ansible.com/)
* **User Guide:** [https://docs.ansible.com/ansible/latest/user_guide/index.html](https://docs.ansible.com/ansible/latest/user_guide/index.html)
