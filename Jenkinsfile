pipeline {
    agent any
    
    stages {
        stage('Cleanup Previous Run') {
            steps {
                script {
                    echo "=== Cleaning previous CI containers and networks ==="
                    sh '''
                        # Stop and remove containers
                        docker rm -f mongo-ci backend-ci frontend-ci selenium-hub 2>/dev/null || true
                        
                        # Remove network (force remove even if containers are attached)
                        docker network rm ci-network 2>/dev/null || true
                        
                        # Extra cleanup: remove any dangling networks
                        docker network prune -f || true
                        
                        # Verify network is gone
                        if docker network ls | grep -q ci-network; then
                            echo "Warning: ci-network still exists, forcing removal..."
                            docker network inspect ci-network -f '{{range .Containers}}{{.Name}} {{end}}' | xargs -r docker rm -f || true
                            docker network rm ci-network || true
                        fi
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
        
        stage('Setup Infrastructure') {
            steps {
                sh '''
                    echo "=== Creating Docker network ==="
                    docker network create ci-network || {
                        echo "Network creation failed, attempting cleanup and retry..."
                        docker network rm ci-network 2>/dev/null || true
                        sleep 2
                        docker network create ci-network
                    }
                    
                    echo "=== Starting Selenium Grid Hub ==="
                    docker run -d --name selenium-hub --network ci-network \
                        --shm-size=2g \
                        -p 4444:4444 \
                        selenium/standalone-chrome:latest
                    
                    echo "=== Verifying Selenium Hub started ==="
                    docker ps | grep selenium-hub
                '''
            }
        }
        
        stage('Start Application Services') {
            steps {
                dir('website') {
                    sh '''
                        echo "=== Starting application containers ==="
                        docker compose up -d --no-build
                        
                        echo "=== Waiting for services to be ready ==="
                        sleep 15
                        
                        echo "=== Checking backend health ==="
                        for i in $(seq 1 20); do
                            if docker exec backend-ci curl -s http://localhost:5050/health > /dev/null 2>&1 || \
                               docker exec backend-ci curl -s http://localhost:5050 > /dev/null 2>&1; then
                                echo "✓ Backend is ready"
                                break
                            fi
                            echo "Waiting for backend... ($i/20)"
                            sleep 3
                        done
                        
                        echo "=== Running containers ==="
                        docker ps
                    '''
                }
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
                    curl -s http://localhost:4444/status || true
                '''
            }
        }
        
        stage('Build Test Image') {
            steps {
                dir('tests') {
                    sh '''
                        echo "=== Building test Docker image ==="
                        docker build -t selenium-tests:latest .
                    '''
                }
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                sh '''
                    echo "=== Running Selenium test suite ==="
                    docker run --rm --network ci-network \
                        -e BASE_URL=http://frontend-ci:5173 \
                        -e SELENIUM_HOST=selenium-hub \
                        selenium-tests:latest
                '''
            }
        }
    }
    
    post {
        always {
            echo "=== Cleaning up ==="
            sh '''
                # Stop docker compose services
                cd website 2>/dev/null && docker compose down || true
                
                # Remove all CI containers
                docker rm -f mongo-ci backend-ci frontend-ci selenium-hub 2>/dev/null || true
                
                # Remove network
                docker network rm ci-network 2>/dev/null || true
                
                # Clean up test image
                docker rmi selenium-tests:latest 2>/dev/null || true
            '''
            echo "=== Pipeline Completed ==="
        }
        success {
            echo '✅ All tests passed successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Check logs above.'
        }
    }
}
