#!/bin/bash
# Cloudflared tunnel script
# Tunnels both taskboard (3456) and microfeed (3457)

# Kill any existing tunnel
pkill -f "cloudflared.*3457" 2>/dev/null

# Start tunnel for microfeed (main app)
exec /tmp/cloudflared tunnel --url http://localhost:3457
