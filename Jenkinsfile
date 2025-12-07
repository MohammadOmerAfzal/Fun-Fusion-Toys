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
                            -e SE_NODE_SESSION_TIMEOUT=300 \\
                            -e SE_NODE_MAX_SESSIONS=5 \\
                            selenium/standalone-chrome:latest
                        
                        echo "=== Waiting for Selenium to start (simple approach) ==="
                        echo "Giving Selenium 60 seconds to fully initialize..."
                        sleep 60
                        
                        echo "=== Checking Selenium container status ==="
                        docker ps | grep selenium-node-ci
                        
                        echo "=== Checking if Selenium is responding ==="
                        for i in $(seq 1 20); do
                            if docker exec selenium-node-ci curl -s http://localhost:4444/status > /dev/null 2>&1; then
                                echo "✓ Selenium is responding!"
                                break
                            fi
                            echo "Attempt $i/20..."
                            sleep 3
                        done
                        
                        echo "=== Selenium logs ==="
                        docker logs selenium-node-ci | tail -20
                        
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
