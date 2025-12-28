Write-Host "Stopping Next.js dev server..." -ForegroundColor Yellow

# Find and kill the Next.js dev server process
$processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*next dev*"
}

if ($processes) {
    foreach ($proc in $processes) {
        Write-Host "Killing process $($proc.Id)..." -ForegroundColor Red
        Stop-Process -Id $proc.Id -Force
    }
    Write-Host "Dev server stopped." -ForegroundColor Green
} else {
    Write-Host "No Next.js dev server found running." -ForegroundColor Yellow
}

# Wait a moment
Start-Sleep -Seconds 2

# Generate Prisma client
Write-Host "`nGenerating Prisma client..." -ForegroundColor Cyan
Set-Location "c:\Users\Jesus\.gemini\antigravity\scratch\l4d2-ranked\web-platform"
npx prisma generate

# Create and apply migration
Write-Host "`nApplying database migration..." -ForegroundColor Cyan
npx prisma migrate dev --name add_waiting_for_players_status

# Restart dev server
Write-Host "`nRestarting dev server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\Jesus\.gemini\antigravity\scratch\l4d2-ranked\web-platform'; npm run dev"

Write-Host "`nDone! Dev server is restarting in a new window." -ForegroundColor Green
