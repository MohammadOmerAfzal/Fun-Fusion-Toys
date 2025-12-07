pipeline {
    agent any
    
    stages {
        stage('Cleanup Previous Run') {
            steps {
                script {
                    echo "=== Cleaning previous CI containers and networks ==="
                    sh '''
                        docker rm -f mongo-ci backend-ci frontend-ci selenium-hub 2>/dev/null || true
                        docker network rm ci-network 2>/dev/null || true
                    '''
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
                    docker network create ci-network
                    
                    echo "=== Starting Selenium Grid Hub ==="
                    docker run -d --name selenium-hub --network ci-network \\
                        --shm-size=2g \\
                        -p 4444:4444 \\
                        selenium/standalone-chrome:latest
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
                        
                        for i in $(seq 1 20); do
                            if curl -s http://backend-ci:5050 > /dev/null 2>&1; then
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
                    docker run --rm --network ci-network \\
                        -e BASE_URL=http://frontend-ci:5173 \\
                        -e SELENIUM_HOST=selenium-hub \\
                        selenium-tests:latest
                '''
            }
        }
    }
    
    post {
        always {
            echo "=== Cleaning up ==="
            sh '''
                docker rm -f mongo-ci backend-ci frontend-ci selenium-hub 2>/dev/null || true
                docker network rm ci-network 2>/dev/null || true
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
