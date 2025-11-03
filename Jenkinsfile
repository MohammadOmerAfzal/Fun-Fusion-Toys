pipeline {
    agent any
    
    stages {

        stage('Clone Code') {
            steps {
                git branch: 'main', url: 'https://github.com/YOUR_USER/YOUR_REPO.git'
            }
        }

        stage('Install Docker Compose') {
            steps {
                sh '''
                sudo apt update
                sudo apt-get install -y docker-compose
                '''
            }
        }

        stage('Stop Previous Containers') {
            steps {
                sh '''
                docker-compose down || true
                '''
            }
        }

        stage('Start CI Containers') {
            steps {
                sh '''
                docker-compose up -d --build
                '''
            }
        }
    }
}

