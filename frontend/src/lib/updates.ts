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

type SemVerParts = {
  core: [number, number, number];
  prerelease: string[] | null;
};

function parseSemver(version: string): SemVerParts {
  const cleaned = normalizeVersion(version);
  const withoutBuild = cleaned.split("+", 1)[0] ?? cleaned;
  const dash = withoutBuild.indexOf("-");
  const coreRaw = dash === -1 ? withoutBuild : withoutBuild.slice(0, dash);
  const preRaw = dash === -1 ? null : withoutBuild.slice(dash + 1);

  const coreNums = coreRaw.split(".").map((part) => {
    const n = Number.parseInt(part, 10);
    return Number.isFinite(n) ? n : 0;
  });
  while (coreNums.length < 3) coreNums.push(0);

  return {
    core: [coreNums[0] ?? 0, coreNums[1] ?? 0, coreNums[2] ?? 0],
    prerelease: preRaw ? preRaw.split(".").filter(Boolean) : null,
  };
}

function comparePrerelease(a: string[], b: string[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left === undefined) return -1;
    if (right === undefined) return 1;

    const leftNum = /^\d+$/.test(left);
    const rightNum = /^\d+$/.test(right);
    if (leftNum && rightNum) {
      const diff = Number(left) - Number(right);
      if (diff !== 0) return diff;
      continue;
    }
    if (leftNum !== rightNum) return leftNum ? -1 : 1;
    if (left !== right) return left < right ? -1 : 1;
  }
  return 0;
}

/** Returns positive if a > b, negative if a < b, 0 if equal. Build metadata is ignored. */
export function compareSemver(a: string, b: string): number {
  const left = parseSemver(a);
  const right = parseSemver(b);

  for (let i = 0; i < 3; i += 1) {
    const diff = left.core[i] - right.core[i];
    if (diff !== 0) return diff;
  }

  if (!left.prerelease && !right.prerelease) return 0;
  if (!left.prerelease) return 1;
  if (!right.prerelease) return -1;
  return comparePrerelease(left.prerelease, right.prerelease);
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
