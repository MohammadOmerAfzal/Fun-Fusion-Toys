pipeline {
    agent any

    stages {
        // Clean workspace before starting
        stage('Clean Workspace') {
            steps {
                deleteDir()  // Deletes entire workspace
            }
        }

        // Clone website repo
        stage('Clone Website Repo') {
            steps {
                git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
            }
        }

        // Build and run website containers
        stage('Build & Run Website') {
            steps {
                sh 'docker compose up -d --build'
            }
        }

        // Clone Selenium test repo
        stage('Clone Selenium Tests') {
            steps {
                git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
            }
        }

        // Build Selenium test container
        stage('Build Selenium Test Image') {
            steps {
                sh 'docker build -t selenium-tests:latest .'
            }
        }

        // Run Selenium tests using test_main.py
        stage('Run Selenium Tests') {
            steps {
                sh 'docker run --network host --rm selenium-tests:latest pytest test_main.py'
            }
        }

        // Teardown website containers
        stage('Teardown Website') {
            steps {
                sh 'docker compose down'
            }
        }
    }

    post {
        always {
            // Ensure website containers are removed even if build/test fails
            sh 'docker compose down || true'
        }
    }
}
