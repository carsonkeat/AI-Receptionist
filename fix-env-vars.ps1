# Fix .env file - Update VAPI key variable names
Write-Host "=== Fixing .env file ===" -ForegroundColor Cyan
Write-Host ""

$envPath = ".env"

if (-not (Test-Path $envPath)) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Reading .env file..." -ForegroundColor Yellow
$content = Get-Content $envPath -Raw

# Check if the wrong variable name exists
if ($content -match 'EXPO_PRIVATE_VAPI_API_KEY') {
    Write-Host "Found incorrect variable: EXPO_PRIVATE_VAPI_API_KEY" -ForegroundColor Yellow
    Write-Host "Replacing with: EXPO_PUBLIC_VAPI_PRIVATE_KEY" -ForegroundColor Green
    
    # Replace the incorrect variable name
    $content = $content -replace 'EXPO_PRIVATE_VAPI_API_KEY=', 'EXPO_PUBLIC_VAPI_PRIVATE_KEY='
    
    # Save the updated content
    $content | Set-Content $envPath -NoNewline
    
    Write-Host ""
    Write-Host "Fixed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Updated .env file. Current VAPI variables:" -ForegroundColor Cyan
    Get-Content $envPath | Select-String VAPI
    Write-Host ""
    Write-Host "IMPORTANT: Restart your Expo server with:" -ForegroundColor Red
    Write-Host "   npx expo start --clear" -ForegroundColor White
    Write-Host ""
    Write-Host "This clears the cache so the new environment variables are loaded." -ForegroundColor Yellow
} else {
    Write-Host "No changes needed. Variable names are correct." -ForegroundColor Green
    Write-Host ""
    Write-Host "Current VAPI variables:" -ForegroundColor Cyan
    Get-Content $envPath | Select-String VAPI
}
