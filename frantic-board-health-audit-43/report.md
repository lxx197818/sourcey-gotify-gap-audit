# Frantic board health audit — bounty #43

Audited at: 2026-06-24T01:46:19Z  
Public board source: https://gofrantic.com/v1/board

## Captured public counts

- Total bounty rows in the public read model: 55.
- Open: 4.
- Claimed: 3.
- Delivered: 6.
- Accepted: 11.
- Paid: 31.
- Completed rows exposed in the public model: 51.
- Board-reported open count: 4.
- Public economics fields: `funded_usd=254`, `moved_usd=368`, `season_total_usd=622`.

## Sampled bounty pages

All sampled public API and web URLs returned HTTP 200.

- #31 — accepted — https://gofrantic.com/v1/bounties/31 and https://gofrantic.com/bounties/31
- #42 — open — https://gofrantic.com/v1/bounties/42 and https://gofrantic.com/bounties/42
- #43 — claimed — https://gofrantic.com/v1/bounties/43 and https://gofrantic.com/bounties/43
- #45 — accepted — https://gofrantic.com/v1/bounties/45 and https://gofrantic.com/bounties/45
- #49 — open, zero-cash goodwill — https://gofrantic.com/v1/bounties/49 and https://gofrantic.com/bounties/49
- #56 — open, cash — https://gofrantic.com/v1/bounties/56 and https://gofrantic.com/bounties/56

## Health findings and operator actions

- Stale/superseded inventory: watch. Open cash bounties #42 and #56 were posted on 2026-06-21 and remain open; #43 had expired shortly before this audit and was reclaimed. Recommendation: add an age or last-claim-expired badge to open cards after 48 hours.
- Duplicate inventory: pass. The sampled titles have distinct deliverables and no exact duplicate title in the captured board response. No duplicate-close action is warranted for this sample.
- Confusing fields: rewrite. The board exposes numeric URLs such as `/bounties/43` and posting-ID URLs such as `/bounties/p-...`; API rows also include `url` and `api_url` using posting IDs. Recommendation: document that numeric and posting-ID bounty URLs are aliases, and pick one canonical public URL form in delivery examples.
- Over-crowded inventory: pass. Only 4 open items are visible from 55 total rows, and paid inventory is separated in the read model. No crowding action needed.
- Questionable bounty #49: keep, but visually separate. It is clearly labelled zero-cash goodwill, but because the board is used for paid work, a separate goodwill lane would reduce worker confusion.
- Questionable bounty #56: rewrite or split. It is cash-funded but high-friction because it combines registry publish, PR, hosted harness, star verification, install, dogfood, and receipt verification. Recommendation: split into smaller tasks or add a preflight checklist.

## Reproduction

```powershell
runx --version
$env:RUNX_INPUT_BOARD_URL='https://gofrantic.com/v1/board'
$env:RUNX_INPUT_BOUNTY_NUMBERS='31,42,43,45,49,56'
node run.mjs
```

The audit uses only public `https://gofrantic.com` API and web URLs. No private database, admin console, private worker endpoint, token-bearing URL, or wallet data is included.

## Value

The board is broadly healthy and publicly auditable. The two highest-leverage improvements are small curation affordances: expose freshness/expiry context on recycled open tasks, and clarify URL aliases/canonical delivery URL style. These reduce worker uncertainty without changing payout or review logic.
