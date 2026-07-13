/**
 * Infrastructure Tests — Docker, Kubernetes, Terraform, Nginx
 *
 * These tests validate infrastructure configuration files
 * for correctness, consistency, and best practices.
 *
 * Run: npx jest tests/infrastructure/infra.test.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const ROOT = path.resolve(__dirname, '../../');

// ──────────────────────────────────────────────────────
// DOCKER COMPOSE TESTS
// ──────────────────────────────────────────────────────

describe('Docker Compose Configuration', () => {
  let composeConfig: any;

  beforeAll(() => {
    const content = fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf-8');
    composeConfig = yaml.load(content);
  });

  it('should define all 7 microservices', () => {
    const expectedServices = [
      'api-gateway',
      'identity-service',
      'product-catalog-service',
      'inventory-service',
      'cart-service',
      'order-service',
      'payment-service',
    ];

    for (const svc of expectedServices) {
      expect(composeConfig.services).toHaveProperty(svc);
    }
  });

  it('should define all required databases', () => {
    const expectedDbs = ['identity-db', 'catalog-db', 'inventory-db', 'order-db', 'cart-redis'];

    for (const db of expectedDbs) {
      expect(composeConfig.services).toHaveProperty(db);
    }
  });

  it('should define RabbitMQ messaging infrastructure', () => {
    expect(composeConfig.services).toHaveProperty('rabbitmq');
  });

  it('should define Nginx reverse proxy', () => {
    expect(composeConfig.services).toHaveProperty('nginx');
    expect(composeConfig.services.nginx.ports).toContainEqual('80:80');
  });

  it('should define frontend service', () => {
    expect(composeConfig.services).toHaveProperty('frontend');
  });

  it('should have all services on the same network', () => {
    const network = 'ecommerce-net';
    const allServices = Object.keys(composeConfig.services);

    for (const svc of allServices) {
      const serviceConfig = composeConfig.services[svc];
      expect(serviceConfig.networks).toContain(network);
    }
  });

  it('should have healthchecks on all databases', () => {
    const dbs = ['identity-db', 'catalog-db', 'inventory-db', 'order-db', 'cart-redis'];

    for (const db of dbs) {
      expect(composeConfig.services[db].healthcheck).toBeDefined();
      expect(composeConfig.services[db].healthcheck.test).toBeDefined();
    }
  });

  it('should have healthcheck on RabbitMQ', () => {
    expect(composeConfig.services.rabbitmq.healthcheck).toBeDefined();
  });

  it('API Gateway should depend on all microservices with service_healthy', () => {
    const gateway = composeConfig.services['api-gateway'];
    const dependencies = [
      'identity-service',
      'product-catalog-service',
      'inventory-service',
      'cart-service',
      'order-service',
      'payment-service',
    ];

    for (const dep of dependencies) {
      expect(gateway.depends_on[dep]).toBeDefined();
      expect(gateway.depends_on[dep].condition).toBe('service_healthy');
    }
  });

  it('should use unique host ports for each database', () => {
    const ports = new Set<string>();
    const dbServices = ['identity-db', 'catalog-db', 'inventory-db', 'order-db', 'cart-redis'];

    for (const db of dbServices) {
      const portMapping = composeConfig.services[db].ports[0];
      const hostPort = portMapping.split(':')[0];
      expect(ports.has(hostPort)).toBe(false);
      ports.add(hostPort);
    }
  });

  it('should define persistent volumes for all data stores', () => {
    const expectedVolumes = [
      'identity_data',
      'inventory_data',
      'order_data',
      'catalog_data',
      'cart_data',
      'rabbitmq_data',
    ];

    for (const vol of expectedVolumes) {
      expect(composeConfig.volumes).toHaveProperty(vol);
    }
  });

  it('services should use internal port 3000 consistently', () => {
    const microservices = [
      'identity-service',
      'product-catalog-service',
      'inventory-service',
      'cart-service',
      'order-service',
      'payment-service',
    ];

    for (const svc of microservices) {
      const envVars = composeConfig.services[svc].environment;
      // PORT can be a key-value or array item
      if (Array.isArray(envVars)) {
        expect(envVars).toContainEqual(expect.stringContaining('PORT'));
      } else {
        expect(envVars.PORT).toBe(3000);
      }
    }
  });
});

// ──────────────────────────────────────────────────────
// DOCKERFILE TESTS
// ──────────────────────────────────────────────────────

describe('Dockerfiles', () => {
  const services = [
    'api-gateway',
    'identity-service',
    'product-catalog-service',
    'inventory-service',
    'cart-service',
    'order-service',
    'payment-service',
  ];

  for (const svc of services) {
    describe(`${svc}/Dockerfile`, () => {
      let dockerfileContent: string;

      beforeAll(() => {
        dockerfileContent = fs.readFileSync(
          path.join(ROOT, 'services', svc, 'Dockerfile'),
          'utf-8',
        );
      });

      it('should exist', () => {
        expect(dockerfileContent).toBeDefined();
        expect(dockerfileContent.length).toBeGreaterThan(0);
      });

      it('should use Node.js 20 Alpine base image', () => {
        expect(dockerfileContent).toMatch(/FROM node:20-alpine/);
      });

      it('should expose port 3000', () => {
        expect(dockerfileContent).toMatch(/EXPOSE 3000/);
      });

      it('should have a .dockerignore file', () => {
        const dockerignorePath = path.join(ROOT, 'services', svc, '.dockerignore');
        expect(fs.existsSync(dockerignorePath)).toBe(true);
      });
    });
  }

  describe('Prisma-based services (identity, inventory, order)', () => {
    const prismaServices = ['identity-service', 'inventory-service', 'order-service'];

    for (const svc of prismaServices) {
      it(`${svc} should run prisma generate during build`, () => {
        const content = fs.readFileSync(
          path.join(ROOT, 'services', svc, 'Dockerfile'),
          'utf-8',
        );
        expect(content).toMatch(/prisma generate/);
      });

      it(`${svc} should have a HEALTHCHECK instruction`, () => {
        const content = fs.readFileSync(
          path.join(ROOT, 'services', svc, 'Dockerfile'),
          'utf-8',
        );
        expect(content).toMatch(/HEALTHCHECK/);
      });
    }
  });
});

// ──────────────────────────────────────────────────────
// KUBERNETES MANIFESTS TESTS
// ──────────────────────────────────────────────────────

describe('Kubernetes Manifests', () => {
  const k8sServicesDir = path.join(ROOT, 'k8s', 'services');
  const k8sDatabasesDir = path.join(ROOT, 'k8s', 'databases');

  const serviceManifests = [
    'api-gateway.yaml',
    'cart-service.yaml',
    'identity-service.yaml',
    'inventory-service.yaml',
    'order-service.yaml',
    'payment-service.yaml',
    'product-catalog-service.yaml',
  ];

  // In-cluster infrastructure still deployed as pods
  const inClusterInfraManifests = [
    'cart-redis.yaml',
    'rabbitmq.yaml',
  ];

  // DB pod manifests archived after RDS/DocumentDB migration
  const archivedDbManifests = [
    'identity-db.yaml',
    'catalog-db.yaml',
    'inventory-db.yaml',
    'order-db.yaml',
  ];

  describe('Service Manifests', () => {
    for (const manifest of serviceManifests) {
      describe(manifest, () => {
        let docs: any[];

        beforeAll(() => {
          const content = fs.readFileSync(path.join(k8sServicesDir, manifest), 'utf-8');
          docs = yaml.loadAll(content) as any[];
        });

        it('should exist and be valid YAML', () => {
          expect(docs).toBeDefined();
          expect(docs.length).toBeGreaterThanOrEqual(1);
        });

        it('should contain a Deployment resource', () => {
          const deployment = docs.find((d: any) => d.kind === 'Deployment');
          expect(deployment).toBeDefined();
          expect(deployment.apiVersion).toBe('apps/v1');
        });

        it('should contain a Service resource', () => {
          const service = docs.find((d: any) => d.kind === 'Service');
          expect(service).toBeDefined();
        });

        it('should use the cloudmart namespace', () => {
          for (const doc of docs) {
            expect(doc.metadata.namespace).toBe('cloudmart');
          }
        });

        it('should define resource requests and limits', () => {
          const deployment = docs.find((d: any) => d.kind === 'Deployment');
          const container = deployment.spec.template.spec.containers[0];
          expect(container.resources.requests).toBeDefined();
          expect(container.resources.limits).toBeDefined();
        });

        it('should have readinessProbe and livenessProbe', () => {
          const deployment = docs.find((d: any) => d.kind === 'Deployment');
          const container = deployment.spec.template.spec.containers[0];
          expect(container.readinessProbe).toBeDefined();
          expect(container.livenessProbe).toBeDefined();
        });

        it('should use port 3000 for containerPort', () => {
          const deployment = docs.find((d: any) => d.kind === 'Deployment');
          const container = deployment.spec.template.spec.containers[0];
          expect(container.ports[0].containerPort).toBe(3000);
        });
      });
    }
  });

  describe('In-Cluster Infrastructure Manifests', () => {
    for (const manifest of inClusterInfraManifests) {
      it(`${manifest} should exist and be valid YAML`, () => {
        const content = fs.readFileSync(path.join(k8sDatabasesDir, manifest), 'utf-8');
        const docs = yaml.loadAll(content) as any[];
        expect(docs).toBeDefined();
        expect(docs.length).toBeGreaterThanOrEqual(1);
      });
    }
  });

  describe('RDS Migration — DB Manifests Archived', () => {
    // These files must NOT exist in k8s/databases/ — they were intentionally
    // archived to k8s/databases/archived/ after migrating to AWS RDS/DocumentDB.
    // Presence in the main directory would cause kubectl to deploy orphaned pods.
    for (const manifest of archivedDbManifests) {
      it(`${manifest} should be archived (not in active databases dir)`, () => {
        const activePath = path.join(k8sDatabasesDir, manifest);
        const archivedPath = path.join(k8sDatabasesDir, 'archived', manifest);
        expect(fs.existsSync(activePath)).toBe(false);
        expect(fs.existsSync(archivedPath)).toBe(true);
      });
    }

    it('service manifests should use secretKeyRef for DATABASE_URL (not inline hostnames)', () => {
      const dbServices = ['identity-service', 'order-service', 'inventory-service'];
      for (const svc of dbServices) {
        const content = fs.readFileSync(path.join(k8sServicesDir, `${svc}.yaml`), 'utf-8');
        expect(content).toContain('secretKeyRef');
        expect(content).toContain('DATABASE_URL');
        // Ensure old in-cluster hostname pattern is gone
        expect(content).not.toMatch(/@identity-db:|@order-db:|@inventory-db:/);
      }
    });

    it('product-catalog-service should use secretKeyRef for MONGODB_URI (not inline catalog-db hostname)', () => {
      const content = fs.readFileSync(path.join(k8sServicesDir, 'product-catalog-service.yaml'), 'utf-8');
      expect(content).toContain('secretKeyRef');
      expect(content).toContain('MONGODB_URI');
      expect(content).not.toContain('@catalog-db:');
    });
  });

  it('HPA manifest should exist and define autoscaling policies', () => {
    const content = fs.readFileSync(path.join(k8sServicesDir, 'hpa.yaml'), 'utf-8');
    const docs = yaml.loadAll(content) as any[];

    const hpas = docs.filter((d: any) => d.kind === 'HorizontalPodAutoscaler');
    expect(hpas.length).toBeGreaterThanOrEqual(1);
  });
});

// ──────────────────────────────────────────────────────
// NGINX CONFIGURATION TESTS
// ──────────────────────────────────────────────────────

describe('Nginx Configuration', () => {
  let nginxConf: string;

  beforeAll(() => {
    nginxConf = fs.readFileSync(path.join(ROOT, 'nginx.conf'), 'utf-8');
  });

  it('should listen on port 80', () => {
    expect(nginxConf).toMatch(/listen\s+80/);
  });

  it('should proxy /v1/ to api-gateway', () => {
    expect(nginxConf).toMatch(/location\s+\/v1\//);
    expect(nginxConf).toMatch(/proxy_pass\s+http:\/\/api-gateway:3000/);
  });

  it('should proxy /ws/ to api-gateway with WebSocket upgrade', () => {
    expect(nginxConf).toMatch(/location\s+\/ws\//);
    expect(nginxConf).toContain('proxy_set_header Upgrade $http_upgrade');
    expect(nginxConf).toContain('Connection "upgrade"');
  });

  it('should proxy / to frontend', () => {
    expect(nginxConf).toMatch(/proxy_pass\s+http:\/\/frontend:3007/);
  });

  it('should set X-Real-IP header', () => {
    expect(nginxConf).toContain('X-Real-IP');
  });
});

// ──────────────────────────────────────────────────────
// TERRAFORM CONFIGURATION TESTS
// ──────────────────────────────────────────────────────

describe('Terraform Configuration', () => {
  const terraformDir = path.join(ROOT, 'terraform');

  it('should have main.tf', () => {
    expect(fs.existsSync(path.join(terraformDir, 'main.tf'))).toBe(true);
  });

  it('should have provider.tf', () => {
    expect(fs.existsSync(path.join(terraformDir, 'provider.tf'))).toBe(true);
  });

  it('should have backend.tf for state management', () => {
    expect(fs.existsSync(path.join(terraformDir, 'backend.tf'))).toBe(true);
  });

  it('should have variables.tf', () => {
    expect(fs.existsSync(path.join(terraformDir, 'variables.tf'))).toBe(true);
  });

  it('should have outputs.tf', () => {
    expect(fs.existsSync(path.join(terraformDir, 'outputs.tf'))).toBe(true);
  });

  it('should define VPC, RDS, S3, and EKS modules', () => {
    const mainTf = fs.readFileSync(path.join(terraformDir, 'main.tf'), 'utf-8');
    expect(mainTf).toContain('module "vpc"');
    expect(mainTf).toContain('module "rds"');
    expect(mainTf).toContain('module "s3"');
    expect(mainTf).toContain('module "eks"');
  });

  it('should have module directories for vpc, rds, s3, eks', () => {
    const modulesDir = path.join(terraformDir, 'modules');
    expect(fs.existsSync(path.join(modulesDir, 'vpc'))).toBe(true);
    expect(fs.existsSync(path.join(modulesDir, 'rds'))).toBe(true);
    expect(fs.existsSync(path.join(modulesDir, 's3'))).toBe(true);
    expect(fs.existsSync(path.join(modulesDir, 'eks'))).toBe(true);
  });

  it('should have production and staging tfvars', () => {
    expect(fs.existsSync(path.join(terraformDir, 'production.tfvars'))).toBe(true);
    expect(fs.existsSync(path.join(terraformDir, 'staging.tfvars'))).toBe(true);
  });
});

// ──────────────────────────────────────────────────────
// JENKINSFILE CI/CD TESTS
// ──────────────────────────────────────────────────────

describe('Jenkinsfile CI/CD Pipeline', () => {
  let jenkinsfile: string;

  beforeAll(() => {
    jenkinsfile = fs.readFileSync(path.join(ROOT, 'Jenkinsfile'), 'utf-8');
  });

  it('should define a pipeline block', () => {
    expect(jenkinsfile).toContain('pipeline');
  });

  it('should have Checkout stage', () => {
    expect(jenkinsfile).toContain("stage('Checkout')");
    expect(jenkinsfile).toContain('checkout scm');
  });

  it('should have Build Docker Images stage', () => {
    expect(jenkinsfile).toContain("stage('Build Docker Images')");
  });

  it('should build all 7 microservice images', () => {
    const services = [
      'api-gateway',
      'cart-service',
      'identity-service',
      'inventory-service',
      'order-service',
      'payment-service',
      'product-catalog-service',
    ];

    for (const svc of services) {
      expect(jenkinsfile).toContain(`'${svc}'`);
    }
  });

  it('should push images with BUILD_NUMBER and latest tags', () => {
    expect(jenkinsfile).toContain('${BUILD_NUMBER}');
    expect(jenkinsfile).toContain("docker push ${imageName}:latest");
  });

  it('should use DockerHub registry', () => {
    expect(jenkinsfile).toContain('registry.hub.docker.com');
  });

  it('should have post success/failure handlers', () => {
    expect(jenkinsfile).toContain('success');
    expect(jenkinsfile).toContain('failure');
  });
});
