<#
.SYNOPSIS
  Quick-tunnel launcher for WhatsApp Dashboard development.
  Spins up two Cloudflare quick-tunnels (frontend :3000 + backend :4000)
  and prints the public URLs.

.DESCRIPTION
  This script:
  1. Launches a cloudflared quick-tunnel for the backend  (port 4000)
  2. Captures the assigned *.trycloudflare.com URL
  3. Launches a cloudflared quick-tunnel for the frontend (port 3000)
  4. Captures its URL too
  5. Prints both URLs clearly
  6. Cleans up both processes on Ctrl+C

.NOTES
  Prerequisites:
    - cloudflared installed and on PATH
    - Frontend dev server running on port 3000  (npm run dev)
    - Backend dev server running on port 4000   (npm run dev in backend/)

.EXAMPLE
  .\start-tunnel.ps1
  .\start-tunnel.ps1 -FrontendPort 3000 -BackendPort 4000
#>

param(
    [int]$FrontendPort = 3000,
    [int]$BackendPort  = 4000,
    [int]$TimeoutSeconds = 30
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Helpers ──────────────────────────────────────────────────────────────────

function Write-Banner {
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║   WhatsApp Dashboard — Cloudflare Quick Tunnels     ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Test-PortListening([int]$Port) {
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("127.0.0.1", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

function Start-QuickTunnel([int]$Port, [string]$Label) {
    Write-Host "  [$Label] Starting quick tunnel for localhost:$Port ..." -ForegroundColor Yellow

    # cloudflared prints the URL to stderr
    $logFile = Join-Path $env:TEMP "cloudflared-$Label-$Port.log"
    if (Test-Path $logFile) { Remove-Item $logFile -Force }

    $process = Start-Process -FilePath "cloudflared" `
        -ArgumentList "tunnel", "--url", "http://localhost:$Port", "--no-autoupdate" `
        -RedirectStandardError $logFile `
        -PassThru -NoNewWindow -WindowStyle Hidden

    # Wait for the URL to appear in the log
    $url = $null
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        Start-Sleep -Seconds 1
        $elapsed++

        if ($process.HasExited) {
            $errorLog = if (Test-Path $logFile) { Get-Content $logFile -Raw } else { "(no log)" }
            Write-Host "  [$Label] cloudflared exited unexpectedly!" -ForegroundColor Red
            Write-Host $errorLog -ForegroundColor DarkRed
            return @{ Process = $null; Url = $null; LogFile = $logFile }
        }

        if (Test-Path $logFile) {
            $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
            if ($content -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') {
                $url = $Matches[0]
                break
            }
        }
    }

    if (-not $url) {
        Write-Host "  [$Label] Timed out waiting for tunnel URL (${TimeoutSeconds}s)" -ForegroundColor Red
        return @{ Process = $process; Url = $null; LogFile = $logFile }
    }

    Write-Host "  [$Label] Tunnel ready!" -ForegroundColor Green
    return @{ Process = $process; Url = $url; LogFile = $logFile }
}

# ── Main ─────────────────────────────────────────────────────────────────────

Write-Banner

# Check cloudflared
try {
    $version = & cloudflared --version 2>&1
    Write-Host "  Using: $version" -ForegroundColor DarkGray
} catch {
    Write-Host "  ERROR: cloudflared is not installed or not on PATH." -ForegroundColor Red
    Write-Host "  Install it from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check ports
$backendUp  = Test-PortListening $BackendPort
$frontendUp = Test-PortListening $FrontendPort

if (-not $backendUp) {
    Write-Host "  WARNING: Nothing listening on port $BackendPort (backend)." -ForegroundColor Yellow
    Write-Host "           Start the backend first: cd whatsapp-dashboard-backend && npm run dev" -ForegroundColor Yellow
    Write-Host ""
}
if (-not $frontendUp) {
    Write-Host "  WARNING: Nothing listening on port $FrontendPort (frontend)." -ForegroundColor Yellow
    Write-Host "           Start the frontend first: npm run dev" -ForegroundColor Yellow
    Write-Host ""
}

# Launch tunnels
$backendTunnel  = Start-QuickTunnel -Port $BackendPort  -Label "Backend"
$frontendTunnel = Start-QuickTunnel -Port $FrontendPort -Label "Frontend"

$processes = @($backendTunnel.Process, $frontendTunnel.Process) | Where-Object { $_ -ne $null }

# Cleanup handler
$cleanup = {
    Write-Host ""
    Write-Host "  Shutting down tunnels..." -ForegroundColor Yellow
    foreach ($proc in $processes) {
        if ($proc -and -not $proc.HasExited) {
            try { $proc.Kill() } catch { }
        }
    }
    # Clean up temp log files
    foreach ($t in @($backendTunnel, $frontendTunnel)) {
        if ($t.LogFile -and (Test-Path $t.LogFile)) {
            Remove-Item $t.LogFile -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "  Tunnels stopped." -ForegroundColor Green
}

# Register Ctrl+C handler
[Console]::TreatControlCAsInput = $false
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $cleanup

# Print results
Write-Host ""
Write-Host "  ┌──────────────────────────────────────────────────────────┐" -ForegroundColor Green
Write-Host "  │                  Tunnel URLs Ready                       │" -ForegroundColor Green
Write-Host "  ├──────────────────────────────────────────────────────────┤" -ForegroundColor Green

if ($frontendTunnel.Url) {
    Write-Host "  │  Frontend:  $($frontendTunnel.Url)" -ForegroundColor White
} else {
    Write-Host "  │  Frontend:  FAILED — check log" -ForegroundColor Red
}

if ($backendTunnel.Url) {
    Write-Host "  │  Backend:   $($backendTunnel.Url)" -ForegroundColor White
} else {
    Write-Host "  │  Backend:   FAILED — check log" -ForegroundColor Red
}

Write-Host "  └──────────────────────────────────────────────────────────┘" -ForegroundColor Green
Write-Host ""

if ($frontendTunnel.Url -and $backendTunnel.Url) {
    Write-Host "  NOTE: The frontend Vite proxy handles /api/v1 and /socket.io" -ForegroundColor DarkGray
    Write-Host "        routing, so the frontend tunnel URL is all you need to" -ForegroundColor DarkGray
    Write-Host "        share. The backend tunnel is for direct API access or" -ForegroundColor DarkGray
    Write-Host "        webhook callbacks (e.g., WhatsApp webhook URL)." -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  WhatsApp Webhook URL:" -ForegroundColor Cyan
    Write-Host "    $($backendTunnel.Url)/api/v1/webhooks/whatsapp" -ForegroundColor White
    Write-Host ""
    Write-Host "  Google OAuth Redirect URI (update in Google Cloud Console):" -ForegroundColor Cyan
    Write-Host "    $($backendTunnel.Url)/api/v1/auth/oauth/google/callback" -ForegroundColor White
    Write-Host ""
}

Write-Host "  Press Ctrl+C to stop all tunnels." -ForegroundColor DarkGray
Write-Host ""

# Keep running until Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 5

        # Check if either tunnel died
        foreach ($entry in @(@{T=$backendTunnel; L="Backend"}, @{T=$frontendTunnel; L="Frontend"})) {
            $t = $entry.T
            if ($t.Process -and $t.Process.HasExited) {
                Write-Host "  [$($entry.L)] Tunnel process exited (code $($t.Process.ExitCode))" -ForegroundColor Red
                $t.Process = $null
            }
        }

        $alive = @($backendTunnel.Process, $frontendTunnel.Process) | Where-Object { $_ -ne $null }
        if ($alive.Count -eq 0) {
            Write-Host "  All tunnels have exited." -ForegroundColor Red
            break
        }
    }
} finally {
    & $cleanup
}
