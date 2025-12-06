pipeline {
    agent any

    stages {
        stage('Cleanup Previous Run') {
            steps {
                script {
                    // Clean up containers first
                    sh '''
                        docker rm -f mongo-ci backend-ci frontend-ci 2>/dev/null || true
                        docker network prune -f 2>/dev/null || true
                    '''
                    
                    // Clean workspace with force if needed
                    cleanWs(cleanWhenNotBuilt: false, deleteDirs: true)
                }
            }
        }

        stage('Clone Website') {
            steps {
                dir('website') {
                    git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
                }
            }
        }

        stage('Start Website') {
            steps {
                dir('website') {
                    sh '''
                        # Start the website
                        docker compose up -d --build
                        
                        # Wait for services
                        echo "Waiting for services to start..."
                        sleep 40
                        
                        # Check containers
                        echo "Running containers:"
                        docker ps
                        
                        # Check backend logs
                        echo "Backend logs (last 20 lines):"
                        docker logs backend-ci --tail 20 2>/dev/null || echo "Could not get backend logs"
                        
                        # Test connectivity
                        echo "Testing backend on port 5050..."
                        if curl -s -f http://localhost:5050 > /dev/null 2>&1; then
                            echo "✓ Backend is responding on port 5050"
                        else
                            echo "Backend not responding on 5050, checking frontend..."
                            if curl -s -f http://localhost:5175 > /dev/null 2>&1; then
                                echo "✓ Frontend is responding on port 5175"
                            else
                                echo "Warning: Services might still be starting"
                            fi
                        fi
                    '''
                }
            }
        }

        stage('Clone & Build Tests') {
            steps {
                dir('selenium-tests') {
                    git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
                    sh 'docker build -t selenium-ci-tests:latest .'
                }
            }
        }

        stage('Run Selenium Tests') {
            steps {
                script {
                    sh '''
                        echo "=== Running Selenium Tests ==="
                        
                        # Try different URLs for testing
                        echo "Trying backend on port 5050..."
                        docker run --network host --rm \
                            -e BASE_URL="http://localhost:5050" \
                            selenium-ci-tests:latest || \
                        
                        echo "Trying frontend on port 5175..."
                        docker run --network host --rm \
                            -e BASE_URL="http://localhost:5175" \
                            selenium-ci-tests:latest || \
                        
                        echo "Trying alternative ports..."
                        docker run --network host --rm \
                            -e BASE_URL="http://localhost:3000" \
                            selenium-ci-tests:latest
                    '''
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    echo "=== Cleaning up CI resources ==="
                    
                    # Stop and remove CI containers
                    docker rm -f mongo-ci backend-ci frontend-ci 2>/dev/null || true
                    
                    # Remove test image
                    docker rmi selenium-ci-tests:latest 2>/dev/null || true
                    
                    echo "=== Main projects should still be running ==="
                    docker ps | grep -v ci || echo "No containers with 'ci' in name"
                '''
            }
        }
    }

    post {
        always {
            script {
                echo "=== Pipeline completed ==="
                sh '''
                    # Final cleanup
                    docker rm -f mongo-ci backend-ci frontend-ci 2>/dev/null || true
                    docker rmi selenium-ci-tests:latest 2>/dev/null || true
                '''
            }
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
