pipeline {
    agent any

    environment {
        BACKEND_URL = "http://3.214.127.147:5050"
    }

    stages {

        /* -----------------------------
           1) CLEAN PREVIOUS CI RUN
        ------------------------------ */
        stage('Cleanup Previous Run') {
            steps {
                script {
                    echo "=== Cleaning previous CI containers and networks ==="
                    sh '''
                        docker rm -f mongo-ci backend-ci frontend-ci selenium-ci 2>/dev/null || true
                        docker network prune -f 2>/dev/null || true
                    '''
                    cleanWs(cleanWhenNotBuilt: false, deleteDirs: true)
                }
            }
        }

        /* -----------------------------
           2) CLONE WEBSITE
        ------------------------------ */
        stage('Clone Website') {
            steps {
                dir('website') {
                    git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
                }
            }
        }

        /* -----------------------------
           3) CLONE SELENIUM TESTS
        ------------------------------ */
        stage('Clone Selenium Tests') {
            steps {
                dir('selenium-tests') {
                    git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
                }
            }
        }

        /* -----------------------------
           4) START WEBSITE SERVICES
        ------------------------------ */
        stage('Start Website Services') {
            steps {
                dir('website') {
                    sh '''
                        echo "=== Starting services via docker-compose ==="
                        docker network create ci-network || true
                        docker compose up -d --build

                        echo "Waiting for backend to be ready..."
                        for i in {1..30}; do
                            if curl -s -f ${BACKEND_URL} > /dev/null 2>&1; then
                                echo "✓ Backend ready"
                                break
                            else
                                echo "Waiting 2s..."
                                sleep 2
                            fi
                        done

                        echo "Current running containers:"
                        docker ps
                    '''
                }
            }
        }

        /* -----------------------------
           5) BUILD SELENIUM DOCKER IMAGE
        ------------------------------ */
        stage('Build Selenium Test Image') {
            steps {
                dir('selenium-tests') {
                    sh '''
                        echo "=== Building Selenium Docker image ==="
                        docker build -t selenium-ci-tests:latest .
                    '''
                }
            }
        }

        /* -----------------------------
           6) RUN SELENIUM TESTS
        ------------------------------ */
        stage('Run Selenium Tests') {
            steps {
                script {
                    echo "=== Running Selenium Tests against ${BACKEND_URL} ==="
                    sh """
                        docker run --rm --network host \
                        -e BASE_URL=${BACKEND_URL} \
                        selenium-ci-tests:latest
                    """
                }
            }
        }

        /* -----------------------------
           7) CLEANUP CI CONTAINERS
        ------------------------------ */
        stage('Cleanup') {
            steps {
                sh '''
                    echo "=== Cleaning CI containers ==="
                    docker rm -f mongo-ci backend-ci frontend-ci selenium-ci 2>/dev/null || true
                    docker network rm ci-network 2>/dev/null || true
                '''
            }
        }
    }

    post {
        always {
            echo "=== Pipeline Completed ==="
        }
        success {
            echo '✅ Pipeline succeeded!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
