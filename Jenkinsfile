
pipeline {
    agent any

    stages {

        // ------------------ Clone Main Website Repo ------------------ //
        stage('Clone Website Repository') {
            steps {
                echo "Cloning main website repository..."
                git branch: 'master', url: 'https://github.com/MohammadOmerAfzal/Fun-Fusion-Toys.git'
            }
        }

        // ------------------ Stop Previous Containers ------------------ //
        stage('Stop Previous Containers') {
            steps {
                echo "Stopping previous containers if any..."
                sh 'docker compose down || true'
            }
        }

        // ------------------ Start Website Containers ------------------ //
        stage('Start Website Containers') {
            steps {
                echo "Building and starting website containers..."
                sh 'docker compose up -d --build mongo-ci backend-ci frontend-ci'
            }
        }

        // ------------------ Verify Containers ------------------ //
        stage('Verify Website Containers') {
            steps {
                sh 'docker ps'
            }
        }

        // ------------------ Clone Selenium Tests Repo ------------------ //
        stage('Clone Selenium Test Repository') {
            steps {
                echo "Cloning Selenium test repository..."
                sh '''
                    rm -rf tests
                    git clone https://github.com/MohammadOmerAfzal/FunFusionToys_SeleniumTestCases.git tests
                '''
            }
        }

        // ------------------ Wait for Frontend ------------------ //
        stage('Wait for Frontend') {
            steps {
                echo "Waiting for frontend to be ready..."
                sh '''
                    for i in {1..30}; do
                        if curl --silent --fail http://localhost:5175; then
                            echo "Frontend is up!"
                            break
                        fi
                        echo "Waiting for frontend..."
                        sleep 2
                    done
                '''
            }
        }

        // ------------------ Run Selenium Tests ------------------ //
        stage('Build & Run Selenium Tests') {
            steps {
                echo "Building and running Selenium tests container..."
                sh 'docker compose build selenium-tests'
                sh 'docker compose run --rm selenium-tests > test_results.log 2>&1 || true'
            }
        }

        // ------------------ Get Last Committer Email ------------------ //
        stage('Get Last Committer Email') {
            steps {
                script {
                    // Fetch email of the last person who committed to the main website repo
                    env.COMMITTER_EMAIL = sh(
                        script: "git log -1 --pretty=format:'%ae'",
                        returnStdout: true
                    ).trim()
                    echo "Last committer email: ${env.COMMITTER_EMAIL}"
                }
            }
        }

        // ------------------ Send Test Results Email ------------------ //
        stage('Send Email') {
            steps {
                script {
                    // Ensure Email Extension Plugin is installed and SMTP configured in Jenkins
                    emailext(
                        subject: "🎯 Selenium Test Results for ${env.JOB_NAME}",
                        body: """<pre>${readFile('test_results.log')}</pre>""",
                        to: "${env.COMMITTER_EMAIL}"
                    )
                    echo "✅ Email sent to ${env.COMMITTER_EMAIL}"
                }
            }
        }
    }

    post {
        success {
            echo "🎉 CI Build and Tests Completed Successfully!"
        }
        failure {
            echo "❌ Build or Tests Failed. Check logs."
        }
    }
}
