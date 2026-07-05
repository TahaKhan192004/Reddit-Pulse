// Server-only. Never import this from a "use client" component —
// GITHUB_TOKEN must never reach the browser bundle.
export async function dispatchWorkflow(mode: string, force: boolean): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const ref = process.env.GITHUB_REF || "main";

  if (!token || !repo) {
    throw new Error("GITHUB_TOKEN and GITHUB_REPO must be set to trigger a run");
  }

  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/scrape.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref, inputs: { mode, force: force ? "true" : "false" } }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }
}
