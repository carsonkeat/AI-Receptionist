# Simple Update Assistant Test - TrustedKC Receptionist
$apiKey = "7982a6a1-3a7f-4efd-878e-b933574a5fb9"
$assistantId = "84959bb6-0f25-4ee5-91e2-d93506440967"  # TrustedKC assistant

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

$newName = "Test Update " + (Get-Date -Format "HH:mm:ss")
$body = @{
    name = $newName
} | ConvertTo-Json

Write-Host "Testing PATCH /assistant/$assistantId" -ForegroundColor Cyan
Write-Host "Updating name to: $newName" -ForegroundColor Yellow
Write-Host ""

try {
    $result = Invoke-RestMethod `
        -Uri "https://api.vapi.ai/assistant/$assistantId" `
        -Method PATCH `
        -Headers $headers `
        -Body $body
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Assistant updated:" -ForegroundColor Green
    Write-Host "  ID: $($result.id)" -ForegroundColor White
    Write-Host "  Name: $($result.name)" -ForegroundColor White
    Write-Host "  Updated: $($result.updatedAt)" -ForegroundColor White
    
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

