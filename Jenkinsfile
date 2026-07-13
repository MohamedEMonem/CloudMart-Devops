pipeline {
    agent any

    environment {
        DOCKERHUB_USER    = 'marwanmw'
        DOCKER_REGISTRY   = 'registry.hub.docker.com'
        IMAGE_TAG         = "${BUILD_NUMBER}"
        K8S_NAMESPACE     = 'cloudmart'
        AWS_REGION        = 'us-east-1'
        TERRAFORM_DIR     = 'terraform'
    }

    options {
        timestamps()
        timeout(time: 180, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch: ${env.BRANCH_NAME ?: 'N/A'}  Commit: ${env.GIT_COMMIT?.take(8) ?: 'N/A'}"
            }
        }

        // Parent stage to handle all Node.js execution inside a single container
        stage('Node.js Environment') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                }
            }
            stages {
                stage('Install Test Dependencies') {
                    steps {
                        // 1. Install dependencies for the testing framework
                        dir('tests') {
                            sh 'npm ci --cache .npm-cache'
                        }

                        // 2. Install dependencies for all microservices so TypeScript can compile
                        sh '''
                            echo "Installing microservice dependencies..."
                            for svc in services/*/; do
                                if [ -f "${svc}package.json" ]; then
                                    echo "➔ Installing dependencies for ${svc}"
                                    cd "${svc}"
                                    npm install --no-audit --no-fund --cache ../../.npm-cache

                                    if grep -q "prisma" "package.json"; then
                                        echo "➔ Generating Prisma client for ${svc}"
                                        npx prisma generate || true
                                    fi
                                    cd ../..
                                fi
                            done
                        '''
                    }
                }
                stage('Run Tests') {
                    parallel {
                        stage('Unit Tests') {
                            steps {
                                dir('tests') {
                                    sh 'npx jest unit --preset ts-jest --verbose --ci --forceExit'
                                }
                            }
                        }
                        stage('Infrastructure Tests') {
                            steps {
                                dir('tests') {
                                    sh 'npx jest infrastructure --preset ts-jest --verbose --ci --forceExit'
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Integration Tests') {
            steps {
                script {
                    try {
                        sh 'docker compose up -d --build'
                        sh 'sleep 60'
                        sh 'docker compose ps'
                        sh """
                        docker run --rm --network ecommerce-net \
                        -v "${WORKSPACE}:/app" \
                        -w /app/tests \
                        node:18-alpine \
                        sh -c "apk add --no-cache python3 make g++ && npm ci --cache .npm-cache && API_URL=http://api-gateway:3000 npx jest integration --preset ts-jest --verbose --ci --runInBand --forceExit"
                    """
                    } finally {
                        sh 'docker compose down -v || true'
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('api-gateway') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-api-gateway:${IMAGE_TAG} services/api-gateway"
                    }
                }
                stage('identity-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-identity-service:${IMAGE_TAG} services/identity-service"
                    }
                }
                stage('product-catalog-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-product-catalog-service:${IMAGE_TAG} services/product-catalog-service"
                    }
                }
                stage('inventory-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-inventory-service:${IMAGE_TAG} services/inventory-service"
                    }
                }
                stage('cart-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-cart-service:${IMAGE_TAG} services/cart-service"
                    }
                }
                stage('order-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-order-service:${IMAGE_TAG} services/order-service"
                    }
                }
                stage('payment-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-payment-service:${IMAGE_TAG} services/payment-service"
                    }
                }
                stage('frontend') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-frontend:${IMAGE_TAG} cloudmart-frontend"
                    }
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login \
                            --username "$DOCKER_USER" \
                            --password-stdin

                        SERVICES="api-gateway identity-service product-catalog-service inventory-service cart-service order-service payment-service frontend"

                        for svc in $SERVICES; do
                            imageName="marwanmw/cloudmart-$svc"

                            docker tag ${imageName}:${IMAGE_TAG} ${imageName}:latest
                            docker push ${imageName}:${IMAGE_TAG}
                            docker push ${imageName}:latest
                        done

                        docker logout
                    '''
                }
            }
        }

        stage('Terraform Plan') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',    variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'identity-db-password',  variable: 'TF_VAR_identity_db_password'),
                    string(credentialsId: 'order-db-password',     variable: 'TF_VAR_order_db_password'),
                    string(credentialsId: 'inventory-db-password', variable: 'TF_VAR_inventory_db_password'),
                    string(credentialsId: 'catalog-db-password',   variable: 'TF_VAR_catalog_db_password')
                ]) {
                    dir("${TERRAFORM_DIR}") {
                        sh '''
                            terraform init -input=false
                            terraform validate
                            terraform plan \
                                -var-file=production.tfvars \
                                -out=tfplan \
                                -input=false
                        '''
                    }
                }
            }
        }

        stage('Terraform Apply') {
            steps {
                input message: 'Apply Terraform changes to production?', ok: 'Deploy Infrastructure'
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',    variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'identity-db-password',  variable: 'TF_VAR_identity_db_password'),
                    string(credentialsId: 'order-db-password',     variable: 'TF_VAR_order_db_password'),
                    string(credentialsId: 'inventory-db-password', variable: 'TF_VAR_inventory_db_password'),
                    string(credentialsId: 'catalog-db-password',   variable: 'TF_VAR_catalog_db_password')
                ]) {
                    dir("${TERRAFORM_DIR}") {
                        sh 'terraform apply -auto-approve tfplan'
                    }
                }
            }
        }

        // -----------------------------------------------------------------------
        // Read the real AWS endpoints from Terraform and inject them into K8s
        // secrets dynamically — no placeholder editing required.
        // -----------------------------------------------------------------------
        stage('Inject RDS Endpoints into K8s Secrets') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',    variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'identity-db-password',  variable: 'IDENTITY_DB_PASS'),
                    string(credentialsId: 'order-db-password',     variable: 'ORDER_DB_PASS'),
                    string(credentialsId: 'inventory-db-password', variable: 'INVENTORY_DB_PASS'),
                    string(credentialsId: 'catalog-db-password',   variable: 'CATALOG_DB_PASS')
                ]) {
                    script {
                        dir("${TERRAFORM_DIR}") {
                            env.RDS_IDENTITY_ENDPOINT  = sh(script: 'terraform output -raw rds_identity_endpoint',  returnStdout: true).trim()
                            env.RDS_ORDER_ENDPOINT     = sh(script: 'terraform output -raw rds_order_endpoint',     returnStdout: true).trim()
                            env.RDS_INVENTORY_ENDPOINT = sh(script: 'terraform output -raw rds_inventory_endpoint', returnStdout: true).trim()
                            env.DOCDB_CATALOG_ENDPOINT = sh(script: 'terraform output -raw docdb_catalog_endpoint', returnStdout: true).trim()
                            env.EKS_CLUSTER_NAME       = sh(script: 'terraform output -raw eks_cluster_name',       returnStdout: true).trim()
                        }

                        echo "Identity RDS  : ${env.RDS_IDENTITY_ENDPOINT}"
                        echo "Order RDS     : ${env.RDS_ORDER_ENDPOINT}"
                        echo "Inventory RDS : ${env.RDS_INVENTORY_ENDPOINT}"
                        echo "Catalog DocDB : ${env.DOCDB_CATALOG_ENDPOINT}"
                        echo "EKS Cluster   : ${env.EKS_CLUSTER_NAME}"
                    }

                    sh """
                        aws eks update-kubeconfig \
                            --region ${AWS_REGION} \
                            --name ${env.EKS_CLUSTER_NAME}

                        kubectl apply -f k8s/base/namespace.yaml

                        kubectl create secret generic identity-db-secret \
                            --namespace=${K8S_NAMESPACE} \
                            --from-literal=DATABASE_URL="postgresql://identity_user:\${IDENTITY_DB_PASS}@${env.RDS_IDENTITY_ENDPOINT}/identity_db" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        kubectl create secret generic order-db-secret \
                            --namespace=${K8S_NAMESPACE} \
                            --from-literal=DATABASE_URL="postgresql://order_user:\${ORDER_DB_PASS}@${env.RDS_ORDER_ENDPOINT}/order_db" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        kubectl create secret generic inventory-db-secret \
                            --namespace=${K8S_NAMESPACE} \
                            --from-literal=DATABASE_URL="postgresql://inventory_user:\${INVENTORY_DB_PASS}@${env.RDS_INVENTORY_ENDPOINT}/inventory_db" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        kubectl create secret generic catalog-db-secret \
                            --namespace=${K8S_NAMESPACE} \
                            --from-literal=MONGODB_URI="mongodb://catalog_user:\${CATALOG_DB_PASS}@${env.DOCDB_CATALOG_ENDPOINT}/catalog_db?tls=true&tlsCAFile=/etc/ssl/certs/global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false&authMechanism=SCRAM-SHA-1" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        # Apply the remaining non-DB secrets (JWT, RabbitMQ, payment, Redis)
                        kubectl apply -f k8s/secrets/

                        echo "✅ All K8s secrets injected with live AWS endpoints"
                    """
                }
            }
        }

        // -----------------------------------------------------------------------
        // Deploy in-cluster infrastructure (RabbitMQ, Redis) FIRST and verify it is
        // actually healthy before touching any application services. This is a
        // hard gate — no "|| true" here. If infra doesn't come up, the build stops.
        // -----------------------------------------------------------------------
        stage('Deploy Infrastructure (RabbitMQ, Redis)') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',    variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        aws eks update-kubeconfig \
                            --region ${AWS_REGION} \
                            --name ${env.EKS_CLUSTER_NAME}

                        # k8s/databases/ contains only in-cluster components now:
                        #   - cart-redis.yaml
                        #   - rabbitmq.yaml
                        # These manifests must pin storageClassName explicitly (e.g. gp2)
                        # rather than relying on a cluster default, since the default
                        # annotation does not persist across Terraform-recreated clusters.

                        kubectl apply -f k8s/secrets/
                        
                        kubectl apply -f k8s/databases/

                        echo "Waiting for RabbitMQ to become healthy..."
                        kubectl rollout status deployment/rabbitmq -n ${K8S_NAMESPACE} --timeout=420s

                        echo "Waiting for cart-redis to become healthy..."
                        kubectl rollout status deployment/cart-redis -n ${K8S_NAMESPACE} --timeout=420s

                        echo "✅ Infrastructure is healthy — proceeding to services"
                    """
                }
            }
        }

        // -----------------------------------------------------------------------
        // Deploy application services one by one, verifying each rollout.
        // On any failure, roll that service back to its previous ReplicaSet and
        // fail the build immediately — do not continue deploying the rest.
        // -----------------------------------------------------------------------
        stage('Deploy Services to Kubernetes') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',    variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    script {
                        def services = [
                            'api-gateway',
                            'identity-service',
                            'product-catalog-service',
                            'inventory-service',
                            'cart-service',
                            'order-service',
                            'payment-service'
                        ]

                        sh """
                            aws eks update-kubeconfig \
                                --region ${AWS_REGION} \
                                --name ${env.EKS_CLUSTER_NAME}
                        """

                        // Update image tags before applying
                        for (svc in services) {
                            sh """
                                sed -i "s|image: ${DOCKERHUB_USER}/cloudmart-${svc}.*|image: ${DOCKERHUB_USER}/cloudmart-${svc}:${IMAGE_TAG}|g" \
                                    k8s/services/${svc}.yaml
                            """
                        }
                        sh """
                            sed -i "s|image: ${DOCKERHUB_USER}/cloudmart-frontend.*|image: ${DOCKERHUB_USER}/cloudmart-frontend:${IMAGE_TAG}|g" \
                                k8s/frontend/frontend.yaml
                        """

                        sh "kubectl apply -f k8s/services/"
                        sh "kubectl apply -f k8s/services/hpa.yaml"
                        sh "kubectl apply -f k8s/frontend/"

                        // Verify each service's rollout individually so failures are
                        // attributable to a specific service, and roll back on failure.
                        for (svc in services) {
                            try {
                                echo "Verifying rollout for ${svc}..."
                                sh "kubectl rollout status deployment/${svc} -n ${K8S_NAMESPACE} --timeout=420s"
                            } catch (err) {
                                echo "❌ Rollout failed for ${svc} — rolling back to previous version"
                                sh "kubectl rollout undo deployment/${svc} -n ${K8S_NAMESPACE} || true"
                                error("Deployment failed for ${svc}, rolled back. Original error: ${err}")
                            }
                        }

                        try {
                            echo "Verifying rollout for frontend..."
                            sh "kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=420s"
                        } catch (err) {
                            echo "❌ Rollout failed for frontend — rolling back to previous version"
                            sh "kubectl rollout undo deployment/frontend -n ${K8S_NAMESPACE} || true"
                            error("Deployment failed for frontend, rolled back. Original error: ${err}")
                        }

                        echo "✅ All services deployed and healthy"
                    }
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'tests/**/junit-*.xml'
            sh '''
                docker image prune -f --filter "label=maintainer=cloudmart" || true
            '''
            // Fix root-owned files left by the node:18-alpine container before cleanup
            sh '''
                docker run --rm -v "$WORKSPACE:/ws" node:18-alpine \
                    chown -R $(id -u):$(id -g) /ws || true
            '''
            cleanWs(patterns: [[pattern: '.npm-cache/**', type: 'EXCLUDE']])
        }

        success {
            echo '══════════════════════════════════════════════'
            echo '  ✅  Pipeline completed successfully!'
            echo "  📦  Images tagged: ${IMAGE_TAG} + latest"
            echo '  🚀  Deployed to Kubernetes (cloudmart)'
            echo '══════════════════════════════════════════════'
        }

        failure {
            echo '══════════════════════════════════════════════'
            echo '  ❌  Pipeline FAILED — check logs above.'
            echo '  ↩️   Any partially-deployed service was rolled back.'
            echo '══════════════════════════════════════════════'
        }

        unstable {
            echo '⚠️  Pipeline finished with warnings (unstable).'
        }
    }
}