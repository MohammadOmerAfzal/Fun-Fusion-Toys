pipeline {
    agent any

    stages {

        /* -----------------------------
            1) CLEAN PREVIOUS CI RUN
        ------------------------------ */
        stage('Cleanup Previous Run') {
            steps {
                script {
                    echo "=== Cleaning previous CI containers and networks ==="
                    // Added selenium-node-ci to the cleanup list
                    sh '''
                        docker rm -f mongo-ci backend-ci frontend-ci selenium-node-ci 2>/dev/null || true
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
                        
                        # Use --no-build as the selenium-ci service must be removed/ignored.
                        docker compose up -d --no-build 

                        # Waiting for backend to be ready... (Uses your external IP for Jenkins host check)
                        echo "Waiting for backend to be ready..."
                        for i in {1..30}; do
                            if curl -s -f http://3.214.127.147:5050 > /dev/null 2>&1; then
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
                    sh """
                        echo "=== Running Selenium Tests ==="

                        # 1. Start the Selenium Node/Hub (Chrome Browser) on the CI network
                        # We use its container name 'selenium-node-ci' as the SELENIUM_HOST
                        docker run -d --name selenium-node-ci --network ci-network \
                            selenium/standalone-chrome:latest

                        # 2. Wait for the Selenium Node to be ready (Checking the host machine's 4444 port)
                        echo "Waiting for Selenium Node to be ready..."
                        for i in {1..30}; do
                            if curl -s -f http://3.214.127.147:4444/wd/hub/status > /dev/null 2>&1; then
                                echo "✓ Selenium Node ready"
                                break
                            else
                                echo "Waiting 2s..."
                                sleep 2
                            fi
                        done
                        
                        # 3. Run the tests, passing the internal service names as environment variables
                        # BASE_URL: http://frontend-ci:5173 (The website to test)
                        # SELENIUM_HOST: selenium-node-ci (The Selenium browser instance)
                        docker run --rm --network ci-network \
                        -e BASE_URL=http://frontend-ci:5173 \
                        -e SELENIUM_HOST=selenium-node-ci \
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
                    docker rm -f mongo-ci backend-ci frontend-ci selenium-node-ci 2>/dev/null || true
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
