pipeline {
    agent {
        label 'docker'
    }

    environment {
        // Define your variables here to keep the code clean
        DOCKER_HUB_USER = 'marwanmw'
        // We will pull this credential securely from Jenkins
        DOCKER_CREDS_ID = 'docker-hub-credentials' 
        // Tags the image with the specific Jenkins run number (e.g., v1, v2)
        IMAGE_TAG = "v${1}" 
    }

    stages {
        stage('Docker Hub Login') {
            steps {
                // Securely injects Docker Hub username and password
                withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDS_ID}", passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh "echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin"
                }
            }
        }

        stage('Build Images') {
            // 'parallel' tells Jenkins to build backend and frontend at the exact same time
            parallel {
                stage('Build Backend') {
                    steps {
                        // We tag it twice: once with the build number, and once as 'latest'
                        sh "docker build -t ${DOCKER_HUB_USER}/cloudmart-backend:${IMAGE_TAG} -t ${DOCKER_HUB_USER}/cloudmart-backend:latest -f backend/Dockerfile ."
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh "docker build -t ${DOCKER_HUB_USER}/cloudmart-frontend:${IMAGE_TAG} -t ${DOCKER_HUB_USER}/cloudmart-frontend:latest -f frontend/Dockerfile ."
                    }
                }
            }
        }

        stage('Push Images') {
            parallel {
                stage('Push Backend') {
                    steps {
                        sh "docker push ${DOCKER_HUB_USER}/cloudmart-backend:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_HUB_USER}/cloudmart-backend:latest"
                    }
                }
                stage('Push Frontend') {
                    steps {
                        sh "docker push ${DOCKER_HUB_USER}/cloudmart-frontend:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_HUB_USER}/cloudmart-frontend:latest"
                    }
                }
            }
        }

        stage('Deploy (Local Docker Run)') {
            steps {
                script {
                    // 1. CLEANUP: The '|| true' command is a magic trick. 
                    // It tells Jenkins: "Try to delete the container. If it doesn't exist yet, don't crash the pipeline, just keep going."
                    sh 'docker rm -f cloudmart-frontend || true'
                    sh 'docker rm -f cloudmart-backend || true'

                    // 2. RUN: Start the new containers using the fresh 'latest' image
                    sh "docker run -d -p 5000:5000 --name cloudmart-backend ${DOCKER_HUB_USER}/cloudmart-backend:latest"
                    sh "docker run -d -p 3000:3000 --name cloudmart-frontend ${DOCKER_HUB_USER}/cloudmart-frontend:latest"
                }
            }
        }
    }
    
    // Always clean up the Docker login after the pipeline finishes (success or fail)
    post {
        always {
            sh 'docker logout'
        }
    }
}