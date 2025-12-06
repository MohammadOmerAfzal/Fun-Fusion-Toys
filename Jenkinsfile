pipeline {
    agent any

    stages {
        stage('Clean & Setup') {
            steps {
                cleanWs()
                sh '''
                    # Clean up old containers
                    docker rm -f mongo-ci backend-ci frontend-ci 2>/dev/null || true
                '''
            }
        }

        stage('Clone & Run Website') {
            steps {
                dir('website') {
                    git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
                    sh '''
                        docker compose down 2>/dev/null || true
                        docker compose up -d --build
                        sleep 30  # Wait for services to start
                        
                        # Verify
                        docker ps
                        curl -f http://localhost:8000 || sleep 10 && curl -f http://localhost:8000
                    '''
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('selenium-tests') {
                    git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
                    sh '''
                        docker build -t selenium-tests:latest .
                        docker run --network host --rm selenium-tests:latest
                    '''
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    docker compose -f website/docker-compose.yml down 2>/dev/null || true
                    docker rmi selenium-tests:latest 2>/dev/null || true
                '''
            }
        }
    }
}
