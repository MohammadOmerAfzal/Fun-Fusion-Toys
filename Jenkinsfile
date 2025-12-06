pipeline {
    agent any
    
    stages {

        stage('Clone Website Repo') {
            steps {
                git branch: 'master',
                url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
            }
        }

        stage('Clone Selenium Tests Repo') {
            steps {
                git credentialsId: '6c5d2448-b572-4d2e-8f3f-69f93514cf75',
                url: 'https://github.com/MohammadOmerAfzal/FunFusion-Selenium-Tests.git',
                branch: 'main'
            }
        }

        stage('Stop Previous Containers') {
            steps {
                sh '''
                docker compose down || true
                '''
            }
        }

        stage('Start CI Containers') {
            steps {
                sh '''
                docker compose up -d --build
                '''
            }
        }

        stage('Run Selenium Tests') {
            steps {
                sh '''
                cd FunFusion-Selenium-Tests
                python3 -m venv venv
                source venv/bin/activate
                pip install -r requirements.txt
                python test/test_main.py
                '''
            }
        }
    }
}
