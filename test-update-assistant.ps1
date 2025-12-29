# Test Update Assistant API Script
# Run this script to test updating an assistant

# Set your API key
$apiKey = "7982a6a1-3a7f-4efd-878e-b933574a5fb9"

# Create headers
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

Write-Host "=== VAPI Update Assistant Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: List assistants to get an ID
Write-Host "Step 1: Fetching assistants..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod `
        -Uri "https://api.vapi.ai/assistant" `
        -Method GET `
        -Headers $headers
    
    # Handle different response formats
    if ($response.assistants) {
        $assistants = $response.assistants
    } elseif ($response -is [Array]) {
        $assistants = $response
    } else {
        $assistants = @($response)
    }
    
    if ($null -eq $assistants -or $assistants.Count -eq 0) {
        Write-Host "✗ No assistants found!" -ForegroundColor Red
        exit
    }
    
    Write-Host "✓ Found $($assistants.Count) assistant(s)" -ForegroundColor Green
    Write-Host ""
    
    # Show assistants
    $assistants | ForEach-Object {
        Write-Host "  • $($_.name) - ID: $($_.id)" -ForegroundColor White
    }
    
} catch {
    Write-Host "✗ Error fetching assistants" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit
}

Write-Host ""

# Step 2: Get first assistant for testing
$assistant = $assistants[0]
$assistantId = $assistant.id
$oldName = $assistant.name

Write-Host "Step 2: Testing update on assistant: $oldName" -ForegroundColor Yellow
Write-Host "  Assistant ID: $assistantId" -ForegroundColor Gray
Write-Host ""

# Step 3: Update the assistant
$newName = "Test Update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$updateBody = @{
    name = $newName
} | ConvertTo-Json

Write-Host "Step 3: Updating assistant name..." -ForegroundColor Yellow
Write-Host "  Old name: $oldName" -ForegroundColor Gray
Write-Host "  New name: $newName" -ForegroundColor Gray
Write-Host ""

try {
    $updated = Invoke-RestMethod `
        -Uri "https://api.vapi.ai/assistant/$assistantId" `
        -Method PATCH `
        -Headers $headers `
        -Body $updateBody
    
    Write-Host "✓ SUCCESS! Assistant updated." -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host "  ID: $($updated.id)" -ForegroundColor White
    Write-Host "  Name: $($updated.name)" -ForegroundColor White
    Write-Host "  Updated: $($updated.updatedAt)" -ForegroundColor White
    Write-Host ""
    Write-Host "Test completed successfully! 🎉" -ForegroundColor Green
    
} catch {
    Write-Host "✗ ERROR: Failed to update assistant" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        
        # Try to read the error response body
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Gray
        } catch {
            # Ignore if can't read response
        }
    }
}

