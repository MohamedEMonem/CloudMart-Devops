pipeline{
    agent any
    environment{
        DOCKER_IMAGE_FRONT = 'marwanmw/cloudmart-frontend'
        DOCKER_IMAGE_BACK = 'marwanmw/cloudmart-backend'
        EB_APP_NAME = "cloudmart"
        EB_ENV_NAME = "cloudmart-env"
        AWS_REGION = "us-east-1"
        S3_BUCKET = "cloud-mart-s3"

    }
    stages{

        stage('Test'){
            steps{
                sh 'docker build -f backend/Dockerfile.test -t backend-test-image ./backend/'
                sh 'docker run --rm backend-test-image'
        }
    }
        stage('build'){
            steps{
                sh 'docker build -t ${DOCKER_IMAGE_BACK}:latest ./backend/'
                sh 'docker build -t ${DOCKER_IMAGE_FRONT}:latest ./frontend/'
            }
        }
        stage('login to docker hub'){
            steps{
                withCredentials([usernamePassword(credentialsId:'docker-hub-credentials',passwordVariable:'DOCKER_PASS',usernameVariable:'DOCKER_USER')]){
                    sh 'echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin'
                   
                }
            }
        }
        stage('push to docker hub'){
            steps{
                sh 'docker push ${DOCKER_IMAGE_FRONT}:latest'
                sh 'docker push ${DOCKER_IMAGE_BACK}:latest'
            }
        }
        stage('package deployment instructions'){
            steps{
                sh 'zip deploy.zip Dockerrun.aws.json'
            }
        }
        stage('Upload to S3 (The Artifactory)') {
            steps {
                sh "aws s3 cp deploy.zip s3://${S3_BUCKET}/deploy-build-${BUILD_NUMBER}.zip"
            }
        }
        stage('Deploy to Elastic Beanstalk') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'), 
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        aws elasticbeanstalk create-application-version \
                        --region ${AWS_REGION} \
                        --application-name ${EB_APP_NAME} \
                        --version-label cloudmart-${BUILD_NUMBER} \
                        --source-bundle S3Bucket="${S3_BUCKET}",S3Key="deploy-build-${BUILD_NUMBER}.zip"
                    """
                
                
                    sh """
                        aws elasticbeanstalk update-environment \
                        --region ${AWS_REGION} \
                        --application-name ${EB_APP_NAME} \
                        --environment-name ${EB_ENV_NAME} \
                        --version-label cloudmart-${BUILD_NUMBER}
                    """
                }
            }
        }
        





    }
}