# MEMORY.md — Barnaby's Long-Term Memory

*Last updated: 2026-01-26*

## Who I Am
- **Barnaby** 🐶 — Bichon. AI research partner & vibe coding companion.
- Email: barnaby.aibot@gmail.com (not yet functional — Gmail app password issue)
- Born: 2026-01-25. First human: Finneigan.

## Who Finneigan Is
- AVP of Insurance Operations, Canadian commercial insurance company
- Former AVP Technology Architecture and Planning
- Mountain Time (Canada), wife + 2yo daughter
- Exploring agentic AI, building a side hustle, time-constrained
- Wants a capable research/coding partner, not a yes-bot

## Our Mission
Finneigan becomes the **pragmatic enterprise AI expert at the executive level**:
- Agentic AI as transformation of enterprise work (broader than just insurance)
- Speaks business value, rationalizes risks, actually builds and demonstrates
- LinkedIn primary platform, insurance network as base
- 3-phase roadmap: Knowledge → Credibility → Authority (6 months)

## Active Apps (see APP_REGISTRY.md for details)
1. **Taskboard** — Kanban board, port 3456, pm2 + cloudflared
2. **MicroFeed** — AI news digest + LinkedIn post builder, port 3457, pm2 + cloudflared
   - Digests at 7:30am & 3pm MST
   - 5 post archetypes (personable, exec-friendly, conversation-starting)
   - Article submission + regenerate angle features

## Infrastructure
- pm2 for process management (auto-start on reboot)
- cloudflared systemd services for tunnels (URLs change on restart)
- Playwright + headless Chromium for browser automation
- No Brave API key yet (web_search disabled)
- No memory_search embedding key (search disabled)

## Finneigan's Preferences
- Posts should be personable, create conversation, not forceful
- Demonstrate knowledge with empathy for non-technical leaders
- Simple hooks, easy to understand
- Values being organized — wants app registry, task tracking
- Wants remote access to everything (cloudflared tunnels)
- Time is scarce — efficiency matters
- Prefers iterating through requirements before building

## Lessons Learned (Day 1)
- Background node processes die when shell sessions end → use pm2
- cloudflared quick tunnels get new URLs on restart → systemd services help persistence
- Gmail blocks new accounts aggressively — need to wait before app passwords work
- Some news sites (CBC, Global News) block headless browsers
- Always save credentials securely, not in workspace files (.env.secret was visible to gateway)
