pipeline {
    agent any

    stages {
        stage('Clean & Setup') {
            steps {
                cleanWs()
                sh '''
                    # Clean ONLY CI containers
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
                        
                        # Verify containers are running
                        echo "=== Running containers ==="
                        docker ps
                        
                        # Test the actual port (5050 based on your output)
                        echo "=== Testing backend on port 5050 ==="
                        curl -f http://localhost:5050 || \
                        echo "Trying other common ports..." && \
                        curl -f http://localhost:8000 || \
                        curl -f http://localhost:3000 || \
                        curl -f http://localhost:5000
                        
                        # Also check if there's a health endpoint
                        echo "=== Checking service health ==="
                        curl -s http://localhost:5050 || curl -s http://localhost:5050/health || curl -s http://localhost:5050/api
                    '''
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('selenium-tests') {
                    git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
                    sh '''
                        # Build test image
                        docker build -t selenium-ci-tests:latest .
                        
                        # Run tests against the correct port (5050)
                        echo "=== Running Selenium tests against backend on port 5050 ==="
                        docker run --network host --rm \
                            -e BASE_URL="http://localhost:5050" \
                            selenium-ci-tests:latest || \
                        
                        echo "=== Trying frontend on port 5175 ==="
                        docker run --network host --rm \
                            -e BASE_URL="http://localhost:5175" \
                            selenium-ci-tests:latest
                    '''
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    # Clean only CI containers
                    docker rm -f mongo-ci backend-ci frontend-ci 2>/dev/null || true
                    docker rmi selenium-ci-tests:latest 2>/dev/null || true
                    
                    echo "=== Main projects should still be running ==="
                    docker ps | grep -v ci
                '''
            }
        }
    }
    
    post {
        always {
            echo "=== Final cleanup ==="
            sh '''
                docker rm -f mongo-ci backend-ci frontend-ci 2>/dev/null || true
                docker rmi selenium-ci-tests:latest 2>/dev/null || true
                
                echo "Remaining containers:"
                docker ps
            '''
        }
    }
}
