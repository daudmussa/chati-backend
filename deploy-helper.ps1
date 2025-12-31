# Quick Backend Deployment Script for Railway

Write-Host "🚀 Chati Solutions - Backend Deployment Helper" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "❌ Git repository not found. Initializing..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit"
}

Write-Host "✅ Git repository ready" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Deployment Steps:" -ForegroundColor Cyan
Write-Host "1. Push your code to GitHub:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Deploy to Railway:" -ForegroundColor White
Write-Host "   - Go to https://railway.app" -ForegroundColor Gray
Write-Host "   - Click 'New Project' > 'Deploy from GitHub repo'" -ForegroundColor Gray
Write-Host "   - Select your repository" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Set Environment Variables in Railway:" -ForegroundColor White
Write-Host "   Required variables from your .env file:" -ForegroundColor Gray

# Read .env file if it exists
if (Test-Path .env) {
    Write-Host ""
    Get-Content .env | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
        $parts = $_ -split '=', 2
        $key = $parts[0].Trim()
        if ($key -ne '') {
            Write-Host "   $key" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ⚠️  .env file not found. Create one from .env.example" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. After deployment, you'll get a URL like:" -ForegroundColor White
Write-Host "   https://your-app.railway.app" -ForegroundColor Cyan
Write-Host ""

Write-Host "5. Update frontend:" -ForegroundColor White
Write-Host "   - Copy .env.frontend.example to .env" -ForegroundColor Gray
Write-Host "   - Set VITE_API_URL to your Railway URL" -ForegroundColor Gray
Write-Host "   - Rebuild and redeploy frontend" -ForegroundColor Gray
Write-Host ""

Write-Host "6. Configure Twilio Webhook:" -ForegroundColor White
Write-Host "   - Go to Twilio Console" -ForegroundColor Gray
Write-Host "   - Set webhook URL to: https://your-app.railway.app/webhook" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ For detailed instructions, see DEPLOYMENT.md" -ForegroundColor Green
Write-Host ""

# Offer to open deployment guide
$response = Read-Host "Would you like to open DEPLOYMENT.md? (y/n)"
if ($response -eq 'y') {
    Start-Process "DEPLOYMENT.md"
}
