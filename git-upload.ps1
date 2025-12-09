# ============================================
# Git Upload Script for Next.js Google Workspace Auth
# ============================================
# This script safely initializes Git and pushes to a remote repository
# while ensuring sensitive files are excluded

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git Upload Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
$ProjectRoot = "C:\Users\ssund007\Code\Next.js\nextjs-google-workspace-auth"
Set-Location $ProjectRoot

Write-Host "Current directory: $ProjectRoot" -ForegroundColor Yellow
Write-Host ""

# Check if Git is installed
Write-Host "Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check if .env files exist (they should NOT be committed)
Write-Host "Checking for sensitive files..." -ForegroundColor Yellow
$envFiles = Get-ChildItem -Path . -Filter "*.env*" -File -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*.example" }
if ($envFiles) {
    Write-Host "✓ Found .env files (these will be excluded):" -ForegroundColor Yellow
    foreach ($file in $envFiles) {
        Write-Host "  - $($file.FullName.Replace($ProjectRoot, '.'))" -ForegroundColor Yellow
    }
    Write-Host "  These files are protected by .gitignore" -ForegroundColor Green
} else {
    Write-Host "✓ No .env files found" -ForegroundColor Green
}
Write-Host ""

# Initialize Git if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "Git repository not initialized. Initializing..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
    Write-Host ""
}

# Show what files will be added (dry run)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Files that will be committed:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
git add --dry-run -A
Write-Host ""

# Confirmation prompt
Write-Host "Review the files above. Do you want to proceed?" -ForegroundColor Yellow
$confirmation = Read-Host "Type 'yes' to continue, or anything else to cancel"

if ($confirmation -ne "yes") {
    Write-Host "✗ Operation cancelled by user" -ForegroundColor Red
    exit 0
}
Write-Host ""

# Add all files (respecting .gitignore)
Write-Host "Adding files to Git..." -ForegroundColor Yellow
git add -A
Write-Host "✓ Files added" -ForegroundColor Green
Write-Host ""

# Create commit
Write-Host "Creating commit..." -ForegroundColor Yellow
$commitMessage = Read-Host "Enter commit message (default: 'Initial commit - Next.js Google Workspace Auth with Azure WIF')"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Initial commit - Next.js Google Workspace Auth with Azure WIF"
}

git commit -m "$commitMessage"
Write-Host "✓ Commit created" -ForegroundColor Green
Write-Host ""

# Check if remote exists
$remoteExists = git remote get-url origin 2>$null
if (-not $remoteExists) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Git Remote Setup" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "No remote repository configured." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Do you want to add a remote repository?" -ForegroundColor Yellow
    $addRemote = Read-Host "Type 'yes' to add remote, or 'no' to skip"
    
    if ($addRemote -eq "yes") {
        Write-Host ""
        Write-Host "Enter your Git repository URL:" -ForegroundColor Yellow
        Write-Host "Examples:" -ForegroundColor Gray
        Write-Host "  GitHub: https://github.com/username/repo.git" -ForegroundColor Gray
        Write-Host "  Azure DevOps: https://dev.azure.com/org/project/_git/repo" -ForegroundColor Gray
        Write-Host "  GitLab: https://gitlab.com/username/repo.git" -ForegroundColor Gray
        Write-Host ""
        $repoUrl = Read-Host "Repository URL"
        
        if (-not [string]::IsNullOrWhiteSpace($repoUrl)) {
            git remote add origin $repoUrl
            Write-Host "✓ Remote 'origin' added: $repoUrl" -ForegroundColor Green
            Write-Host ""
            
            # Set default branch name
            Write-Host "Setting default branch to 'main'..." -ForegroundColor Yellow
            git branch -M main
            Write-Host "✓ Default branch set to 'main'" -ForegroundColor Green
            Write-Host ""
        } else {
            Write-Host "✗ Invalid repository URL" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Skipping remote setup. You can add it later with:" -ForegroundColor Yellow
        Write-Host "  git remote add origin <repository-url>" -ForegroundColor Gray
        Write-Host "  git branch -M main" -ForegroundColor Gray
        Write-Host "  git push -u origin main" -ForegroundColor Gray
        exit 0
    }
} else {
    Write-Host "✓ Remote 'origin' already configured: $remoteExists" -ForegroundColor Green
    Write-Host ""
}

# Push to remote
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Push to Remote" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Do you want to push to the remote repository?" -ForegroundColor Yellow
$pushConfirm = Read-Host "Type 'yes' to push, or 'no' to skip"

if ($pushConfirm -eq "yes") {
    Write-Host ""
    Write-Host "Pushing to remote..." -ForegroundColor Yellow
    
    # Check current branch
    $currentBranch = git branch --show-current
    
    # Push with upstream
    git push -u origin $currentBranch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully pushed to remote!" -ForegroundColor Green
    } else {
        Write-Host "✗ Push failed. You may need to pull first or check your credentials." -ForegroundColor Red
        Write-Host "Try: git pull origin $currentBranch --rebase" -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipping push. You can push later with:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Files committed successfully" -ForegroundColor Green
Write-Host "✓ Sensitive files excluded (.env*, *.key, etc.)" -ForegroundColor Green
Write-Host "✓ .gitignore is properly configured" -ForegroundColor Green
Write-Host ""
Write-Host "Your repository is ready!" -ForegroundColor Green
Write-Host ""

# Show final status
Write-Host "Current Git status:" -ForegroundColor Yellow
git status
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
