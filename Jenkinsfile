pipeline {
    agent {
        label 'docker'
    }

    environment {
        DOCKER_HUB_USER = 'marwanmw'
        DOCKER_CREDS_ID = 'docker-hub-credentials' 
        IMAGE_TAG = "v${BUILD_NUMBER}" 
        
        AWS_REGION = "us-east-1" 
        S3_BUCKET = "cloud-mart-s3"

        // These match your screenshot exactly
        APP_BACKEND = "cloudmart-backend-env"
        ENV_BACKEND = "cloudmart-backend-env-env"

        APP_FRONTEND = "cloudmart-frontend-env"
        ENV_FRONTEND = "cloudmart-frontend-env-env"
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

        stage('Deploy to AWS') {
            parallel {
                stage('Deploy Backend') {
                    steps {
                        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                            sh """
                            # 1. Create the artifact
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
                            
                            # 2. Package and Upload
                            zip backend-deploy.zip Dockerrun-backend.aws.json
                            aws s3 cp backend-deploy.zip s3://${S3_BUCKET}/backend-v${BUILD_NUMBER}.zip
                            
                            # 3. Deploy to Beanstalk
                            aws elasticbeanstalk create-application-version --region ${AWS_REGION} --application-name "${APP_BACKEND}" --version-label "backend-v${BUILD_NUMBER}" --source-bundle S3Bucket="${S3_BUCKET}",S3Key="backend-v${BUILD_NUMBER}.zip"
                            aws elasticbeanstalk update-environment --region ${AWS_REGION} --application-name "${APP_BACKEND}" --environment-name "${ENV_BACKEND}" --version-label "backend-v${BUILD_NUMBER}"
                            """
                        }
                    }
                }
                
                stage('Deploy Frontend') {
                    steps {
                        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                            sh """
                            # 1. Create the artifact
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
                            
                            # 2. Package and Upload
                            zip frontend-deploy.zip Dockerrun-frontend.aws.json
                            aws s3 cp frontend-deploy.zip s3://${S3_BUCKET}/frontend-v${BUILD_NUMBER}.zip
                            
                            # 3. Deploy to Beanstalk
                            aws elasticbeanstalk create-application-version --region ${AWS_REGION} --application-name "${APP_FRONTEND}" --version-label "frontend-v${BUILD_NUMBER}" --source-bundle S3Bucket="${S3_BUCKET}",S3Key="frontend-v${BUILD_NUMBER}.zip"
                            aws elasticbeanstalk update-environment --region ${AWS_REGION} --application-name "${APP_FRONTEND}" --environment-name "${ENV_FRONTEND}" --version-label "frontend-v${BUILD_NUMBER}"
                            """
                        }
                    }
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