pipeline {
    agent any

    environment {
        DOCKERHUB_USER = 'wali23'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Images') {
            steps {
                script {
                    def services = [
                        'api-gateway',
                        'cart-service',
                        'identity-service',
                        'inventory-service',
                        'order-service',
                        'payment-service',
                        'product-catalog-service'
                    ]

                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-creds') {
                        for (svc in services) {
                            def img = docker.build("${DOCKERHUB_USER}/cloudmart-${svc}:${BUILD_NUMBER}", "services/${svc}")
                            img.push()
                            img.push('latest')
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'All images built and pushed successfully.'
        }
        failure {
            echo 'Build failed — check console output above.'
        }
    }
}
