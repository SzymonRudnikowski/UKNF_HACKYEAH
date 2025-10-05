#!/bin/bash

echo "🚀 Setting up UKNF Platform..."

# Create .env.local file
cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uknf_app?schema=public"

# NextAuth
NEXTAUTH_SECRET="dev_secret_change_me"
NEXTAUTH_URL="http://localhost:3000"

# MinIO (S3 compatible)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minio"
S3_SECRET_KEY="miniosecret"
S3_BUCKET="uknf-files"

# ClamAV
CLAMAV_HOST="localhost"
CLAMAV_PORT="3310"

# RabbitMQ (optional)
RABBITMQ_URL="amqp://guest:guest@localhost:5672/"

# Redis
REDIS_URL="redis://localhost:6379"

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS="60"
RATE_LIMIT_WINDOW_MS="60000"

# File Upload
MAX_FILE_SIZE="104857600" # 100MB
ALLOWED_FILE_TYPES="pdf,doc,docx,xls,xlsx,csv,txt,mp3,zip"
EOF

echo "✅ Environment file created"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🎉 Setup complete! Now run: docker compose up -d"
