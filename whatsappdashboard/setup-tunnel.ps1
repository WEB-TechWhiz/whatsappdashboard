<#
.SYNOPSIS
  Interactive setup wizard for a persistent Cloudflare Named Tunnel.

.DESCRIPTION
  This script guides you through:
  1. Authenticating with Cloudflare (cloudflared tunnel login)
  2. Creating a named tunnel
  3. Configuring DNS routes for your custom domain
  4. Generating the cloudflared.yml config file

.NOTES
  Prerequisites:
    - cloudflared installed and on PATH
    - A domain added to your Cloudflare account

.EXAMPLE
  .\setup-tunnel.ps1
  .\setup-tunnel.ps1 -TunnelName "whatsapp-dashboard"
#>

param(
    [string]$TunnelName = "whatsapp-dashboard",
    [int]$FrontendPort = 3000,
    [int]$BackendPort  = 4000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([int]$Number, [string]$Title) {
    Write-Host ""
    Write-Host "  [$Number/5] $Title" -ForegroundColor Cyan
    Write-Host "  $("-" * ($Title.Length + 8))" -ForegroundColor DarkGray
}

function Prompt-Continue {
    $response = Read-Host "  Continue? (y/n)"
    if ($response -notin @("y", "Y", "yes", "Yes")) {
        Write-Host "  Aborted." -ForegroundColor Yellow
        exit 0
    }
}

# ── Banner ───────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║   WhatsApp Dashboard — Named Tunnel Setup Wizard        ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Check cloudflared
try {
    $version = & cloudflared --version 2>&1
    Write-Host "  Using: $version" -ForegroundColor DarkGray
} catch {
    Write-Host "  ERROR: cloudflared is not installed or not on PATH." -ForegroundColor Red
    exit 1
}

# ── Step 1: Authenticate ────────────────────────────────────────────────────

Write-Step 1 "Authenticate with Cloudflare"
Write-Host "  This will open your browser to log in to Cloudflare." -ForegroundColor White
Write-Host "  If you've already logged in, this step will be skipped." -ForegroundColor DarkGray
Write-Host ""

# Check if already authenticated
$credDir = Join-Path $env:USERPROFILE ".cloudflared"
$certPath = Join-Path $credDir "cert.pem"

if (Test-Path $certPath) {
    Write-Host "  Found existing certificate at $certPath" -ForegroundColor Green
    Write-Host "  Skipping login (delete cert.pem to re-authenticate)." -ForegroundColor DarkGray
} else {
    Prompt-Continue
    Write-Host "  Opening browser for Cloudflare login..." -ForegroundColor Yellow
    & cloudflared tunnel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Login failed. Please try again." -ForegroundColor Red
        exit 1
    }
    Write-Host "  Authenticated successfully!" -ForegroundColor Green
}

# ── Step 2: Create Tunnel ───────────────────────────────────────────────────

Write-Step 2 "Create Named Tunnel"

# Check if tunnel already exists
$existingTunnels = & cloudflared tunnel list --output json 2>&1 | ConvertFrom-Json -ErrorAction SilentlyContinue
$existing = $existingTunnels | Where-Object { $_.name -eq $TunnelName }

if ($existing) {
    $tunnelId = $existing.id
    Write-Host "  Tunnel '$TunnelName' already exists (ID: $tunnelId)" -ForegroundColor Green
    Write-Host "  Reusing existing tunnel." -ForegroundColor DarkGray
} else {
    Write-Host "  Creating tunnel '$TunnelName'..." -ForegroundColor Yellow
    $createOutput = & cloudflared tunnel create $TunnelName 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Failed to create tunnel:" -ForegroundColor Red
        Write-Host "  $createOutput" -ForegroundColor DarkRed
        exit 1
    }

    # Parse tunnel ID from output
    if ($createOutput -match '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})') {
        $tunnelId = $Matches[1]
    } else {
        Write-Host "  Could not parse tunnel ID from output." -ForegroundColor Red
        Write-Host "  $createOutput" -ForegroundColor DarkRed
        exit 1
    }

    Write-Host "  Tunnel created! ID: $tunnelId" -ForegroundColor Green
}

# Find credentials file
$credFile = Get-ChildItem -Path $credDir -Filter "*.json" | Where-Object {
    $_.Name -match $tunnelId -or $_.Name -eq "$tunnelId.json"
} | Select-Object -First 1

if (-not $credFile) {
    # Try the common pattern
    $credFilePath = Join-Path $credDir "$tunnelId.json"
    if (Test-Path $credFilePath) {
        $credFile = Get-Item $credFilePath
    }
}

$credentialsPath = if ($credFile) { $credFile.FullName } else { Join-Path $credDir "$tunnelId.json" }

# ── Step 3: Configure Domain Names ──────────────────────────────────────────

Write-Step 3 "Configure Domain Names"
Write-Host "  Enter the hostnames you want to use for the dashboard." -ForegroundColor White
Write-Host "  The domain must already be added to your Cloudflare account." -ForegroundColor DarkGray
Write-Host ""

$dashboardHost = Read-Host "  Dashboard hostname (e.g., dashboard.yourdomain.com)"
$apiHost       = Read-Host "  API hostname       (e.g., api.yourdomain.com)"

if (-not $dashboardHost -or -not $apiHost) {
    Write-Host "  Both hostnames are required." -ForegroundColor Red
    exit 1
}

# ── Step 4: Create DNS Routes ───────────────────────────────────────────────

Write-Step 4 "Create DNS Routes"
Write-Host "  Creating CNAME records pointing to the tunnel..." -ForegroundColor Yellow

foreach ($host in @($dashboardHost, $apiHost)) {
    Write-Host "  Routing $host -> tunnel $TunnelName ..." -ForegroundColor White
    $dnsOutput = & cloudflared tunnel route dns $TunnelName $host 2>&1
    if ($LASTEXITCODE -ne 0) {
        # It might fail if the record already exists — that's ok
        if ($dnsOutput -match "already exists") {
            Write-Host "    DNS record already exists for $host (OK)" -ForegroundColor DarkGray
        } else {
            Write-Host "    Warning: $dnsOutput" -ForegroundColor Yellow
        }
    } else {
        Write-Host "    DNS route created for $host" -ForegroundColor Green
    }
}

# ── Step 5: Generate Config File ────────────────────────────────────────────

Write-Step 5 "Generate Configuration File"

$configPath = Join-Path $PSScriptRoot "cloudflared.yml"

$configContent = @"
# Cloudflare Named Tunnel configuration for WhatsApp Dashboard
# Generated by setup-tunnel.ps1 on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
#
# Run with:  cloudflared tunnel run $TunnelName
#   or:      npm run tunnel:run

tunnel: $tunnelId
credentials-file: $credentialsPath

ingress:
  # ── API + WebSocket backend (port $BackendPort) ──────────────────────────
  - hostname: $apiHost
    service: http://localhost:$BackendPort
    originRequest:
      noTLSVerify: true
      # Keep websocket connections alive for Socket.IO
      connectTimeout: 30s
      keepAliveTimeout: 90s

  # ── Frontend dashboard (port $FrontendPort) ──────────────────────────────
  - hostname: $dashboardHost
    service: http://localhost:$FrontendPort
    originRequest:
      noTLSVerify: true

  # ── Catch-all ────────────────────────────────────────────────────────────
  - service: http_status:404
"@

$configContent | Out-File -FilePath $configPath -Encoding utf8 -Force

Write-Host "  Config written to: $configPath" -ForegroundColor Green

# ── Summary ──────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║                    Setup Complete!                       ║" -ForegroundColor Green
Write-Host "  ╠══════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "  ║  Tunnel:     $TunnelName" -ForegroundColor White
Write-Host "  ║  Tunnel ID:  $tunnelId" -ForegroundColor White
Write-Host "  ║  Dashboard:  https://$dashboardHost" -ForegroundColor White
Write-Host "  ║  API:        https://$apiHost" -ForegroundColor White
Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "    1. Start your backend:    cd whatsapp-dashboard-backend && npm run dev" -ForegroundColor White
Write-Host "    2. Start your frontend:   npm run dev" -ForegroundColor White
Write-Host "    3. Start the tunnel:      npm run tunnel:run" -ForegroundColor White
Write-Host "       (or: cloudflared tunnel run $TunnelName)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Don't forget to update:" -ForegroundColor Yellow
Write-Host "    - Backend .env FRONTEND_ORIGIN=https://$dashboardHost" -ForegroundColor White
Write-Host "    - Backend .env CF_TUNNEL_ORIGIN=https://$dashboardHost" -ForegroundColor White
Write-Host "    - Google OAuth redirect URI -> https://$apiHost/api/v1/auth/oauth/google/callback" -ForegroundColor White
Write-Host "    - WhatsApp webhook URL     -> https://$apiHost/api/v1/webhooks/whatsapp" -ForegroundColor White
Write-Host ""
