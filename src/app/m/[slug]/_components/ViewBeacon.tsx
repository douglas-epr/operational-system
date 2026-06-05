"use client";

/**
 * ViewBeacon — fires a one-shot "view" analytics event when a public landing
 * page mounts. Best-effort; failures are swallowed so they never affect the
 * visitor experience. A per-tab session id (sessionStorage) lets the dashboard
 * distinguish unique sessions from raw views later.
 */

import { useEffect } from "react";

function getSessionId(): string {
  try {
    const KEY = "mkt_sid";
    let sid = sessionStorage.getItem(KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(KEY, sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

export default function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const v = sp.get(k);
      if (v) utm[k] = v;
    }

    void fetch("/api/m/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        slug,
        type: "view",
        sessionId: getSessionId(),
        utm,
      }),
    }).catch(() => {});
  }, [slug]);

  return null;
}
