pipeline {
    agent any
    
    stages {

        stage('Clone Code') {
            steps {
                git branch: 'master',
                url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git',
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

