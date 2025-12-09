# Quick Git Push Script
# For subsequent updates after initial setup

Write-Host "Quick Git Push" -ForegroundColor Cyan
Write-Host ""

# Navigate to project
Set-Location "C:\Users\ssund007\Code\Next.js\nextjs-google-workspace-auth"

# Status
Write-Host "Current changes:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Add all
git add -A

# Commit
$msg = Read-Host "Commit message"
if ([string]::IsNullOrWhiteSpace($msg)) { $msg = "Update" }
git commit -m "$msg"

# Push
git push

Write-Host ""
Write-Host "✓ Pushed to remote!" -ForegroundColor Green
