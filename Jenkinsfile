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
                        for i in {1..30}; do
                            if curl -s -f http://backend-ci:5050 > /dev/null; then
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
                    sh """
                        echo "=== Starting Selenium Chrome container ==="

                        docker run -d --name selenium-node-ci --network ci-network \
                            selenium/standalone-chrome:4.18.1

                        echo "Waiting for Selenium to be ready..."
                        for i in {1..40}; do
                            if curl -s -f http://selenium-node-ci:4444/wd/hub/status > /dev/null; then
                                echo "✓ Selenium ready"
                                break
                            fi
                            echo "Waiting..."
                            sleep 2
                        done

                        echo "=== Running tests ==="
                        docker run --rm --network ci-network \
                            -e BASE_URL=http://frontend-ci:5173 \
                            -e SELENIUM_HOST=selenium-node-ci \
                            selenium-ci-tests:latest
                    """
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
