pipeline {
    agent any

    stages {

        stage('Pull Code') {
            steps {
                git url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git', branch: 'master'
            }
        }

        stage('Build & Run Containers') {
            steps {
                sh """
                docker compose down || true
                docker compose up -d --build
                """
            }
        }
    }
}

