pipeline {
    agent any

    environment {
        BASE_URL = "http://backend-ci:5050"
    }

    stages {

        stage('Cleanup Previous Run') {
            steps {
                script {
                    sh '''
                        docker rm -f mongo-ci backend-ci frontend-ci selenium-ci 2>/dev/null || true
                        docker network prune -f 2>/dev/null || true
                    '''
                    cleanWs(cleanWhenNotBuilt: false, deleteDirs: true)
                }
            }
        }

        stage('Clone Website') {
            steps {
                dir('website') {
                    git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
                }
            }
        }

        stage('Start All Services') {
            steps {
                dir('website') {
                    sh '''
                        echo "=== Starting all services via docker-compose ==="
                        docker compose up -d --build
                        echo "Waiting 40s for services..."
                        sleep 40
                        echo "Running containers:"
                        docker ps
                    '''
                }
            }
        }

        stage('Run Selenium Tests') {
            steps {
                dir('website') {
                    sh '''
                        echo "=== Running Selenium tests via docker-compose ==="
                        docker compose run --rm \
                            -e BASE_URL=${BASE_URL} \
                            selenium-ci
                    '''
                }
            }
        }

        stage('Cleanup') {
            steps {
                dir('website') {
                    sh '''
                        echo "=== Stopping all containers ==="
                        docker compose down
                    '''
                }
            }
        }
    }

    post {
        always {
            echo "=== Pipeline Completed ==="
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
