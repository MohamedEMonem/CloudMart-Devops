pipeline {
    agent {
        label 'docker'
    }

    environment {
        DOCKER_HUB_USER = 'marwanmw'
        DOCKER_CREDS_ID = 'docker-hub-credentials' 
        IMAGE_TAG = "v${BUILD_NUMBER}" 
        
        // AWS Variables
        AWS_REGION = "us-east-1" 
        S3_BUCKET = "cloud-mart-s3" // Double check this matches your actual S3 bucket name

        // Backend Specifics (From your screenshot)
        EB_APP_BACKEND = "cloudmart-backend-env"
        EB_ENV_BACKEND = "cloudmart-backend-env-env"

        // Frontend Specifics (From your screenshot)
        EB_APP_FRONTEND = "cloudmart-frontend-env"
        EB_ENV_FRONTEND = "cloudmart-frontend-env-env"
    }

    stages {
        stage('Docker Hub Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDS_ID}", passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh "echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin"
                }
            }
        }

        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        sh "docker build -t ${DOCKER_HUB_USER}/cloudmart-backend:${IMAGE_TAG} -t ${DOCKER_HUB_USER}/cloudmart-backend:latest backend/"
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh "docker build -t ${DOCKER_HUB_USER}/cloudmart-frontend:${IMAGE_TAG} -t ${DOCKER_HUB_USER}/cloudmart-frontend:latest frontend/"
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

        stage('Deploy to AWS Elastic Beanstalk') {
            parallel {
                stage('Deploy Backend') {
                    steps {
                        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                            sh """
                            cat <<EOF > Dockerrun-backend.aws.json
                            {
                              "AWSEBDockerrunVersion": "1",
                              "Image": {
                                "Name": "${DOCKER_HUB_USER}/cloudmart-backend:${IMAGE_TAG}",
                                "Update": "true"
                              },
                              "Ports": [{"ContainerPort": 5000}]
                            }
                            EOF
                            
                            zip backend-deploy.zip Dockerrun-backend.aws.json
                            aws s3 cp backend-deploy.zip s3://${S3_BUCKET}/backend-v${BUILD_NUMBER}.zip
                            
                            aws elasticbeanstalk create-application-version \
                                --region ${AWS_REGION} \
                                --application-name "${EB_APP_BACKEND}" \
                                --version-label "backend-v${BUILD_NUMBER}" \
                                --source-bundle S3Bucket="${S3_BUCKET}",S3Key="backend-v${BUILD_NUMBER}.zip"
                            
                            aws elasticbeanstalk update-environment \
                                --region ${AWS_REGION} \
                                --application-name "${EB_APP_BACKEND}" \
                                --environment-name "${EB_ENV_BACKEND}" \
                                --version-label "backend-v${BUILD_NUMBER}"
                            """
                        }
                    }
                }
                
                stage('Deploy Frontend') {
                    steps {
                        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                            sh """
                            cat <<EOF > Dockerrun-frontend.aws.json
                            {
                              "AWSEBDockerrunVersion": "1",
                              "Image": {
                                "Name": "${DOCKER_HUB_USER}/cloudmart-frontend:${IMAGE_TAG}",
                                "Update": "true"
                              },
                              "Ports": [{"ContainerPort": 80}]
                            }
                            EOF
                            
                            zip frontend-deploy.zip Dockerrun-frontend.aws.json
                            aws s3 cp frontend-deploy.zip s3://${S3_BUCKET}/frontend-v${BUILD_NUMBER}.zip
                            
                            aws elasticbeanstalk create-application-version \
                                --region ${AWS_REGION} \
                                --application-name "${EB_APP_FRONTEND}" \
                                --version-label "frontend-v${BUILD_NUMBER}" \
                                --source-bundle S3Bucket="${S3_BUCKET}",S3Key="frontend-v${BUILD_NUMBER}.zip"
                            
                            aws elasticbeanstalk update-environment \
                                --region ${AWS_REGION} \
                                --application-name "${EB_APP_FRONTEND}" \
                                --environment-name "${EB_ENV_FRONTEND}" \
                                --version-label "frontend-v${BUILD_NUMBER}"
                            """
                        }
                    }
                }
            }
        }
        
        stage('Deploy (Local Docker Run)') {
            steps {
                script {
                    sh 'docker rm -f cloudmart-frontend || true'
                    sh 'docker rm -f cloudmart-backend || true'
                    sh "docker run -d -p 5000:5000 --name cloudmart-backend ${DOCKER_HUB_USER}/cloudmart-backend:latest"
                    sh "docker run -d -p 3000:3000 --name cloudmart-frontend ${DOCKER_HUB_USER}/cloudmart-frontend:latest"
                }
            }
        }
    }
    
    post {
        always {
            sh 'docker logout'
        }
    }
}