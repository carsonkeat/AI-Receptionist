# Test Update Assistant API

## Quick Test Methods

### Method 1: Using VAPI CLI (Easiest)

```powershell
# First, set your API key
$env:VAPI_API_KEY = "7982a6a1-3a7f-4efd-878e-b933574a5fb9"

# Get your assistant ID first (list assistants)
vapi assistant list

# Then update the assistant (replace <assistant-id> with actual ID)
vapi assistant update <assistant-id> --name "Test Update $(Get-Date -Format 'HH:mm:ss')"
```

**Example:**
```powershell
vapi assistant update "asst_abc123" --name "Test Update 2:45 PM"
```

---

### Method 2: Using PowerShell Invoke-RestMethod

```powershell
# Set variables
$apiKey = "7982a6a1-3a7f-4efd-878e-b933574a5fb9"
$assistantId = "your-assistant-id-here"  # Replace with actual ID

# Create headers
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

# Create body (what to update)
$body = @{
    name = "Test Update $(Get-Date -Format 'HH:mm:ss')"
} | ConvertTo-Json

# Make the PATCH request
$response = Invoke-RestMethod `
    -Uri "https://api.vapi.ai/assistant/$assistantId" `
    -Method PATCH `
    -Headers $headers `
    -Body $body

# Show the response
$response | ConvertTo-Json -Depth 10
```

---

### Method 3: Get Assistant ID First

If you don't know your assistant ID:

```powershell
# List assistants to get ID
$apiKey = "7982a6a1-3a7f-4efd-878e-b933574a5fb9"
$headers = @{ "Authorization" = "Bearer $apiKey" }

$assistants = Invoke-RestMethod `
    -Uri "https://api.vapi.ai/assistant" `
    -Method GET `
    -Headers $headers

# Show all assistants
$assistants.assistants | ForEach-Object {
    Write-Host "ID: $($_.id)"
    Write-Host "Name: $($_.name)"
    Write-Host "---"
}
```

---

## Complete Test Script

```powershell
# Complete test script for PowerShell
$apiKey = "7982a6a1-3a7f-4efd-878e-b933574a5fb9"
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

# Step 1: List assistants
Write-Host "Fetching assistants..." -ForegroundColor Cyan
$response = Invoke-RestMethod `
    -Uri "https://api.vapi.ai/assistant" `
    -Method GET `
    -Headers $headers

$assistants = $response.assistants
Write-Host "Found $($assistants.Count) assistant(s)" -ForegroundColor Green

if ($assistants.Count -eq 0) {
    Write-Host "No assistants found!" -ForegroundColor Red
    exit
}

# Step 2: Use first assistant for testing
$assistant = $assistants[0]
$assistantId = $assistant.id
Write-Host "`nTesting with assistant: $($assistant.name) ($assistantId)" -ForegroundColor Yellow

# Step 3: Update the assistant
Write-Host "`nUpdating assistant..." -ForegroundColor Cyan
$newName = "Test Update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$updateBody = @{
    name = $newName
} | ConvertTo-Json

try {
    $updated = Invoke-RestMethod `
        -Uri "https://api.vapi.ai/assistant/$assistantId" `
        -Method PATCH `
        -Headers $headers `
        -Body $updateBody
    
    Write-Host "✓ Success! Assistant updated." -ForegroundColor Green
    Write-Host "  Old name: $($assistant.name)" -ForegroundColor Gray
    Write-Host "  New name: $($updated.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}
```

---

## Test in Your App

The app already has a test button! 

1. **Open your app**
2. **Go to Receptionist tab**
3. **Click "Test Update Assistant" button** (appears if you have a `vapi_assistant_id` set)

This will update the assistant's name and show you success/error.

---

## Verify Update Worked

After updating, verify by listing assistants again:

```powershell
# Using CLI
vapi assistant list --api-key "7982a6a1-3a7f-4efd-878e-b933574a5fb9"

# Or using PowerShell
$headers = @{ "Authorization" = "Bearer 7982a6a1-3a7f-4efd-878e-b933574a5fb9" }
Invoke-RestMethod -Uri "https://api.vapi.ai/assistant" -Method GET -Headers $headers
```

---

## Common Issues

### Issue: "Invalid Key"
- Make sure you're using the **private key** (`7982a6a1-3a7f-4efd-878e-b933574a5fb9`)
- For write operations (PATCH), you need the private key

### Issue: "Assistant not found"
- Check the assistant ID is correct
- List assistants first to get the correct ID

### Issue: PowerShell command not found
- Use `Invoke-RestMethod` (built into PowerShell) instead of trying to run `PATCH` directly

