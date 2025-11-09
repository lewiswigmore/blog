#!/bin/bash

# Local build script for Hugo blog
# Deployment to Azure Static Web Apps is handled automatically by GitHub Actions
# See .github/workflows/azure-static-web-apps-mango-mud-0d92c8b03.yml

echo "Building Hugo site..."
./bin/hugo.exe

echo "Build complete! Output is in ./public/"
echo ""
echo "To deploy:"
echo "  git add ."
echo "  git commit -m 'Your commit message'"
echo "  git push origin main"
echo ""
echo "Deployment will happen automatically via GitHub Actions"
echo "Site URL: https://mango-mud-0d92c8b03.3.azurestaticapps.net"
