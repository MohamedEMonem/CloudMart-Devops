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
        timeout(time: 60, unit: 'MINUTES')
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
                        dir('tests') {
                            sh 'npm ci --cache .npm-cache'
                        }
                    }
                }
                
                stage('Run Tests') {
                    parallel {
                        stage('Unit Tests') {
                            steps {
                                dir('tests') {
                                    sh 'npx jest tests/unit --verbose --ci --forceExit'
                                }
                            }
                        }
                        stage('Infrastructure Tests') {
                            steps {
                                dir('tests') {
                                    sh 'npx jest tests/infrastructure --verbose --ci --forceExit'
                                }
                            }
                        }
                    }
                }

                stage('Integration Tests') {
                    steps {
                        dir('tests') {
                            sh 'npx jest tests/integration --verbose --ci --runInBand --forceExit'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build api-gateway') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-api-gateway:${IMAGE_TAG} services/api-gateway"
                    }
                }
                stage('Build identity-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-identity-service:${IMAGE_TAG} services/identity-service"
                    }
                }
                stage('Build product-catalog-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-product-catalog-service:${IMAGE_TAG} services/product-catalog-service"
                    }
                }
                stage('Build inventory-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-inventory-service:${IMAGE_TAG} services/inventory-service"
                    }
                }
                stage('Build cart-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-cart-service:${IMAGE_TAG} services/cart-service"
                    }
                }
                stage('Build order-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-order-service:${IMAGE_TAG} services/order-service"
                    }
                }
                stage('Build payment-service') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-payment-service:${IMAGE_TAG} services/payment-service"
                    }
                }
                stage('Build frontend') {
                    steps {
                        sh "docker build -t ${DOCKERHUB_USER}/cloudmart-frontend:${IMAGE_TAG} cloudmart-frontend"
                    }
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                script {
                    def services = [
                        'api-gateway',
                        'identity-service',
                        'product-catalog-service',
                        'inventory-service',
                        'cart-service',
                        'order-service',
                        'payment-service',
                        'frontend'
                    ]

                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'dockerhub-creds') {
                        for (svc in services) {
                            def imageName = "${DOCKERHUB_USER}/cloudmart-${svc}"
                            sh """
                                docker tag  ${imageName}:${IMAGE_TAG} ${imageName}:latest
                                docker push ${imageName}:${IMAGE_TAG}
                                docker push ${imageName}:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Terraform Plan') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key',     variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'db-password',        variable: 'TF_VAR_db_password')
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
                    string(credentialsId: 'aws-access-key-id',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key',     variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'db-password',        variable: 'TF_VAR_db_password')
                ]) {
                    dir("${TERRAFORM_DIR}") {
                        sh 'terraform apply -auto-approve tfplan'
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key',     variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        # Configure kubectl to talk to EKS
                        aws eks update-kubeconfig \
                            --region ${AWS_REGION} \
                            --name cloudmart-prod-cluster

                        # Apply base resources
                        kubectl apply -f k8s/base/namespace.yaml

                        # Apply secrets
                        kubectl apply -f k8s/secrets/

                        # Apply databases & infrastructure
                        kubectl apply -f k8s/databases/

                        # Wait for databases to be ready
                        echo "Waiting for database pods to become ready..."
                        kubectl wait --for=condition=ready pod \
                            -l tier=database \
                            -n ${K8S_NAMESPACE} \
                            --timeout=120s || true

                        # Update service images to current build tag
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

                        # Verify rollout status
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

            cleanWs()
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