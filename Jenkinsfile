pipeline {
    agent any

    stages {
        stage('Clone Website Repository') {
            steps {
                echo "Cloning website repository..."
                git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
            }
        }

        stage('Start Website Containers') {
            steps {
                echo "Stopping previous containers if any..."
                sh 'sudo docker compose down || true'

                echo "Building and starting website containers..."
                sh 'sudo docker compose up -d --build'
            }
        }

        stage('Verify Website Containers') {
            steps {
                echo "Listing running containers..."
                sh 'sudo docker ps'
            }
        }

        stage('Show Website Logs (Optional)') {
            steps {
                echo "Showing last 50 lines of website logs..."
                sh 'sudo docker compose logs --tail=50'
            }
        }

        stage('Clone Selenium Test Repository') {
            steps {
                echo "Cloning Selenium tests repository..."
                sh 'git clone -b main https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
            }
        }

        stage('Build & Run Selenium Tests') {
            steps {
                echo "Building and running Selenium tests using Docker..."
                sh '''
                    cd FunFusionToys_SeleniumTestCases
                    sudo docker build -t selenium-tests .
                    sudo docker run --rm --network host selenium-tests
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 CI Build & Tests Completed Successfully!"
        }
        failure {
            echo "❌ Build or Tests Failed! Check logs."
        }
    }
}
