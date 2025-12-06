pipeline {
    agent any
    
    environment {
        // Set Docker Compose to use the correct file name
        COMPOSE_FILE = 'docker-compose.yml'
    }
    
    stages {
        stage('Clone Selenium Tests Repo') {
            steps {
                dir('selenium-tests') {
                    git credentialsId: '6c5d2448-b572-4d2e-8f3f-69f93514cf75',
                    url: 'https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git',
                    branch: 'main'
                }
            }
        }

        stage('Check for docker-compose.yml') {
            steps {
                sh '''
                echo "Current directory: $(pwd)"
                echo "Files in current directory:"
                ls -la
                echo "Looking for docker-compose.yml..."
                find . -name "docker-compose.yml" -type f
                '''
            }
        }

        stage('Stop Previous Containers') {
            steps {
                sh '''
                # Try docker compose command, if it fails, try docker-compose (older version)
                if [ -f "docker-compose.yml" ]; then
                    docker compose down || docker-compose down || true
                else
                    echo "docker-compose.yml not found in current directory"
                    # Check one directory up
                    if [ -f "../docker-compose.yml" ]; then
                        cd .. && docker compose down || docker-compose down || true
                    else
                        echo "docker-compose.yml not found"
                    fi
                fi
                '''
            }
        }

        stage('Start CI Containers') {
            steps {
                sh '''
                # Start containers from the directory containing docker-compose.yml
                if [ -f "docker-compose.yml" ]; then
                    echo "Starting containers from current directory..."
                    docker compose up -d --build || docker-compose up -d --build
                else
                    echo "Checking parent directory..."
                    if [ -f "../docker-compose.yml" ]; then
                        cd .. && docker compose up -d --build || docker-compose up -d --build
                    else
                        echo "ERROR: Could not find docker-compose.yml"
                        exit 1
                    fi
                fi
                '''
            }
        }

        stage('Wait for Services to be Ready') {
            steps {
                sh '''
                # Wait for services to be fully up
                echo "Waiting for services to start..."
                sleep 30
                
                # Check if web service is responding (adjust port as needed)
                echo "Checking if services are responding..."
                curl --retry 10 --retry-delay 5 --retry-connrefused http://localhost:3000 || echo "Service check failed, but continuing..."
                '''
            }
        }

        stage('Run Selenium Tests') {
            steps {
                dir('selenium-tests') {
                    sh '''
                    echo "Setting up Python virtual environment..."
                    python3 -m venv venv || python -m venv venv
                    source venv/bin/activate
                    pip install --upgrade pip
                    pip install -r requirements.txt
                    
                    echo "Running Selenium tests..."
                    python test/test_main.py
                    '''
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                sh '''
                # Clean up containers
                if [ -f "docker-compose.yml" ]; then
                    docker compose down || docker-compose down || true
                elif [ -f "../docker-compose.yml" ]; then
                    cd .. && docker compose down || docker-compose down || true
                fi
                '''
            }
        }
    }
    
    post {
        always {
            sh '''
            echo "Pipeline finished. Performing cleanup..."
            # Try to stop any running containers
            docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
            '''
            
            cleanWs()  // Clean workspace after build
        }
    }
}
