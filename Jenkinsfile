pipeline {
    agent any

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Clone Website Repo') {
            steps {
                dir('website') {
                    git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
                }
            }
        }

        stage('Clone Selenium Tests Repo') {
            steps {
                dir('selenium-tests') {
                    git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
                }
            }
        }

        stage('Cleanup Previous Containers') {
            steps {
                script {
                    // Stop and remove any existing containers and network
                    sh '''
                        docker compose -f website/docker-compose.yml down || true
                        docker rm -f mongo-ci web || true
                        docker network rm ci-network || true
                    '''
                }
            }
        }

        stage('Build & Run Website') {
            steps {
                dir('website') {
                    // Create Docker network if not exists
                    sh 'docker network create ci-network || true'
                    
                    // Build & start website containers on the network
                    sh 'docker compose up -d --build'
                }
            }
        }

        stage('Wait for Website to be Ready') {
            steps {
                script {
                    // Wait for the web service to be healthy
                    sleep 10
                    // Check if containers are running
                    sh '''
                        echo "Checking container status..."
                        docker ps
                        echo "Waiting for web service to be ready..."
                        sleep 20
                    '''
                    // Try to check web service health
                    sh 'curl -f http://localhost:8000 || echo "Web service might still be starting"'
                }
            }
        }

        stage('Build Selenium Test Image') {
            steps {
                dir('selenium-tests') {
                    // Build Selenium Docker image from test repo
                    sh 'docker build -t selenium-tests:latest .'
                }
            }
        }

        stage('Run Selenium Tests') {
            steps {
                script {
                    // Run Selenium tests on the same Docker network
                    // Get the web container IP for testing
                    sh '''
                        WEB_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web)
                        echo "Web container IP: $WEB_IP"
                        docker run --network ci-network --rm selenium-tests:latest
                    '''
                }
            }
        }

        stage('Teardown') {
            steps {
                dir('website') {
                    sh 'docker compose down'
                }
                // Clean up Docker network
                sh 'docker network rm ci-network || true'
            }
        }
    }
    
    post {
        always {
            // Always cleanup, even if tests fail
            script {
                sh '''
                    echo "Cleaning up containers and network..."
                    docker compose -f website/docker-compose.yml down || true
                    docker network rm ci-network || true
                    docker rmi selenium-tests:latest || true
                '''
            }
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
