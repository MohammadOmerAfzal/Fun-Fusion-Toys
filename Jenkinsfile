pipeline {
    agent any
    stages {
        stage('Clean Workspace') {
            steps {
                deleteDir()  // Deletes entire workspace
            }
        }

    stages {
        stage('Clone Website Repo') {
            steps {
                git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
            }
        }

        stage('Build & Run Website') {
            steps {
                sh 'docker compose up -d --build'
            }
        }

        stage('Clone Selenium Tests') {
            steps {
                git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
            }
        }

        stage('Build Selenium Test Image') {
            steps {
                sh 'docker build -t selenium-tests:latest .'
            }
        }

        stage('Run Selenium Tests') {
            steps {
                sh 'docker run --network host --rm selenium-tests:latest'
            }
        }

        stage('Teardown Website') {
            steps {
                sh 'docker compose down'
            }
        }
    }

    post {
        always {
            sh 'docker compose down || true'
        }
    }
}
