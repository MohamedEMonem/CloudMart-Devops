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
                                    # Use --no-audit and --no-fund to drastically speed up pipeline installation
                                    npm install --no-audit --no-fund --cache ../../.npm-cache
                                    
                                    # If the service uses Prisma, generate the client so tests can use it
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
                    string(credentialsId: 'aws-access-key-id',          variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key',       variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'identity-db-password',        variable: 'TF_VAR_identity_db_password'),
                    string(credentialsId: 'order-db-password',           variable: 'TF_VAR_order_db_password'),
                    string(credentialsId: 'inventory-db-password',       variable: 'TF_VAR_inventory_db_password'),
                    string(credentialsId: 'catalog-db-password',         variable: 'TF_VAR_catalog_db_password')
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
                    string(credentialsId: 'aws-access-key-id',          variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key',       variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'identity-db-password',        variable: 'TF_VAR_identity_db_password'),
                    string(credentialsId: 'order-db-password',           variable: 'TF_VAR_order_db_password'),
                    string(credentialsId: 'inventory-db-password',       variable: 'TF_VAR_inventory_db_password'),
                    string(credentialsId: 'catalog-db-password',         variable: 'TF_VAR_catalog_db_password')
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
                    string(credentialsId: 'aws-access-key-id',          variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key',       variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'identity-db-password',        variable: 'IDENTITY_DB_PASS'),
                    string(credentialsId: 'order-db-password',           variable: 'ORDER_DB_PASS'),
                    string(credentialsId: 'inventory-db-password',       variable: 'INVENTORY_DB_PASS'),
                    string(credentialsId: 'catalog-db-password',         variable: 'CATALOG_DB_PASS')
                ]) {
                    script {
                        dir("${TERRAFORM_DIR}") {
                            // Capture all four endpoints from Terraform outputs
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
                        # Connect kubectl to EKS
                        aws eks update-kubeconfig \
                            --region ${AWS_REGION} \
                            --name ${env.EKS_CLUSTER_NAME}

                        # Ensure namespace exists
                        kubectl apply -f k8s/base/namespace.yaml

                        # ------------------------------------------------------------------
                        # Dynamically create/update each DB secret with the real endpoint.
                        # Using --dry-run=client | kubectl apply is idempotent — safe to
                        # re-run on every pipeline execution.
                        # ------------------------------------------------------------------

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
                            --from-literal=MONGODB_URI="mongodb://catalog_user:\${CATALOG_DB_PASS}@${env.DOCDB_CATALOG_ENDPOINT}/catalog_db?tls=true&tlsCAFile=/etc/ssl/certs/global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        # Apply the remaining non-DB secrets (JWT, RabbitMQ, payment, Redis)
                        kubectl apply -f k8s/secrets/

                        echo "✅ All K8s secrets injected with live AWS endpoints"
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',    variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        # kubectl is already configured from the previous stage
                        aws eks update-kubeconfig \
                            --region ${AWS_REGION} \
                            --name ${env.EKS_CLUSTER_NAME}

                        # NOTE: k8s/databases/ now only contains in-cluster components:
                        #   - cart-redis.yaml
                        #   - rabbitmq.yaml
                        # The 4 DB pod yamls were archived; RDS/DocDB are managed by Terraform.
                        kubectl apply -f k8s/databases/

                        # Wait for in-cluster infrastructure (Redis, RabbitMQ) to be ready
                        echo "Waiting for in-cluster infrastructure pods to become ready..."
                        kubectl wait --for=condition=ready pod \
                            -l tier=infrastructure \
                            -n ${K8S_NAMESPACE} \
                            --timeout=120s || true

                        # Update service images to the current build tag
                        SERVICES="api-gateway identity-service product-catalog-service inventory-service cart-service order-service payment-service"
                        for svc in \$SERVICES; do
                            sed -i "s|image: ${DOCKERHUB_USER}/cloudmart-\${svc}.*|image: ${DOCKERHUB_USER}/cloudmart-\${svc}:${IMAGE_TAG}|g" \
                                k8s/services/\${svc}.yaml
                        done

                        # Update frontend image
                        sed -i "s|image: ${DOCKERHUB_USER}/cloudmart-frontend.*|image: ${DOCKERHUB_USER}/cloudmart-frontend:${IMAGE_TAG}|g" \
                            k8s/frontend/frontend.yaml

                        # Apply services & frontend
                        kubectl apply -f k8s/services/
                        kubectl apply -f k8s/frontend/

                        # Apply HPA
                        kubectl apply -f k8s/services/hpa.yaml

                        # Verify rollout status for all services
                        for svc in \$SERVICES; do
                            kubectl rollout status deployment/\${svc} \
                                -n ${K8S_NAMESPACE} \
                                --timeout=180s || true
                        done

                        kubectl rollout status deployment/frontend \
                            -n ${K8S_NAMESPACE} \
                            --timeout=180s || true
                    """
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
            echo '══════════════════════════════════════════════'
        }

        unstable {
            echo '⚠️  Pipeline finished with warnings (unstable).'
        }
    }
}
