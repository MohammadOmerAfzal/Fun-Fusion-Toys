pipeline {
    agent any
    stages {
        stage('Cleanup Previous Run') {
            steps {
                script {
                    echo "=== Cleaning previous CI containers and networks ==="
                    sh '''
                        docker rm -f mongo-ci backend-ci frontend-ci selenium-node-ci 2>/dev/null || true
                        docker network prune -f 2>/dev/null || true
                    '''
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
        stage('Clone Selenium Tests') {
            steps {
                dir('selenium-tests') {
                    git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
                }
            }
        }
        stage('Start Website Services') {
            steps {
                dir('website') {
                    sh '''
                        echo "=== Starting Website CI containers ==="
                        docker network create ci-network || true
                        docker compose up -d --no-build
                        echo "Waiting for backend to be ready..."
                        for i in $(seq 1 30); do
                            if curl -s http://backend-ci:5050 > /dev/null; then
                                echo "✓ Backend ready"
                                break
                            fi
                            echo "Waiting..."
                            sleep 2
                        done
                        docker ps
                    '''
                }
            }
        }
        stage('Build Selenium Test Image') {
            steps {
                dir('selenium-tests') {
                    sh '''
                        echo "=== Building Selenium test image ==="
                        docker build -t selenium-ci-tests:latest .
                    '''
                }
            }
        }
        stage('Run Selenium Tests') {
            steps {
                script {
                    sh '''
                        echo "=== Starting Selenium Chrome container ==="
                        docker run -d --name selenium-node-ci --network ci-network \\
                            --shm-size=2g \\
                            selenium/standalone-chrome:121.0
                        
                        echo "=== Waiting for Selenium Grid to be fully ready ==="
                        READY=false
                        for i in $(seq 1 90); do
                            # Check if container is running
                            if ! docker ps | grep -q selenium-node-ci; then
                                echo "❌ Selenium container died"
                                docker logs selenium-node-ci
                                exit 1
                            fi
                            
                            # Check Selenium status endpoint
                            STATUS=$(docker exec selenium-node-ci curl -s http://localhost:4444/wd/hub/status 2>/dev/null || echo "")
                            
                            if echo "$STATUS" | grep -q '\\"ready\\":true'; then
                                echo "✓ Selenium Grid is ready!"
                                READY=true
                                break
                            fi
                            
                            echo "⏳ Waiting for Selenium... (attempt $i/90)"
                            sleep 2
                        done
                        
                        if [ "$READY" = "false" ]; then
                            echo "❌ Selenium Grid failed to become ready in time"
                            docker logs selenium-node-ci
                            exit 1
                        fi
                        
                        # Additional stabilization time
                        echo "⏳ Waiting 10 more seconds for complete stabilization..."
                        sleep 10
                        
                        # Verify network connectivity
                        echo "=== Testing network connectivity ==="
                        docker run --rm --network ci-network alpine sh -c "ping -c 2 selenium-node-ci" || true
                        
                        echo "=== Final Selenium status ==="
                        docker exec selenium-node-ci curl -s http://localhost:4444/wd/hub/status || true
                        
                        echo "=== Running Selenium tests ==="
                        docker run --rm --network ci-network \\
                            -e BASE_URL=http://frontend-ci:5173 \\
                            -e SELENIUM_HOST=selenium-node-ci \\
                            selenium-ci-tests:latest
                    '''
                }
            }
        }
        stage('Cleanup') {
            steps {
                sh '''
                    echo "=== Cleaning CI containers ==="
                    docker rm -f mongo-ci backend-ci frontend-ci selenium-node-ci 2>/dev/null || true
                    docker network rm ci-network 2>/dev/null || true
                '''
            }
        }
    }
    post {
        always { echo "=== Pipeline Completed ===" }
        success { echo '✅ Pipeline succeeded!' }
        failure { echo '❌ Pipeline failed!' }
    }
}
