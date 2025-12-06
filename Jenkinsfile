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
                        docker rm -f mongo-ci backend-ci frontend-ci 2>/dev/null || true
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
           3) START WEBSITE & VERIFY
        ------------------------------ */
        stage('Start Website') {
            steps {
                dir('website') {
                    sh '''
                        docker compose up -d --build

                        echo "Waiting for services to start..."
                        sleep 40

                        echo "Running containers:"
                        docker ps

                        echo "Backend logs (last 20 lines):"
                        docker logs backend-ci --tail 20 2>/dev/null || echo "Backend logs not available"

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
           4) CLONE & BUILD SELENIUM TEST IMAGE
        ------------------------------ */
        stage('Clone & Build Tests') {
            steps {
                dir('selenium-tests') {
                    git branch: 'main', url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git'

                    sh '''
                        echo "=== Building Selenium Test Image ==="
                        docker build --no-cache -t selenium-ci-tests:latest .
                    '''
                }
            }
        }

        /* -----------------------------
           5) DEBUG: VERIFY TEST FILES
           (Checks /app/test inside image)
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
           6) RUN SELENIUM TEST SUITE
           (Uses your custom test_main.py)
        ------------------------------ */
        stage('Run Selenium Tests') {
            steps {
                sh '''
                    echo "=== Running Selenium Tests Using test_main.py ==="

                    # Try backend → frontend → fallback
                    docker run --network host --rm \
                        -e BASE_URL="http://localhost:5050" \
                        selenium-ci-tests:latest || \

                    docker run --network host --rm \
                        -e BASE_URL="http://localhost:5175" \
                        selenium-ci-tests:latest || \

                    docker run --network host --rm \
                        -e BASE_URL="http://localhost:3000" \
                        selenium-ci-tests:latest
                '''
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

    /* -----------------------------
       POST PIPELINE ACTIONS
    ------------------------------ */
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
