pipeline {
    agent { label 'docker' }

    environment {
        // AWS ECR Configuration (Replace YOUR_ACCOUNT_ID with your actual AWS Account ID)
        AWS_ACCOUNT_ID = "025064822778"
        AWS_REGION     = "us-east-1"
        ECR_URL        = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        
        IMAGE_TAG      = "v${BUILD_NUMBER}"
        S3_BUCKET      = "cloud-mart-s3"

        // Beanstalk Configuration
        APP_BACKEND    = "cloudmart-backend-env"
        ENV_BACKEND    = "cloudmart-backend-env-env"
        APP_FRONTEND   = "cloudmart-frontend-env"
        ENV_FRONTEND   = "cloudmart-frontend-env-env"
    }

    stages {
        stage('AWS Login & ECR Setup') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                    // Log into ECR (native AWS authentication)
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}"
                }
            }
        }

        stage('Build & Push Images') {
            parallel {
                stage('Backend') {
                    steps {
                        sh """
                        docker build -t ${ECR_URL}/cloudmart-backend:${IMAGE_TAG} backend/
                        docker push ${ECR_URL}/cloudmart-backend:${IMAGE_TAG}
                        """
                    }
                }
                stage('Frontend') {
                    steps {
                        sh """
                        docker build -t ${ECR_URL}/cloudmart-frontend:${IMAGE_TAG} frontend/
                        docker push ${ECR_URL}/cloudmart-frontend:${IMAGE_TAG}
                        """
                    }
                }
            }
        }

        stage('Deploy to Elastic Beanstalk') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                    sh """
                    # --- BACKEND DEPLOY ---
                    cat <<EOF > Dockerrun-backend.aws.json
                    {
                      "AWSEBDockerrunVersion": "1",
                      "Image": { "Name": "${ECR_URL}/cloudmart-backend:${IMAGE_TAG}", "Update": "true" },
                      "Ports": [{"ContainerPort": 5000}]
                    }
                    EOF
                    zip backend-deploy.zip Dockerrun-backend.aws.json
                    aws s3 cp backend-deploy.zip s3://${S3_BUCKET}/backend-${IMAGE_TAG}.zip
                    aws elasticbeanstalk create-application-version --application-name "${APP_BACKEND}" --version-label "backend-${IMAGE_TAG}" --source-bundle S3Bucket="${S3_BUCKET}",S3Key="backend-${IMAGE_TAG}.zip"
                    aws elasticbeanstalk update-environment --environment-name "${ENV_BACKEND}" --version-label "backend-${IMAGE_TAG}"

                    # --- FRONTEND DEPLOY ---
                    cat <<EOF > Dockerrun-frontend.aws.json
                    {
                      "AWSEBDockerrunVersion": "1",
                      "Image": { "Name": "${ECR_URL}/cloudmart-frontend:${IMAGE_TAG}", "Update": "true" },
                      "Ports": [{"ContainerPort": 80}]
                    }
                    EOF
                    zip frontend-deploy.zip Dockerrun-frontend.aws.json
                    aws s3 cp frontend-deploy.zip s3://${S3_BUCKET}/frontend-${IMAGE_TAG}.zip
                    aws elasticbeanstalk create-application-version --application-name "${APP_FRONTEND}" --version-label "frontend-${IMAGE_TAG}" --source-bundle S3Bucket="${S3_BUCKET}",S3Key="frontend-${IMAGE_TAG}.zip"
                    aws elasticbeanstalk update-environment --environment-name "${ENV_FRONTEND}" --version-label "frontend-${IMAGE_TAG}"
                    
                    # --- WAIT FOR SUCCESS ---
                    echo "Waiting for environments to update..."
                    aws elasticbeanstalk wait environment-updated --environment-names "${ENV_BACKEND}" "${ENV_FRONTEND}"
                    """
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout ${ECR_URL}'
        }
    }
}