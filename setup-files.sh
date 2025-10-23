#!/bin/bash

echo "🚀 Creating Event Management App Files..."

# Create package.json
cat > package.json << 'EOF'
{
  "name": "event-monolith-app",
  "version": "1.0.0",
  "description": "Real-time event management system",
  "main": "src/index.ts",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "start": "bun run src/index.ts",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push"
  },
  "dependencies": {
    "elysia": "^1.1.0",
    "@elysiajs/swagger": "^1.1.0",
    "@elysiajs/cors": "^1.1.0",
    "@elysiajs/jwt": "^1.1.0",
    "@prisma/client": "^5.18.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.14",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/nodemailer": "^6.4.15",
    "bun-types": "latest",
    "prisma": "^5.18.0"
  }
}
EOF

echo "✅ package.json created"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

echo "✅ All files created! Now:"
echo "1. Edit .env with your credentials"
echo "2. Run: bun run prisma:generate"
echo "3. Run: bun run prisma:push"
echo "4. Run: bun run dev"
