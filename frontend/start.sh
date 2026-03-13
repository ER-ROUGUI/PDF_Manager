#!/bin/bash
# Script to easily launch the Local PDF Manager application

echo "==========================================="
echo " Starting Local PDF Manager"
echo "==========================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed or not in PATH."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if node_modules exists, if not run npm install
if [ ! -d "node_modules" ]; then
    echo "First time setup: Installing dependencies..."
    npm install
    echo ""
fi

echo "Running Vite development server..."
echo ""

# Start the dev server and automatically open the default browser
npm run dev -- --open
