pipeline {
    agent any

    stages {

        stage('Clone Website Repository') {
            steps {
                echo "Cloning main website repository..."
                git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
            }
        }

        stage('Stop Previous Containers') {
            steps {
                echo "Stopping previous containers if any..."
                sh 'docker compose down || true'
            }
        }

        stage('Start Website Containers') {
            steps {
                echo "Building and starting website containers..."
                sh 'docker compose up -d --build mongo-ci backend-ci frontend-ci'
            }
        }

        stage('Verify Website Containers') {
            steps {
                sh 'docker ps'
            }
        }

        stage('Clone Selenium Test Repository') {
            steps {
                echo "Cloning Selenium test repository..."
                sh '''
                    rm -rf tests
                    git clone https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git tests
                '''
            }
        }

        stage('Wait for Frontend') {
            steps {
                echo "Waiting for frontend to be ready..."
                sh '''
                    for i in {1..30}; do
                        if curl --silent --fail http://localhost:5175; then
                            echo "Frontend is up!"
                            break
                        fi
                        echo "Waiting for frontend..."
                        sleep 2
                    done
                '''
            }
        }

        stage('Build & Run Selenium Tests') {
            steps {
                echo "Building and running Selenium tests container..."
                sh 'docker compose build selenium-tests'
                sh 'docker compose run --rm selenium-tests'
            }
        }

    }

    post {
        success {
            echo "🎉 CI Build and Tests Completed Successfully!"
        }
        failure {
            echo "❌ Build or Tests Failed. Check logs."
        }
    }
}
