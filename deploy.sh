#!/bin/bash

# Check if .env file exists and source it
if [ -f .env ]; then
    source .env
fi

# Build the site
./bin/hugo.exe

# Check if deployment token is available
if [ -z "$AZURE_DEPLOYMENT_TOKEN" ]; then
    echo "Azure deployment token not found."
    echo "Please set AZURE_DEPLOYMENT_TOKEN environment variable or create a .env file with:"
    echo "AZURE_DEPLOYMENT_TOKEN=your_token_here"
    exit 1
fi

# Deploy to Azure Static Web Apps
swa deploy ./public --deployment-token $AZURE_DEPLOYMENT_TOKEN --env production
