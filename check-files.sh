#!/bin/bash

echo "📋 CHECKING PROJECT FILES..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check file
check_file() {
    file=$1
    if [ -f "$file" ]; then
        size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
        if [ "$size" -eq 0 ]; then
            echo -e "${YELLOW}⚠️  EMPTY (0 bytes): $file${NC}"
        else
            echo -e "${GREEN}✅ EXISTS ($size bytes): $file${NC}"
        fi
    else
        echo -e "${RED}❌ MISSING: $file${NC}"
    fi
}

echo "=== ROOT FILES ==="
check_file "package.json"
check_file "tsconfig.json"
check_file ".env"
check_file ".gitignore"
check_file "README.md"
check_file "SETUP_GUIDE.md"
check_file "DEMO_VIDEO_SCRIPT.md"
check_file "TESTING_AND_SUBMISSION.md"

echo ""
echo "=== SOURCE FILES ==="
check_file "src/index.ts"

echo ""
echo "=== UTILITIES ==="
check_file "src/utils/jwt.utils.ts"

echo ""
echo "=== SERVICES ==="
check_file "src/services/email.service.ts"
check_file "src/services/websocket.service.ts"

echo ""
echo "=== MIDDLEWARE ==="
check_file "src/middleware/auth.middleware.ts"

echo ""
echo "=== CONTROLLERS ==="
check_file "src/controllers/auth.controller.ts"
check_file "src/controllers/event.controller.ts"
check_file "src/controllers/rsvp.controller.ts"

echo ""
echo "=== ROUTES ==="
check_file "src/routes/auth.routes.ts"
check_file "src/routes/event.routes.ts"

echo ""
echo "=== DATABAS
cd ~/event-monolith-app

# Create a file checker script
cat > check-files.sh << 'EOF'
#!/bin/bash

echo "📋 CHECKING PROJECT FILES..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check file
check_file() {
    file=$1
    if [ -f "$file" ]; then
        size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
        if [ "$size" -eq 0 ]; then
            echo -e "${YELLOW}⚠️  EMPTY (0 bytes): $file${NC}"
        else
            echo -e "${GREEN}✅ EXISTS ($size bytes): $file${NC}"
        fi
    else
        echo -e "${RED}❌ MISSING: $file${NC}"
    fi
}

echo "=== ROOT FILES ==="
check_file "package.json"
check_file "tsconfig.json"
check_file ".env"
check_file ".gitignore"
check_file "README.md"
check_file "SETUP_GUIDE.md"
check_file "DEMO_VIDEO_SCRIPT.md"
check_file "TESTING_AND_SUBMISSION.md"

echo ""
echo "=== SOURCE FILES ==="
check_file "src/index.ts"

echo ""
echo "=== UTILITIES ==="
check_file "src/utils/jwt.utils.ts"

echo ""
echo "=== SERVICES ==="
check_file "src/services/email.service.ts"
check_file "src/services/websocket.service.ts"

echo ""
echo "=== MIDDLEWARE ==="
check_file "src/middleware/auth.middleware.ts"

echo ""
echo "=== CONTROLLERS ==="
check_file "src/controllers/auth.controller.ts"
check_file "src/controllers/event.controller.ts"
check_file "src/controllers/rsvp.controller.ts"

echo ""
echo "=== ROUTES ==="
check_file "src/routes/auth.routes.ts"
check_file "src/routes/event.routes.ts"

echo ""
echo "=== DATABASE ==="
check_file "src/prisma/schema.prisma"

echo ""
echo "=== FRONTEND (BONUS) ==="
check_file "public/index.html"

echo ""
echo "=== SUMMARY ==="
total_files=17
existing_files=$(find src/ public/ -name "*.ts" -o -name "*.html" -o -name "*.prisma" | wc -l)
empty_files=$(find src/ public/ -type f -size 0 | wc -l)

echo "Total expected files: $total_files"
echo "Files found: $existing_files"
echo "Empty files: $empty_files"
echo "Missing files: $((total_files - existing_files))"

echo ""
echo "=== DETAILED FILE TREE ==="
tree -L 3 -I 'node_modules|.git' || find . -not -path "*/node_modules/*" -not -path "*/.git/*" -type f | head -30

