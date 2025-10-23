#!/bin/bash

echo "🧹 Cleaning up project..."

# Keep these folders/files
# Remove empty and duplicate files
find src/ -type f -size 0 -delete 2>/dev/null
find public/ -type f -size 0 -delete 2>/dev/null

echo "✅ Cleanup complete!"
echo ""
echo "📋 Current file structure:"
echo ""

# Show what we have
echo "Root files:"
ls -lh *.json *.md .env* 2>/dev/null | awk '{print $9, "-", $5}'

echo ""
echo "Source files:"
find src/ -type f -name "*.ts" -exec ls -lh {} \; | awk '{print $9, "-", $5}'

echo ""
echo "Public files:"
ls -lh public/* 2>/dev/null | awk '{print $9, "-", $5}'

echo ""
echo "🔍 Files that need content (0 bytes):"
find . -type f -size 0 -not -path "./node_modules/*" -not -path "./.git/*"

echo ""
echo "Total TypeScript files: $(find src/ -name "*.ts" | wc -l)"
