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
                    sleep 30
                    // Optional: Add a health check using curl
                    sh 'docker exec $(docker ps -qf "name=web") curl -f http://localhost:8000 || true'
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
                // Run Selenium tests on the same Docker network
                sh 'docker run --network ci-network --rm selenium-tests:latest'
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
                dir('website') {
                    sh 'docker compose down || true'
                }
                sh 'docker network rm ci-network || true'
                // Clean up Docker images to save space
                sh 'docker rmi selenium-tests:latest || true'
            }
        }
    }
}
