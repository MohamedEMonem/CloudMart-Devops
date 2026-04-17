pipeline {
    agent any

    // Triggers when changes are pushed to the master branch
    // Note: You should ideally configure a GitHub Webhook in your Jenkins job settings instead.
    stages {
        stage('Checkout') {
            steps {
                // Equivalent to actions/checkout@v2
                checkout scm
            }
        }

        stage('Docker Setup & Build') {
            steps {
                // Equivalent to the Docker login and build steps
                // You must create a 'Username with password' credential in Jenkins named 'docker-credentials'
                withCredentials([usernamePassword(credentialsId: 'docker-credentials', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh 'docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD'
                    sh 'docker build -t marwanmw/frontend -f Dockerfile'
                }
            }
        }

        stage('Test') {
            steps {
                // Equivalent to the Docker run test step
                sh 'docker run -e CI=true marwanmw/frontend npm run start'
            }
        }

        stage('Create Deployment Package') {
            steps {
                // Equivalent to the zip creation step
                sh "zip -r deploy.zip . -x '*.git*'"
            }
        }

        stage('Deploy to EB (Elastic Beanstalk)') {
            steps {
                // You must create two 'Secret text' credentials in Jenkins
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    // Replicates the einaregilsson/beanstalk-deploy action using AWS CLI
                    // NOTE: This requires the AWS CLI to be installed on your Jenkins agent!
                    sh '''
                        export AWS_DEFAULT_REGION="us-east-1"
                        
                        APP_NAME="cloud-shop-mart"
                        ENV_NAME="cloud-shop-mart-env"
                        # ${GIT_COMMIT} is the Jenkins equivalent to ${{ github.sha }}
                        VERSION_LABEL="${GIT_COMMIT}"
                        
                        # IMPORTANT: Replace this with the S3 bucket Elastic Beanstalk uses for your account/region
                        S3_BUCKET="cloud-mart-s3" 

                        echo "1. Uploading deployment package to S3..."
                        aws s3 cp deploy.zip s3://$S3_BUCKET/$APP_NAME/$VERSION_LABEL.zip

                        echo "2. Creating a new Elastic Beanstalk application version..."
                        aws elasticbeanstalk create-application-version \
                            --application-name $APP_NAME \
                            --version-label $VERSION_LABEL \
                            --source-bundle S3Bucket=$S3_BUCKET,S3Key=$APP_NAME/$VERSION_LABEL.zip

                        echo "3. Updating the Elastic Beanstalk environment..."
                        aws elasticbeanstalk update-environment \
                            --application-name $APP_NAME \
                            --environment-name $ENV_NAME \
                            --version-label $VERSION_LABEL
                    '''
                }
            }
        }
    }
}