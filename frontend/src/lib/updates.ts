export type LatestRelease = {
  version: string;
  tagName: string;
  htmlUrl: string;
  name: string;
  body: string;
};

const RELEASES_API = "https://api.github.com/repos/dhanushk-offl/prevu/releases/latest";
const DISMISSED_KEY = "prevu.update.dismissed.v1";

export function normalizeVersion(value: string): string {
  return value.trim().replace(/^v/i, "");
}

/** Returns positive if a > b, negative if a < b, 0 if equal. */
export function compareSemver(a: string, b: string): number {
  const pa = normalizeVersion(a).split(/[.+-]/).map((part) => Number.parseInt(part, 10) || 0);
  const pb = normalizeVersion(b).split(/[.+-]/).map((part) => Number.parseInt(part, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const left = pa[i] ?? 0;
    const right = pb[i] ?? 0;
    if (left !== right) return left - right;
  }
  return 0;
}

export function isNewerVersion(latest: string, current: string): boolean {
  return compareSemver(latest, current) > 0;
}

export function readDismissedVersion(): string | null {
  try {
    return window.localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

export function dismissUpdateVersion(version: string) {
  try {
    window.localStorage.setItem(DISMISSED_KEY, normalizeVersion(version));
  } catch {
    // ignore
  }
}

export async function fetchLatestRelease(signal?: AbortSignal): Promise<LatestRelease | null> {
  const response = await fetch(RELEASES_API, {
    signal,
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "PREVU-update-check",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub releases request failed (${response.status})`);
  }

  const data = (await response.json()) as {
    tag_name?: string;
    html_url?: string;
    name?: string;
    body?: string;
    draft?: boolean;
    prerelease?: boolean;
  };

  if (!data.tag_name || !data.html_url || data.draft) return null;

  return {
    version: normalizeVersion(data.tag_name),
    tagName: data.tag_name,
    htmlUrl: data.html_url,
    name: data.name || data.tag_name,
    body: data.body || "",
  };
}
