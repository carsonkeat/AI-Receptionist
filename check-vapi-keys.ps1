# Check VAPI API Keys Configuration
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "VAPI API Keys Configuration Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$envFile = ".\.env"

if (-not (Test-Path $envFile)) {
    Write-Host ".env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file in the AIReceptionist directory" -ForegroundColor Yellow
    exit 1
}

Write-Host ".env file found" -ForegroundColor Green
Write-Host ""

# Read the .env file
$envContent = Get-Content $envFile -Raw

# Check for keys
$hasPrivateKey = $envContent -match "EXPO_PUBLIC_VAPI_PRIVATE_KEY"
$hasPublicKey = $envContent -match "EXPO_PUBLIC_VAPI_PUBLIC_KEY"
$hasLegacyKey = $envContent -match "EXPO_PRIVATE_VAPI_API_KEY"

Write-Host "Environment Variables Check:" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan

if ($hasPrivateKey) {
    Write-Host "EXPO_PUBLIC_VAPI_PRIVATE_KEY found" -ForegroundColor Green
} else {
    Write-Host "EXPO_PUBLIC_VAPI_PRIVATE_KEY NOT found" -ForegroundColor Red
    Write-Host "This is REQUIRED for the app to work!" -ForegroundColor Yellow
}

if ($hasPublicKey) {
    Write-Host "EXPO_PUBLIC_VAPI_PUBLIC_KEY found" -ForegroundColor Green
} else {
    Write-Host "EXPO_PUBLIC_VAPI_PUBLIC_KEY not found (optional)" -ForegroundColor Yellow
}

if ($hasLegacyKey) {
    Write-Host "EXPO_PRIVATE_VAPI_API_KEY found (LEGACY - will not work!)" -ForegroundColor Red
    Write-Host "This variable name is incorrect!" -ForegroundColor Yellow
    Write-Host "It should be EXPO_PUBLIC_VAPI_PRIVATE_KEY instead" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Current VAPI variables in .env:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Get-Content $envFile | Select-String "VAPI"

Write-Host ""
Write-Host "Recommendations:" -ForegroundColor Cyan
Write-Host "1. Make sure EXPO_PUBLIC_VAPI_PRIVATE_KEY is set" -ForegroundColor Yellow
Write-Host "2. After updating .env, restart Expo server:" -ForegroundColor Yellow
Write-Host "   npx expo start --clear" -ForegroundColor White
Write-Host ""
