import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext configuration for Cloudflare Workers.
 *
 * Deliberately minimal. The incremental cache, tag cache and queue adapters are
 * left at their defaults because this app opts out of Next's data cache almost
 * everywhere: every page is `force-dynamic` or gated by `requirePageAccess`,
 * and there is no `unstable_cache`, `"use cache"` or `revalidateTag` anywhere
 * in src/ (see .specs/codebase/ARCHITECTURE.md). Adding an R2 or KV cache
 * binding here would provision storage nothing reads.
 *
 * Revisit if ISR or `revalidateTag` is introduced: at that point wire
 * `incrementalCache` to R2 and `tagCache` to D1 or KV.
 */
export default defineCloudflareConfig();
