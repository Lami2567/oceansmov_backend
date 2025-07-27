#!/bin/bash

echo "Starting deployment process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if dotenv is installed
if ! npm list dotenv; then
    echo "dotenv not found, installing..."
    npm install dotenv
fi

# Check if other critical dependencies are installed
echo "Checking critical dependencies..."
npm list express cors pg bcryptjs jsonwebtoken multer aws-sdk

echo "Deployment setup complete!" 