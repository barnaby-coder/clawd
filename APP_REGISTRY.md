# Application Registry

Apps built by Finneigan & Barnaby. Updated as we build.

---

## Active Applications

### 📋 Taskboard
| Field | Value |
|-------|-------|
| **Purpose** | Kanban-style project/task management |
| **Location** | `/home/ubuntu/clawd/taskboard/` |
| **Port** | 3456 |
| **URL** | https://license-survive-derek-media.trycloudflare.com |
| **Process** | pm2 (name: taskboard) |
| **Created** | 2026-01-25 |

**Features:**
- Projects with color coding
- Drag-drop Kanban columns (Backlog → In Progress → Done)
- Persistent JSON storage

---

### 📰 MicroFeed
| Field | Value |
|-------|-------|
| **Purpose** | AI news aggregation + LinkedIn post builder |
| **Location** | `/home/ubuntu/clawd/microfeed/` |
| **Port** | 3457 |
| **URL** | https://agrees-brain-above-occupations.trycloudflare.com |
| **Process** | pm2 (name: microfeed) |
| **Created** | 2026-01-26 |

**Features:**
- RSS collection from AI sources
- Relevance scoring for enterprise/agentic AI
- Scheduled Telegram digests (7:30am, 3pm MST)
- LinkedIn post suggestions
- Knowledge archive

**Sources:** OpenAI Blog, LangChain, MIT Tech Review, VentureBeat AI, Hacker News

---

## Infrastructure

### Tunnels (Cloudflare)
| Service | Port | Status |
|---------|------|--------|
| cloudflared-tunnel (microfeed) | 3457 | systemd enabled |
| cloudflared-taskboard | 3456 | systemd enabled |

### Process Manager
- **pm2** - Manages Node.js apps
- Auto-starts on reboot via systemd (pm2-ubuntu.service)

---

## Commands Cheatsheet

```bash
# Check app status
pm2 list

# Restart an app
pm2 restart taskboard
pm2 restart microfeed

# View logs
pm2 logs microfeed --lines 50

# Get current tunnel URLs
sudo journalctl -u cloudflared-tunnel -n 20 | grep trycloudflare
sudo journalctl -u cloudflared-taskboard -n 20 | grep trycloudflare

# Restart tunnels (gets new URLs)
sudo systemctl restart cloudflared-tunnel
sudo systemctl restart cloudflared-taskboard
```

---

## Planned / Ideas

- [ ] Gmail integration for Barnaby
- [ ] More RSS sources
- [ ] Improved post generation
- [ ] Content calendar integration

---

*Last updated: 2026-01-26*
