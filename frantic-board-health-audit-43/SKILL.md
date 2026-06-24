---
name: board-health-audit
description: Audit the public Frantic board and bounty read model using only public URLs.
source:
  type: cli-tool
  command: D:\NodeJS\node.exe
  args:
    - run.mjs
  timeout_seconds: 60
  sandbox:
    profile: readonly
    cwd_policy: workspace
    require_enforcement: false
inputs:
  board_url:
    type: string
    required: true
    description: Public Frantic board API URL.
  bounty_numbers:
    type: string
    required: true
    description: Comma-separated Frantic bounty numbers to sample through public API and web URLs.
runx:
  category: ops
  input_resolution:
    required:
      - board_url
      - bounty_numbers
---

# Frantic board health audit

Fetches the public Frantic board API and a sample of public bounty API/web pages.
It reports board counts, stale/duplicate/crowding signals, confusing fields, and
operator recommendations without private credentials.
