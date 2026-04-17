pipeline {
    agent any

    environment {
        // Define these here so they are accessible in all stages
        FRONTEND_IMAGE = 'marwanmw/cloudmart-frontend'
        BACKEND_IMAGE  = 'marwanmw/cloudmart-backend'
        APP_NAME     = 'cloud-shop-mart'
        ENV_NAME     = 'cloud-shop-mart-env'
        S3_BUCKET    = 'cloud-mart-s3'
        REGION       = 'us-east-1'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Setup & Build') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-credentials', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh "echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin"
                    sh "docker build -t ${FRONTEND_IMAGE}:${GIT_COMMIT} -t ${FRONTEND_IMAGE}:latest -f frontend/Dockerfile frontend"
                    sh "docker build -t ${BACKEND_IMAGE}:${GIT_COMMIT} -t ${BACKEND_IMAGE}:latest -f backend/Dockerfile backend"
                    sh "docker push ${FRONTEND_IMAGE}:${GIT_COMMIT}"
                    sh "docker push ${FRONTEND_IMAGE}:latest"
                    sh "docker push ${BACKEND_IMAGE}:${GIT_COMMIT}"
                    sh "docker push ${BACKEND_IMAGE}:latest"
                }
            }
        }

        stage('Test') {
            steps {
                // Validate that the built frontend image has a valid nginx configuration.
                sh "docker run --rm --entrypoint nginx ${FRONTEND_IMAGE}:${GIT_COMMIT} -t"
            }
        }

        stage('Create Deployment Package') {
            steps {
                // Ensure zip is installed on your Jenkins agent
                sh "zip -r deploy.zip . -x '*.git*'"
            }
        }

        stage('Deploy to EB (Elastic Beanstalk)') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        export AWS_DEFAULT_REGION="${REGION}"
                        VERSION_LABEL="${GIT_COMMIT}"
                        
                        echo "1. Uploading deployment package to S3..."
                        aws s3 cp deploy.zip s3://${S3_BUCKET}/${APP_NAME}/${VERSION_LABEL}.zip

                        echo "2. Creating new Elastic Beanstalk application version..."
                        aws elasticbeanstalk create-application-version \
                            --application-name ${APP_NAME} \
                            --version-label ${VERSION_LABEL} \
                            --source-bundle S3Bucket=${S3_BUCKET},S3Key=${APP_NAME}/${VERSION_LABEL}.zip

                        echo "3. Updating the Elastic Beanstalk environment..."
                        aws elasticbeanstalk update-environment \
                            --application-name ${APP_NAME} \
                            --environment-name ${ENV_NAME} \
                            --version-label ${VERSION_LABEL}
                    '''
                }
            }
        }
    }

    post {
        always {
            // Good practice: remove the local image to save disk space on the Jenkins node
            sh "docker rmi ${FRONTEND_IMAGE}:${GIT_COMMIT} ${FRONTEND_IMAGE}:latest || true"
            sh "docker rmi ${BACKEND_IMAGE}:${GIT_COMMIT} ${BACKEND_IMAGE}:latest || true"
            deleteDir()
        }
    }
}