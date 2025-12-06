pipeline {
    agent any

    stages {
        stage('Clone Website Repo') {
            steps {
                git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
            }
        }

        stage('Clone Selenium Tests Repo') {
            steps {
                git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
            }
        }

        stage('Build & Run Website') {
            steps {
                // Create Docker network if not exists
                sh 'docker network create ci-network || true'
                
                // Build & start website containers on the network
                sh 'docker compose -f docker-compose.yml up -d --build'
            }
        }

        stage('Build Selenium Test Image') {
            steps {
                dir('selenium-tests') {
                    sh 'docker build -t selenium-tests:latest .'
                }
            }
        }

        stage('Run Selenium Tests') {
            steps {
                // Run tests on the same Docker network
                sh 'docker run --network ci-network --rm selenium-tests:latest'
            }
        }

        stage('Teardown') {
            steps {
                sh 'docker compose -f docker-compose.yml down'
            }
        }
    }
}

