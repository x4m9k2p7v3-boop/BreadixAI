@echo off
echo Installing Cloudflare Tunnel...
echo.
echo Download from: https://github.com/cloudflare/cloudflared/releases/latest
echo.
echo After installation, run:
echo cloudflared tunnel --url http://localhost:20128
echo.
echo Copy the generated URL (https://xxx.trycloudflare.com)
echo and update .env file with: API_URL=https://xxx.trycloudflare.com/v1/chat/completions
echo.
pause
