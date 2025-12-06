pipeline {
    agent any

    stages {

        /* -----------------------------
           1) CLEAN PREVIOUS CI RUN
        ------------------------------ */
        stage('Cleanup Previous Run') {
            steps {
                script {
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
           3) CLONE SELENIUM TESTS INTO WEBSITE FOLDER
        ------------------------------ */
        stage('Clone Selenium Tests') {
            steps {
                dir('website/selenium-tests') {
                    git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'
                }
            }
        }

        /* -----------------------------
           4) START ALL WEBSITE SERVICES
        ------------------------------ */
        stage('Start All Services') {
            steps {
                dir('website') {
                    sh '''
                        echo "=== Starting all services via docker-compose ==="
                        docker compose up -d --build

                        echo "Waiting for services to start..."
                        sleep 40

                        echo "Running containers:"
                        docker ps

                        echo "Checking backend on port 5050..."
                        if curl -s -f http://localhost:5050 > /dev/null 2>&1; then
                            echo "✓ Backend available"
                        else
                            echo "Backend not responding on 5050"
                        fi
                    '''
                }
            }
        }

        /* -----------------------------
           5) DEBUG: VERIFY TEST FILES INSIDE SELENIUM IMAGE
        ------------------------------ */
        stage('Debug Test Files Inside Docker Image') {
            steps {
                sh '''
                    echo "=== DEBUG: /app/test CONTENTS ==="
                    docker run --rm selenium-ci-tests:latest sh -c "ls -R /app/test"
                '''
            }
        }

        /* -----------------------------
           6) RUN SELENIUM TESTS
        ------------------------------ */
        stage('Run Selenium Tests') {
            steps {
                script {
                    def urls = ["http://localhost:5050"]
                    for (url in urls) {
                        echo "=== Running Selenium Tests on BASE_URL=${url} ==="
                        sh """
                            docker run --network host --rm \
                                -e BASE_URL=${url} \
                                selenium-ci-tests:latest
                        """
                    }
                }
            }
        }

        /* -----------------------------
           7) CLEANUP CI CONTAINERS
        ------------------------------ */
        stage('Cleanup') {
            steps {
                sh '''
                    echo "=== Cleaning CI Containers ==="
                    docker rm -f mongo-ci backend-ci frontend-ci 2>/dev/null || true
                    echo "⚠ NOT REMOVING selenium-ci-tests:latest (for debugging)"
                '''
            }
        }
    }

    post {
        always {
            echo "=== Pipeline Completed ==="
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
