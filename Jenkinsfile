pipeline {
    agent any

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Clone Repositories') {
            steps {
                dir('website') {
                    git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
                }
                dir('selenium-tests') {
                    git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
                }
            }
        }

        stage('Cleanup Specific Containers') {
            steps {
                script {
                    // Only cleanup containers that might conflict with our CI run
                    // Don't touch other unrelated containers
                    sh '''
                        echo "=== Stopping and removing CI-related containers ==="
                        
                        # Stop and remove containers that would conflict with our compose file
                        docker rm -f mongo-ci backend-ci 2>/dev/null || true
                        
                        # Clean up any old networks
                        docker network rm ci-network website_default 2>/dev/null || true
                    '''
                }
            }
        }

        stage('Build & Run Website with Unique Names') {
            steps {
                dir('website') {
                    script {
                        // Use unique container names for CI run to avoid conflicts
                        sh '''
                            # Create network
                            docker network create ci-network 2>/dev/null || true
                            
                            # Build and start with unique names
                            docker compose -p funfusion-ci up -d --build --remove-orphans
                        '''
                    }
                }
            }
        }

        stage('Wait for Website to be Ready') {
            steps {
                script {
                    // Give containers time to start
                    sleep 15
                    
                    sh '''
                        echo "=== Checking CI containers ==="
                        docker ps --filter "name=funfusion-ci"
                        
                        echo "=== Waiting for web service on port 8000 ==="
                        
                        # Try multiple times to reach the service
                        for i in {1..15}; do
                            echo "Attempt $i/15 to check web service..."
                            if curl -s -f http://localhost:8000 > /dev/null 2>&1; then
                                echo "✓ Web service is responding!"
                                break
                            elif [ $i -eq 15 ]; then
                                echo "✗ Web service did not respond after 15 attempts"
                                echo "Debug info:"
                                docker ps
                                docker logs funfusion-ci-backend-ci-1 2>/dev/null || echo "Could not get backend logs"
                                exit 1
                            fi
                            sleep 5
                        done
                    '''
                }
            }
        }

        stage('Build Selenium Test Image') {
            steps {
                dir('selenium-tests') {
                    sh 'docker build -t selenium-tests-ci:latest .'
                }
            }
        }

        stage('Run Selenium Tests') {
            steps {
                script {
                    sh '''
                        echo "=== Running Selenium Tests ==="
                        
                        # Get the actual container name
                        WEB_CONTAINER=$(docker ps --filter "name=funfusion-ci" --filter "ancestor=projects-backend" --format "{{.Names}}")
                        
                        if [ -z "$WEB_CONTAINER" ]; then
                            WEB_CONTAINER=$(docker ps --filter "name=backend" --format "{{.Names}}")
                        fi
                        
                        if [ -n "$WEB_CONTAINER" ]; then
                            echo "Testing against container: $WEB_CONTAINER"
                            # Get container IP
                            WEB_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $WEB_CONTAINER)
                            echo "Container IP: $WEB_IP"
                            
                            # Run tests
                            docker run --network ci-network --rm \
                                -e BASE_URL="http://$WEB_IP:8000" \
                                selenium-tests-ci:latest
                        else
                            echo "WARNING: Could not find web container, trying localhost..."
                            docker run --network ci-network --rm \
                                -e BASE_URL="http://host.docker.internal:8000" \
                                selenium-tests-ci:latest
                        fi
                    '''
                }
            }
        }

        stage('Cleanup CI Resources') {
            steps {
                script {
                    sh '''
                        echo "=== Cleaning up CI resources ==="
                        
                        # Stop and remove only our CI containers
                        docker compose -p funfusion-ci down 2>/dev/null || true
                        
                        # Remove our test image
                        docker rmi selenium-tests-ci:latest 2>/dev/null || true
                        
                        # Remove network if no containers are using it
                        docker network rm ci-network 2>/dev/null || true
                        
                        echo "=== Current running containers (should leave others untouched) ==="
                        docker ps
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                // Always try to cleanup our CI resources
                sh '''
                    echo "=== Post-build cleanup ==="
                    docker compose -p funfusion-ci down 2>/dev/null || true
                    docker rmi selenium-tests-ci:latest 2>/dev/null || true
                    docker network rm ci-network 2>/dev/null || true
                '''
            }
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
