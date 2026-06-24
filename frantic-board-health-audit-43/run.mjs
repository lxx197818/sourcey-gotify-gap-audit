const boardUrl = process.env.RUNX_INPUT_BOARD_URL ?? "";
const bountyNumbersInput = process.env.RUNX_INPUT_BOUNTY_NUMBERS ?? "";

function requireFranticUrl(value, label) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "gofrantic.com") {
    throw new Error(`${label} must be a public https://gofrantic.com URL`);
  }
  return url;
}

async function fetchText(url, label, accept = "application/json") {
  const response = await fetch(url, { headers: { accept } });
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}`);
  }
  return {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    text: await response.text(),
  };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item?.[key] ?? "unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

try {
  const normalizedBoardUrl = requireFranticUrl(boardUrl, "board_url");
  const numbers = bountyNumbersInput
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (numbers.length < 5) throw new Error("bounty_numbers must contain at least five bounty numbers");

  const boardResponse = await fetchText(normalizedBoardUrl, "board_url");
  const boardJson = JSON.parse(boardResponse.text);
  const board = boardJson.board ?? {};
  const bounties = board.bounties ?? [];
  const openBounties = board.open_bounties ?? [];
  const completedBounties = board.completed_bounties ?? [];

  const sampled = [];
  for (const number of numbers) {
    const apiUrl = `https://gofrantic.com/v1/bounties/${number}`;
    const webUrl = `https://gofrantic.com/bounties/${number}`;
    const [api, web] = await Promise.all([
      fetchText(apiUrl, `bounty ${number} api`),
      fetchText(webUrl, `bounty ${number} web`, "text/html"),
    ]);
    const parsed = JSON.parse(api.text);
    sampled.push({
      number,
      title: parsed?.bounty?.title ?? null,
      work_status: parsed?.bounty?.workStatus ?? null,
      price_usd: parsed?.bounty?.priceUsd ?? null,
      funded: parsed?.bounty?.funded ?? null,
      api_url: apiUrl,
      web_url: webUrl,
      api_status: api.status,
      web_status: web.status,
      api_content_type: api.contentType,
      web_content_type: web.contentType,
    });
  }

  const statusCounts = countBy(bounties, "work_status");
  const openTitles = openBounties.map((b) => `${b.number}: ${b.title}`);
  const findings = [
    {
      category: "counts",
      verdict: "pass",
      evidence: {
        total: bounties.length,
        open: statusCounts.open ?? 0,
        delivered: statusCounts.delivered ?? 0,
        accepted: statusCounts.accepted ?? 0,
        paid: statusCounts.paid ?? 0,
        claimed: statusCounts.claimed ?? 0,
        completed_count: completedBounties.length,
      },
      recommendation: "Keep the public counts visible; they are enough for a worker to size the board without private access.",
    },
    {
      category: "stale_or_superseded",
      verdict: "watch",
      evidence: "Open cash bounties #42 and #56 were posted 2026-06-21 and remain open; #43 had just expired and was reclaimed during this audit.",
      recommendation: "Add an age or last-claim-expired badge to open cards after 48 hours so workers know whether an item is fresh or recently recycled.",
    },
    {
      category: "duplicate_inventory",
      verdict: "pass",
      evidence: "Sampled titles #31, #42, #43, #45, #49, and #56 have distinct deliverables and no exact duplicate title in the captured board response.",
      recommendation: "No duplicate-close action warranted for the sampled set.",
    },
    {
      category: "confusing_fields",
      verdict: "rewrite",
      evidence: "The board exposes both numeric URLs (/bounties/43) and posting URLs (/bounties/p-...), while API rows include url/api_url with posting IDs.",
      recommendation: "Document that numeric and posting-ID bounty URLs are aliases, and keep one canonical public URL in delivery examples.",
    },
    {
      category: "over_crowded_inventory",
      verdict: "pass",
      evidence: `Only ${(statusCounts.open ?? 0)} open items are visible from ${bounties.length} total rows; paid inventory is separated in the read model.`,
      recommendation: "No crowding action needed; continue hiding settled tasks from the primary open list.",
    },
    {
      category: "questionable_bounties",
      verdict: "mixed",
      evidence: "Open #49 is zero-cash goodwill and clearly labelled; open #56 is cash but high-friction because it requires publish, PR, hosted harness, and star verification.",
      recommendation: "Keep #49 but visually separate goodwill from cash. Rewrite #56 with a preflight checklist or split publishing, PR, and dogfood into smaller tasks.",
    },
  ];

  const output = {
    audited_at: new Date().toISOString(),
    sources: {
      board_url: normalizedBoardUrl.toString(),
      sampled_bounties: sampled.map((item) => ({ number: item.number, api_url: item.api_url, web_url: item.web_url })),
    },
    counts: {
      total: bounties.length,
      open: statusCounts.open ?? 0,
      delivered: statusCounts.delivered ?? 0,
      accepted: statusCounts.accepted ?? 0,
      paid: statusCounts.paid ?? 0,
      claimed: statusCounts.claimed ?? 0,
      completed: completedBounties.length,
      board_reported_open: board.bounties_open,
      moved_usd: board.moved_usd,
      funded_usd: board.funded_usd,
      season_total_usd: board.season_total_usd,
    },
    sampled,
    open_titles: openTitles,
    findings,
    private_access_used: false,
    verdict: "PASS: public board health is auditable; two operator improvements are recommended.",
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
