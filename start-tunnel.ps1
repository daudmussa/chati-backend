# Auto-restart localtunnel script
$port = 3000

Write-Host "Starting localtunnel with auto-restart..." -ForegroundColor Green

while ($true) {
    Write-Host "`nStarting localtunnel on port $port..." -ForegroundColor Cyan
    
    # Run localtunnel
    npx localtunnel --port $port
    
    # If it exits, wait 2 seconds and restart
    Write-Host "Localtunnel disconnected. Restarting in 2 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}
