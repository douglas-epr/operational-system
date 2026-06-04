/**
 * Buffer API client — social scheduling via Buffer's GraphQL API.
 * Replaces Postiz. Endpoint: https://graph.buffer.com/
 * Auth: raw Bearer token (BUFFER_API_KEY env var).
 *
 * Buffer's public API does NOT expose post engagement analytics (likes,
 * comments, impressions). What it does provide:
 *   - Channel list (id, name, service/platform, avatar, connection status)
 *   - Post creation / scheduling (queue, now, next, custom time)
 *   - Post status tracking (draft, scheduled, sent, error)
 *   - externalLink — the live URL of a sent post on the platform
 *
 * For Google Business Profile, Buffer can publish but GBP Insights
 * require a separate Google OAuth integration not in scope here.
 */

import "server-only";
import type { BufferChannel } from "./buffer-labels";
export type { BufferChannel };

const GRAPHQL = "https://api.buffer.com/graphql";

function apiKey(): string {
  const k = process.env.BUFFER_API_KEY;
  if (!k) throw new Error("Missing env: BUFFER_API_KEY");
  return k;
}

async function gql<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data as T;
}

export interface BufferPost {
  id: string;
  status: "draft" | "needs_approval" | "scheduled" | "sending" | "sent" | "error";
  text: string | null;
  dueAt: string | null;
  sentAt: string | null;
  createdAt: string;
  channelId: string;
  channelService: string;
  shareMode: string | null;
  externalLink: string | null; // live URL on the social platform
  error: string | null;
}

export interface CreatePostResult {
  returned_an_error: boolean;
  error?: string;
  post?: BufferPost;
}

// ── Organisation ──────────────────────────────────────────────────────────────

export async function getOrgId(): Promise<string> {
  const k = process.env.BUFFER_ORG_ID;
  if (k) return k;
  const data = await gql<{ account: { organizations: { id: string }[] } }>(
    `{ account { organizations { id } } }`
  );
  const id = data.account.organizations[0]?.id;
  if (!id) throw new Error("No Buffer organization found.");
  return id;
}

// ── Channels ──────────────────────────────────────────────────────────────────

/** List all connected social channels for the workspace. */
export async function listChannels(): Promise<BufferChannel[]> {
  const orgId = await getOrgId();
  const data = await gql<{
    channels: {
      id: string;
      name: string;
      displayName: string;
      service: string;
      type: string;
      avatar: string | null;
      isDisconnected: boolean;
      isLocked: boolean;
    }[];
  }>(
    `query ListChannels($input: ChannelsInput!) {
      channels(input: $input) {
        id name displayName service type avatar isDisconnected isLocked
      }
    }`,
    { input: { organizationId: orgId } }
  );

  return (data.channels ?? [])
    .filter((c) => !c.isDisconnected && !c.isLocked)
    .map((c) => ({
      id: c.id,
      name: c.displayName || c.name,
      displayName: c.displayName,
      service: c.service,
      type: c.type,
      avatar: c.avatar,
      isDisconnected: c.isDisconnected,
    }));
}

// ── Posts ─────────────────────────────────────────────────────────────────────

/** List sent/scheduled posts for the workspace. */
export async function listSentPosts(limit = 50): Promise<BufferPost[]> {
  const orgId = await getOrgId();
  const data = await gql<{
    posts: {
      edges: {
        node: {
          id: string;
          status: string;
          text: string | null;
          dueAt: string | null;
          sentAt: string | null;
          createdAt: string;
          channelId: string;
          channelService: string;
          shareMode: string | null;
          externalLink: string | null;
          error: string | null;
        };
      }[];
    };
  }>(
    `query ListSentPosts($input: PostsInput!, $first: Int) {
      posts(input: $input, first: $first) {
        edges {
          node {
            id status text dueAt sentAt createdAt channelId channelService
            shareMode externalLink error
          }
        }
      }
    }`,
    {
      input: { organizationId: orgId, status: ["sent"] },
      first: limit,
    }
  );

  return (data.posts.edges ?? []).map((e) => ({
    ...e.node,
    status: e.node.status as BufferPost["status"],
  }));
}

// ── Scheduling ────────────────────────────────────────────────────────────────

export interface ScheduleInput {
  channelId: string;
  text: string;
  /** "now" = shareNow, "schedule" = customScheduled (requires dueAt). */
  mode: "now" | "schedule";
  dueAt?: string; // ISO 8601, required for "schedule"
  /** Public URL of an image to attach (uploaded to Supabase Storage first). */
  imageUrl?: string;
}

/**
 * Create a post in Buffer. Returns the created post or an error.
 * Uses `shareNow` for immediate publish, `customScheduled` for a future time.
 */
export async function createPost(input: ScheduleInput): Promise<CreatePostResult> {
  const mode = input.mode === "now" ? "shareNow" : "customScheduled";

  const variables: Record<string, unknown> = {
    input: {
      channelId: input.channelId,
      text: input.text,
      schedulingType: "automatic",
      mode,
      ...(mode === "customScheduled" && input.dueAt ? { dueAt: input.dueAt } : {}),
      assets: input.imageUrl
        ? [{ image: { url: input.imageUrl, metadata: { altText: "" } } }]
        : [],
    },
  };

  // createPost returns a union: PostActionSuccess | error types
  type PostActionResult = {
    createPost:
      | { __typename: "PostActionSuccess"; post: { id: string; status: string; text: string | null; dueAt: string | null; sentAt: string | null; createdAt: string; channelId: string; channelService: string; shareMode: string | null; externalLink: string | null; error: string | null } }
      | { __typename: string; message: string };
  };

  try {
    const data = await gql<PostActionResult>(
      `mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          __typename
          ... on PostActionSuccess {
            post {
              id status text dueAt sentAt createdAt channelId channelService
              shareMode externalLink error
            }
          }
          ... on NotFoundError { message }
          ... on UnauthorizedError { message }
          ... on UnexpectedError { message }
          ... on RestProxyError { message }
          ... on LimitReachedError { message }
          ... on InvalidInputError { message }
        }
      }`,
      variables
    );

    const result = data.createPost;
    if (result.__typename !== "PostActionSuccess") {
      return { returned_an_error: true, error: (result as { message: string }).message ?? result.__typename };
    }

    const post = (result as { __typename: "PostActionSuccess"; post: { id: string; status: string; text: string | null; dueAt: string | null; sentAt: string | null; createdAt: string; channelId: string; channelService: string; shareMode: string | null; externalLink: string | null; error: string | null } }).post;
    return {
      returned_an_error: false,
      post: { ...post, status: post.status as BufferPost["status"] },
    };
  } catch (e) {
    return {
      returned_an_error: true,
      error: e instanceof Error ? e.message : "Buffer API error",
    };
  }
}

/** Delete a post from Buffer. */
export async function deletePost(bufferId: string): Promise<{ error?: string }> {
  try {
    await gql(
      `mutation DeletePost($input: DeletePostInput!) {
        deletePost(input: $input) {
          __typename
          ... on DeletePostSuccess { success }
          ... on VoidMutationError { message }
        }
      }`,
      { input: { id: bufferId } }
    );
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Buffer delete failed" };
  }
}

// ── REST v1 Analytics API ─────────────────────────────────────────────────────
// Buffer's legacy REST API exposes per-post statistics (reach, clicks,
// likes, comments, impressions) that are NOT available in the GraphQL API.
// Endpoint: https://api.buffer.com/1/

const REST_BASE = "https://api.buffer.com/1";

async function restGet<T>(path: string): Promise<T> {
  const res = await fetch(`${REST_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Buffer REST API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface BufferRestProfile {
  id: string;
  service: string;
  service_username: string;
  avatar: string;
  statistics: {
    followers: number;
    following?: number;
    posts?: number;
  };
}

export interface BufferPostStats {
  id: string;
  text: string;
  service_type: string;
  created_at: number;
  sent_at?: number;
  statistics: {
    /** Impressions / reach across platforms */
    reach?: number;
    impressions?: number;
    /** Engagement actions */
    clicks?: number;
    likes?: number;
    favorites?: number;
    comments?: number;
    retweets?: number;
    mentions?: number;
    shares?: number;
  };
  profile_id: string;
}

/** Fetch all connected Buffer profiles (REST v1). */
export async function getBufferProfiles(): Promise<BufferRestProfile[]> {
  try {
    const profiles = await restGet<BufferRestProfile[]>("/profiles.json");
    return Array.isArray(profiles) ? profiles : [];
  } catch {
    return [];
  }
}

/** Fetch sent posts with engagement statistics for a given profile (REST v1). */
export async function getPostedAnalytics(
  profileId: string,
  count = 25
): Promise<BufferPostStats[]> {
  try {
    const data = await restGet<{ data?: BufferPostStats[]; total?: number }>(
      `/profiles/${profileId}/updates/sent.json?count=${count}&page=1`
    );
    return data.data ?? [];
  } catch {
    return [];
  }
}

export { serviceName } from "./buffer-labels";
