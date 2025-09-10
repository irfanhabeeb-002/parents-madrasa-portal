# Git History Cleanup Script for Windows PowerShell
# WARNING: This script rewrites git history. Use with caution!

Write-Host "🚨 WARNING: This script will rewrite your git history!" -ForegroundColor Red
Write-Host "This will remove sensitive files from all commits." -ForegroundColor Yellow
Write-Host "Make sure you have a backup of your repository before proceeding." -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Do you want to continue? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Aborted." -ForegroundColor Red
    exit 1
}

Write-Host "🧹 Cleaning up git history..." -ForegroundColor Blue

# Check if git filter-branch is available
try {
    # Method 1: Remove files from git history (rewrites history)
    Write-Host "Removing sensitive files from git history..." -ForegroundColor Yellow
    
    # Use git filter-repo if available (recommended), otherwise use filter-branch
    $filterRepoAvailable = $false
    try {
        git filter-repo --help | Out-Null
        $filterRepoAvailable = $true
    } catch {
        $filterRepoAvailable = $false
    }
    
    if ($filterRepoAvailable) {
        Write-Host "Using git filter-repo (recommended method)..." -ForegroundColor Green
        git filter-repo --invert-paths --path .env --path .env.production --path .env.staging --path .env.local --force
    } else {
        Write-Host "Using git filter-branch (legacy method)..." -ForegroundColor Yellow
        Write-Host "Consider installing git-filter-repo for better performance: pip install git-filter-repo" -ForegroundColor Cyan
        
        git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env .env.production .env.staging .env.local" --prune-empty --tag-name-filter cat -- --all
        
        # Clean up the backup refs
        Write-Host "Cleaning up backup references..." -ForegroundColor Yellow
        git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
        
        # Expire and prune
        Write-Host "Expiring reflog and pruning..." -ForegroundColor Yellow
        git reflog expire --expire=now --all
        git gc --prune=now --aggressive
    }
    
    Write-Host "✅ Git history cleanup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Force push to update remote repository:" -ForegroundColor White
    Write-Host "   git push origin --force --all" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Notify team members to re-clone the repository" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Set up environment variables in your deployment platform" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Create local .env file from .env.example for development" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error during cleanup: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔄 Alternative safer method:" -ForegroundColor Yellow
    Write-Host "Remove files from current commit only (doesn't rewrite history):" -ForegroundColor White
    Write-Host ""
    Write-Host "git rm --cached .env .env.production .env.staging .env.local" -ForegroundColor Gray
    Write-Host "git commit -m 'Remove sensitive environment files from repository'" -ForegroundColor Gray
    Write-Host "git push" -ForegroundColor Gray
}