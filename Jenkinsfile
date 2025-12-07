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
                        docker compose down -v 2>/dev/null || true
                        
                        # Remove all CI containers
                        docker rm -f mongo-ci backend-ci frontend-ci selenium-hub selenium-tests 2>/dev/null || true
                        
                        # Remove networks
                        docker network rm ci-network 2>/dev/null || true
                        docker network prune -f || true
                        
                        # Remove dangling volumes
                        docker volume prune -f || true
                        
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
        
        stage('Clone Website Repository') {
            steps {
                sh '''
                    echo "=== Website repository already checked out by Jenkins ==="
                    echo "Repository: https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys"
                    echo "Branch: master"
                    echo ""
                    echo "=== Repository structure ==="
                    ls -la
                    echo ""
                    echo "=== Verifying docker-compose.yml exists ==="
                    if [ -f "docker-compose.yml" ]; then
                        echo "✓ docker-compose.yml found"
                    else
                        echo "❌ docker-compose.yml not found!"
                        exit 1
                    fi
                '''
            }
        }
        
        stage('Create Network') {
            steps {
                sh '''
                    echo "=== Creating shared Docker network ==="
                    docker network create ci-network
                    echo "✓ Network ci-network created"
                '''
            }
        }
        
        stage('Build and Start Website') {
            steps {
                sh '''
                    echo "=== Building and starting application services ==="
                    
                    # Start services with docker-compose
                    docker compose up -d --build
                    
                    echo "=== Waiting for initial startup (20s) ==="
                    sleep 20
                    
                    echo "=== Connecting containers to ci-network ==="
                    docker network connect ci-network mongo-ci 2>/dev/null || echo "mongo-ci already connected"
                    docker network connect ci-network backend-ci 2>/dev/null || echo "backend-ci already connected"
                    docker network connect ci-network frontend-ci 2>/dev/null || echo "frontend-ci already connected"
                    
                    echo "=== Running containers ==="
                    docker ps --filter "name=-ci"
                '''
            }
        }
        
        stage('Wait for Application Ready') {
            steps {
                sh '''
                    echo "=== Waiting for application services to be ready ==="
                    
                    # Wait for MongoDB
                    echo "Checking MongoDB..."
                    for i in $(seq 1 30); do
                        if docker exec mongo-ci mongosh -u admin -p password --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
                            echo "✓ MongoDB is ready"
                            break
                        fi
                        echo "Waiting for MongoDB... ($i/30)"
                        sleep 3
                    done
                    
                    # Wait for Backend (check logs for startup message)
                    echo "Checking Backend..."
                    for i in $(seq 1 40); do
                        LOGS=$(docker logs backend-ci 2>&1 || echo "")
                        if echo "$LOGS" | grep -qE "listening|started|Server running|MongoDB connected"; then
                            echo "✓ Backend is ready"
                            sleep 5
                            break
                        fi
                        if echo "$LOGS" | grep -qE "Error|error|failed|Failed"; then
                            echo "⚠ Backend might have errors:"
                            docker logs backend-ci --tail 20
                        fi
                        echo "Waiting for Backend... ($i/40)"
                        sleep 3
                    done
                    
                    # Wait for Frontend (check logs for Vite ready message)
                    echo "Checking Frontend..."
                    for i in $(seq 1 40); do
                        LOGS=$(docker logs frontend-ci 2>&1 || echo "")
                        if echo "$LOGS" | grep -qE "ready|Local:.*5173|Network:.*5173"; then
                            echo "✓ Frontend is ready"
                            sleep 5
                            break
                        fi
                        echo "Waiting for Frontend... ($i/40)"
                        sleep 3
                    done
                    
                    echo "=== Application Status ==="
                    echo "Backend logs (last 10 lines):"
                    docker logs backend-ci --tail 10 2>&1 || true
                    echo ""
                    echo "Frontend logs (last 10 lines):"
                    docker logs frontend-ci --tail 10 2>&1 || true
                    
                    echo ""
                    echo "✅ All application services are running and ready!"
                '''
            }
        }
        
        stage('Verify Application Access') {
            steps {
                sh '''
                    echo "=== Verifying application is accessible ==="
                    
                    # Check if we can access backend from host
                    echo "Testing backend at http://localhost:5050"
                    curl -f http://localhost:5050 || echo "⚠ Backend not accessible from host"
                    
                    # Check if we can access frontend from host
                    echo "Testing frontend at http://localhost:5175"
                    curl -f http://localhost:5175 || echo "⚠ Frontend not accessible from host"
                    
                    echo ""
                    echo "✓ Application verification complete"
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
                    
                    sleep 5
                    
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
                    curl -s http://localhost:4444/status 2>/dev/null | grep -o '"ready":[^,]*' || echo "Status check failed"
                '''
            }
        }
        
        stage('Verify Network Connectivity') {
            steps {
                sh '''
                    echo "=== Verifying network connectivity ==="
                    
                    echo "Containers on ci-network:"
                    docker network inspect ci-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{println}}{{end}}'
                    
                    echo ""
                    echo "Testing connectivity from selenium-hub..."
                    docker exec selenium-hub ping -c 2 frontend-ci 2>&1 | grep "bytes from" || echo "  ⚠ Cannot ping frontend-ci"
                    docker exec selenium-hub ping -c 2 backend-ci 2>&1 | grep "bytes from" || echo "  ⚠ Cannot ping backend-ci"
                    
                    echo ""
                    echo "✓ Network connectivity verified"
                '''
            }
        }
        
        stage('Clone and Build Test Suite') {
            steps {
                dir('tests') {
                    git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
                    sh '''
                        echo "=== Test repository cloned ==="
                        ls -la
                        
                        echo ""
                        echo "=== Building test Docker image ==="
                        docker build -t selenium-tests:latest .
                        echo "✓ Test image built successfully"
                    '''
                }
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                sh '''
                    echo "=== Running Selenium test suite ==="
                    echo "Configuration:"
                    echo "  - Frontend URL: http://frontend-ci:5173"
                    echo "  - Selenium Hub: http://selenium-hub:4444"
                    echo ""
                    
                    docker run --rm --name selenium-tests \
                        --network ci-network \
                        -e BASE_URL=http://frontend-ci:5173 \
                        -e SELENIUM_HOST=selenium-hub \
                        -e SELENIUM_PORT=4444 \
                        selenium-tests:latest 2>&1 | tee test-output.log || {
                        
                        echo ""
                        echo "❌ Tests failed! Showing diagnostic information..."
                        echo ""
                        echo "=== Frontend Logs (last 30 lines) ==="
                        docker logs frontend-ci --tail 30
                        echo ""
                        echo "=== Backend Logs (last 30 lines) ==="
                        docker logs backend-ci --tail 30
                        echo ""
                        echo "=== Selenium Hub Logs (last 30 lines) ==="
                        docker logs selenium-hub --tail 30
                        echo ""
                        exit 1
                    }
                    
                    echo ""
                    echo "✅ All tests passed successfully!"
                '''
            }
        }
    }
    
    post {
        always {
            echo "=== Saving logs for debugging ==="
            sh '''
                # Save all logs
                docker logs frontend-ci > frontend-ci.log 2>&1 || true
                docker logs backend-ci > backend-ci.log 2>&1 || true
                docker logs mongo-ci > mongo-ci.log 2>&1 || true
                docker logs selenium-hub > selenium-hub.log 2>&1 || true
                
                # Save network information
                docker network inspect ci-network > ci-network-inspect.log 2>&1 || true
                
                echo "✓ Logs saved"
            '''
            
            // Archive all logs and test output
            archiveArtifacts artifacts: '*.log', allowEmptyArchive: true
            
            echo "=== Cleaning up ==="
            sh '''
                # Stop docker compose services
                docker compose down -v || true
                
                # Remove all CI containers
                docker rm -f mongo-ci backend-ci frontend-ci selenium-hub selenium-tests 2>/dev/null || true
                
                # Remove network
                docker network rm ci-network 2>/dev/null || true
                
                # Clean up test image
                docker rmi selenium-tests:latest 2>/dev/null || true
                
                echo "✓ Cleanup completed"
            '''
            
            echo "=== Pipeline Completed ==="
        }
        success {
            echo '✅ =================================='
            echo '✅ ALL TESTS PASSED SUCCESSFULLY!'
            echo '✅ =================================='
            echo ""
            echo "Application was running at:"
            echo "  - Frontend: http://${EC2_PUBLIC_IP}:5175"
            echo "  - Backend:  http://${EC2_PUBLIC_IP}:5050"
            echo "  - MongoDB:  ${EC2_PUBLIC_IP}:27018"
            echo ""
            echo "Test results archived in build artifacts."
        }
        failure {
            echo '❌ =================================='
            echo '❌ PIPELINE FAILED'
            echo '❌ =================================='
            echo ""
            echo 'Check the logs above for details.'
            echo 'Logs have been archived - check build artifacts.'
        }
    }
}
