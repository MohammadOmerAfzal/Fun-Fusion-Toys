pipeline {
    agent any
    
    environment {
        EC2_PUBLIC_IP = '3.214.127.147'
    }
    
    stages {
        stage('Cleanup Previous Run') {
            steps {
                script {
                    echo "=== Cleaning previous CI containers and networks ==="
                    sh '''
                        # Stop docker compose if running
                        if [ -d "website" ]; then
                            cd website && docker compose down 2>/dev/null || true
                            cd ..
                        fi
                        
                        # Remove all CI containers
                        docker rm -f mongo-ci backend-ci frontend-ci selenium-hub selenium-tests 2>/dev/null || true
                        
                        # Remove networks
                        docker network rm ci-network 2>/dev/null || true
                        
                        # Extra cleanup
                        docker network prune -f || true
                        
                        echo "✓ Cleanup completed"
                    '''
                }
            }
        }
        
        stage('Clean Workspace') {
            steps {
                script {
                    cleanWs(cleanWhenNotBuilt: false, deleteDirs: true)
                }
            }
        }
        
        stage('Clone Repositories') {
            parallel {
                stage('Clone Website') {
                    steps {
                        dir('website') {
                            git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
                        }
                    }
                }
                stage('Clone Tests') {
                    steps {
                        dir('tests') {
                            git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
                        }
                    }
                }
            }
        }
        
        stage('Create Network') {
            steps {
                sh '''
                    echo "=== Creating shared Docker network ==="
                    docker network create ci-network
                    echo "✓ Network created"
                '''
            }
        }
        
        stage('Build and Start Website') {
            steps {
                dir('website') {
                    sh '''
                        echo "=== Building and starting application services ==="
                        
                        # Update docker-compose.yml to use ci-network
                        export COMPOSE_PROJECT_NAME=ci
                        
                        docker compose up -d --build
                        
                        echo "=== Connecting containers to ci-network ==="
                        docker network connect ci-network mongo-ci 2>/dev/null || true
                        docker network connect ci-network backend-ci 2>/dev/null || true
                        docker network connect ci-network frontend-ci 2>/dev/null || true
                        
                        echo "=== Running containers ==="
                        docker ps --filter "name=ci"
                    '''
                }
            }
        }
        
        stage('Wait for Application Ready') {
            steps {
                sh '''
                    echo "=== Waiting for application services to be ready ==="
                    
                    # Wait for MongoDB
                    echo "Checking MongoDB..."
                    for i in $(seq 1 30); do
                        if docker exec mongo-ci mongosh --eval "db.runCommand({ ping: 1 })" >/dev/null 2>&1; then
                            echo "✓ MongoDB is ready"
                            break
                        fi
                        echo "Waiting for MongoDB... ($i/30)"
                        sleep 2
                    done
                    
                    # Wait for Backend
                    echo "Checking Backend..."
                    for i in $(seq 1 30); do
                        if docker exec backend-ci wget -q -O- http://localhost:5050 >/dev/null 2>&1 || \
                           docker logs backend-ci 2>&1 | grep -q "listening\\|started\\|ready"; then
                            echo "✓ Backend is ready"
                            break
                        fi
                        echo "Waiting for Backend... ($i/30)"
                        sleep 2
                    done
                    
                    # Wait for Frontend
                    echo "Checking Frontend..."
                    for i in $(seq 1 30); do
                        if docker exec frontend-ci wget -q -O- http://localhost:5173 >/dev/null 2>&1 || \
                           docker logs frontend-ci 2>&1 | grep -q "ready\\|Local"; then
                            echo "✓ Frontend is ready"
                            break
                        fi
                        echo "Waiting for Frontend... ($i/30)"
                        sleep 2
                    done
                    
                    echo "=== All application services are ready ==="
                    sleep 5
                '''
            }
        }
        
        stage('Start Selenium Grid') {
            steps {
                sh '''
                    echo "=== Starting Selenium Grid Hub ==="
                    docker run -d --name selenium-hub \
                        --network ci-network \
                        --shm-size=2g \
                        -p 4444:4444 \
                        selenium/standalone-chrome:latest
                    
                    echo "=== Verifying Selenium Hub started ==="
                    docker ps | grep selenium-hub
                '''
            }
        }
        
        stage('Wait for Selenium Grid') {
            steps {
                sh '''
                    echo "=== Waiting for Selenium Grid to be ready ==="
                    
                    for i in $(seq 1 30); do
                        STATUS=$(curl -s http://localhost:4444/status 2>/dev/null || echo "")
                        if echo "$STATUS" | grep -q '"ready":true'; then
                            echo "✓ Selenium Grid is ready!"
                            break
                        fi
                        echo "Waiting for Selenium Grid... ($i/30)"
                        sleep 3
                    done
                    
                    echo "=== Selenium Grid Status ==="
                    curl -s http://localhost:4444/status | python3 -m json.tool || true
                '''
            }
        }
        
        stage('Build Test Image') {
            steps {
                dir('tests') {
                    sh '''
                        echo "=== Building test Docker image ==="
                        docker build -t selenium-tests:latest .
                        echo "✓ Test image built"
                    '''
                }
            }
        }
        
        stage('Verify Network Connectivity') {
            steps {
                sh '''
                    echo "=== Verifying network connectivity ==="
                    
                    echo "Containers on ci-network:"
                    docker network inspect ci-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{println}}{{end}}'
                    
                    echo "Testing connectivity from selenium-hub to frontend-ci..."
                    docker exec selenium-hub ping -c 2 frontend-ci || echo "Warning: Cannot ping frontend"
                    
                    echo "Testing connectivity from selenium-hub to backend-ci..."
                    docker exec selenium-hub ping -c 2 backend-ci || echo "Warning: Cannot ping backend"
                '''
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                sh '''
                    echo "=== Running Selenium test suite ==="
                    
                    docker run --rm --name selenium-tests \
                        --network ci-network \
                        -e BASE_URL=http://frontend-ci:5173 \
                        -e SELENIUM_HOST=selenium-hub \
                        -e SELENIUM_PORT=4444 \
                        selenium-tests:latest || {
                        echo "Tests failed! Showing container logs..."
                        echo "=== Frontend Logs ==="
                        docker logs frontend-ci --tail 50
                        echo "=== Backend Logs ==="
                        docker logs backend-ci --tail 50
                        echo "=== Selenium Hub Logs ==="
                        docker logs selenium-hub --tail 50
                        exit 1
                    }
                    
                    echo "✓ All tests passed!"
                '''
            }
        }
    }
    
    post {
        always {
            echo "=== Cleaning up ==="
            sh '''
                # Get logs before cleanup (for debugging)
                echo "=== Saving logs ==="
                docker logs frontend-ci > frontend-ci.log 2>&1 || true
                docker logs backend-ci > backend-ci.log 2>&1 || true
                docker logs mongo-ci > mongo-ci.log 2>&1 || true
                docker logs selenium-hub > selenium-hub.log 2>&1 || true
                
                # Stop docker compose services
                cd website 2>/dev/null && docker compose down || true
                cd ..
                
                # Remove all CI containers
                docker rm -f mongo-ci backend-ci frontend-ci selenium-hub selenium-tests 2>/dev/null || true
                
                # Remove network
                docker network rm ci-network 2>/dev/null || true
                
                # Clean up test image
                docker rmi selenium-tests:latest 2>/dev/null || true
                
                echo "✓ Cleanup completed"
            '''
            
            // Archive logs
            archiveArtifacts artifacts: '*.log', allowEmptyArchive: true
            
            echo "=== Pipeline Completed ==="
        }
        success {
            echo '✅ All tests passed successfully!'
            echo "=== Application was accessible at: http://${EC2_PUBLIC_IP}:5173 ==="
        }
        failure {
            echo '❌ Pipeline failed! Check logs above.'
            echo 'Logs have been archived - check the build artifacts.'
        }
    }
}
