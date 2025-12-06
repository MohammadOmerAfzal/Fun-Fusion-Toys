pipeline {
    agent any
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }
    
    stages {
        stage('Clone Selenium Tests') {
            steps {
                dir('selenium-tests') {
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        extensions: [[$class: 'CleanBeforeCheckout']],
                        userRemoteConfigs: [[
                            credentialsId: '6c5d2448-b572-4d2e-8f3f-69f93514cf75',
                            url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
                        ]]
                    ])
                }
            }
        }
        
        stage('Cleanup Previous Containers') {
            steps {
                sh '''
                echo "=== Cleaning up previous containers ==="
                docker compose down 2>/dev/null || true
                docker system prune -f 2>/dev/null || true
                '''
            }
        }
        
        stage('Start Docker Services') {
            steps {
                sh '''
                echo "=== Starting Docker services ==="
                
                # Check docker-compose file exists
                if [ ! -f "docker-compose.yml" ]; then
                    echo "ERROR: docker-compose.yml not found!"
                    ls -la
                    exit 1
                fi
                
                # Show docker-compose content for debugging
                echo "=== docker-compose.yml content (first 100 lines) ==="
                head -100 docker-compose.yml
                
                # Build and start services with force recreation
                docker compose up -d --build --force-recreate
                
                # Give containers time to start
                sleep 10
                
                # Check container status
                echo "=== Container Status ==="
                docker ps -a
                
                # Check specific service status
                echo "=== Checking specific services ==="
                docker compose ps
                '''
            }
        }
        
        stage('Wait for Services') {
            steps {
                sh '''
                echo "=== Waiting for services to be ready ==="
                
                # Wait longer for services to fully start
                MAX_WAIT=180
                WAIT_TIME=0
                
                while [ $WAIT_TIME -lt $MAX_WAIT ]; do
                    # Check if containers are running
                    FRONTEND_STATUS=$(docker compose ps --format json frontend-ci 2>/dev/null | jq -r '.State' || echo "unknown")
                    BACKEND_STATUS=$(docker compose ps --format json backend-ci 2>/dev/null | jq -r '.State' || echo "unknown")
                    
                    echo "Frontend status: $FRONTEND_STATUS"
                    echo "Backend status: $BACKEND_STATUS"
                    
                    if [ "$FRONTEND_STATUS" = "running" ] && [ "$BACKEND_STATUS" = "running" ]; then
                        echo "All services are running!"
                        break
                    fi
                    
                    echo "Waiting for services... ($((WAIT_TIME))s/$MAX_WAIT)"
                    sleep 10
                    WAIT_TIME=$((WAIT_TIME + 10))
                done
                
                if [ $WAIT_TIME -ge $MAX_WAIT ]; then
                    echo "WARNING: Services took too long to start"
                fi
                
                # Show logs for debugging
                echo "=== Recent Container Logs ==="
                docker compose logs --tail=30
                '''
            }
        }
        
        stage('Health Check Services') {
            steps {
                sh '''
                echo "=== Performing health checks ==="
                
                # Method 1: Try from host (if ports are mapped)
                echo "Trying to access from host..."
                if curl -s -f --max-time 10 http://localhost:3000 > /dev/null; then
                    echo "✓ Frontend is accessible on localhost:3000"
                else
                    echo "✗ Frontend not accessible on localhost:3000"
                    echo "Trying alternative method..."
                    
                    # Method 2: Get container IP and try from host network
                    FRONTEND_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' frontend-ci 2>/dev/null || echo "")
                    if [ -n "$FRONTEND_IP" ]; then
                        echo "Frontend container IP: $FRONTEND_IP"
                        if curl -s -f --max-time 10 http://$FRONTEND_IP:3000 > /dev/null; then
                            echo "✓ Frontend is accessible on container IP"
                        fi
                    fi
                    
                    # Method 3: Try from within container network
                    echo "Testing from within container network..."
                    docker compose exec -T frontend-ci sh -c 'curl -s -f http://localhost:3000 > /dev/null && echo "✓ Frontend responding internally" || echo "✗ Frontend not responding internally"'
                fi
                
                # Check backend
                echo "Checking backend..."
                if curl -s -f --max-time 10 http://localhost:5000 > /dev/null; then
                    echo "✓ Backend is accessible on localhost:5000"
                else
                    echo "✗ Backend not accessible on localhost:5000"
                    docker compose exec -T backend-ci sh -c 'curl -s -f http://localhost:5000 > /dev/null && echo "✓ Backend responding internally" || echo "✗ Backend not responding internally"'
                fi
                
                # Show port mappings
                echo "=== Port Mappings ==="
                docker port frontend-ci 2>/dev/null || echo "Frontend port mapping not found"
                docker port backend-ci 2>/dev/null || echo "Backend port mapping not found"
                '''
            }
        }
        
        stage('Setup Test Environment') {
            steps {
                dir('selenium-tests') {
                    sh '''
                    echo "=== Setting up test environment ==="
                    
                    # Create and activate virtual environment
                    python3 -m venv venv
                    source venv/bin/activate
                    
                    # Upgrade pip and install dependencies
                    pip install --upgrade pip
                    pip install -r requirements.txt
                    
                    # List installed packages for debugging
                    echo "=== Installed Python packages ==="
                    pip list
                    
                    # Check if test file exists
                    if [ ! -f "test/test_main.py" ]; then
                        echo "ERROR: test/test_main.py not found!"
                        find . -name "*.py" | head -20
                        exit 1
                    fi
                    
                    # Show test file for debugging
                    echo "=== Test file content (first 50 lines) ==="
                    head -50 test/test_main.py || echo "Could not read test file"
                    '''
                }
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                dir('selenium-tests') {
                    sh '''
                    echo "=== Running Selenium Tests ==="
                    source venv/bin/activate
                    
                    # Determine the URL to test
                    FRONTEND_URL="http://localhost:3000"
                    
                    # Check if frontend is accessible
                    if curl -s -f --max-time 5 http://localhost:3000 > /dev/null; then
                        echo "Using localhost:3000 for tests"
                    else
                        # Try to get container IP
                        FRONTEND_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' frontend-ci 2>/dev/null || echo "")
                        if [ -n "$FRONTEND_IP" ]; then
                            FRONTEND_URL="http://$FRONTEND_IP:3000"
                            echo "Using container IP: $FRONTEND_URL"
                        else
                            echo "WARNING: Could not determine frontend URL"
                            FRONTEND_URL="http://frontend-ci:3000"
                            echo "Using service name: $FRONTEND_URL"
                        fi
                    fi
                    
                    echo "Testing URL: $FRONTEND_URL"
                    
                    # Export URL for tests to use
                    export FRONTEND_URL
                    
                    # Run tests with timeout
                    timeout 300 python test/test_main.py
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo "=== Pipeline Complete ==="
            sh '''
            echo "=== Final Cleanup ==="
            
            # Save logs before cleanup
            echo "=== Saving container logs ==="
            docker compose logs --no-color --tail=1000 > docker_logs.txt 2>/dev/null || true
            
            # Stop and remove containers
            echo "Stopping containers..."
            docker compose down --remove-orphans 2>/dev/null || true
            
            # Clean up Docker resources
            echo "Cleaning up Docker resources..."
            docker system prune -f 2>/dev/null || true
            
            # Show final disk usage
            echo "=== Disk Usage ==="
            df -h . || true
            '''
            
            archiveArtifacts artifacts: 'docker_logs.txt', allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo '✅ Pipeline succeeded!'
        }
        failure {
            echo '❌ Pipeline failed!'
            sh '''
            echo "=== Debugging Information ==="
            echo "Last 100 lines of container logs:"
            tail -100 docker_logs.txt 2>/dev/null || docker compose logs --tail=100 2>/dev/null || true
            
            echo "=== Container Status ==="
            docker ps -a 2>/dev/null || true
            
            echo "=== Docker Compose Status ==="
            docker compose ps 2>/dev/null || true
            '''
        }
        unstable {
            echo '⚠️ Pipeline unstable!'
        }
        aborted {
            echo '🛑 Pipeline aborted!'
        }
    }
}
