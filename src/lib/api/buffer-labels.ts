/** Channel shape — safe to import in both server and client components. */
export interface BufferChannel {
  id: string;
  name: string;
  displayName: string;
  service: string;
  type: string;
  avatar: string | null;
  isDisconnected: boolean;
}

/** Platform display name — safe to import in both server and client components. */
export function serviceName(service: string): string {
  const map: Record<string, string> = {
    linkedin: "LinkedIn",
    googlebusiness: "Google Business",
    twitter: "X (Twitter)",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    pinterest: "Pinterest",
    mastodon: "Mastodon",
    threads: "Threads",
    bluesky: "Bluesky",
    youtube: "YouTube",
  };
  return map[service] ?? service;
}
