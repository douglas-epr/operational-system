/**
 * Chatbot turn runner.
 *
 * Loads the conversation history + system prompt, runs an Anthropic-style
 * tool-use loop against the configured AI provider (OpenAI/Gemini/Claude
 * — whatever the user picked in /settings), and persists the assistant
 * reply with a tool_calls trace.
 *
 * The "tool protocol" is just JSON over plain text:
 *   - The system prompt lists the available tools and tells the model:
 *       "to call a tool, reply with EXACTLY this JSON envelope:
 *         { 'tool': <name>, 'args': {...} }
 *       and nothing else"
 *   - When the model returns such an envelope, we parse it, run the
 *     tool via the user's Supabase client (RLS clamps the result), and
 *     re-prompt with the tool result appended to the conversation.
 *   - Otherwise the message is the final reply.
 */

import { createClient } from "@/lib/supabase/server";
import { generateAiJsonResponse } from "@/lib/api/ai-dispatcher";
import { resolveAiConfig } from "@/lib/api/ai-config";
import type { ChatbotMessageRow } from "@/types/chat";
import type { Json } from "@/lib/supabase/types";
import { renderToolCatalog, runTool, type ToolResult } from "./tools";

/**
 * Load the chatbot system prompt from the DB (`prompt_group { name='Chat' }`
 * + `prompt { name='Chatbot prompt' }` seeded by 20260428000000_chat_fixes).
 * Falls back to the hardcoded SYSTEM_PROMPT_HEADER below if the row is
 * absent — defense in depth so a broken seed never bricks the chatbot.
 *
 * Per Part 2 item 40, prompt.description must NEVER be exposed in the
 * frontend. RLS on `prompt` is admin/manager-only (so a non-admin's
 * RLS-clamped supabase client returns null here). We use the service-role
 * client instead so every signed-in user gets the SAME up-to-date system
 * prompt, but the raw text never crosses the client boundary — only the
 * model's reply does.
 */
async function loadDbSystemPrompt(): Promise<string | null> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const sb = createServiceClient();
  const { data: group } = await sb
    .from("prompt_group")
    .select("id")
    .eq("name", "Chat")
    .maybeSingle();
  if (!group) return null;
  const { data: prompt } = await sb
    .from("prompt")
    .select("description")
    .eq("group", (group as { id: number }).id)
    .eq("name", "Chatbot prompt")
    .maybeSingle();
  const text = (prompt as { description: string | null } | null)?.description ?? null;
  return text && text.trim().length > 0 ? text : null;
}

/**
 * Cast our trace array to the Supabase-generated `Json` type. The trace
 * holds `args: unknown` (per-tool argument shape varies) which TS can't
 * structurally prove satisfies `Json`. JSON-roundtripping would work too
 * but burns cycles; the trace is built from data we already serialized
 * to/from the model so it's guaranteed safe.
 */
function asJson(v: unknown): Json {
  return v as Json;
}

const SYSTEM_PROMPT_HEADER = `You are the Move37 assistant, an internal helper for staff and clients
of a business-builder that uses AI, capital and fast customer testing to turn sharp ideas into real companies. You answer questions about
projects, tasks, internal initiatives, and people.

You can call tools to look things up. The available tools are:

`;

const SYSTEM_PROMPT_FOOTER = `

OUTPUT FORMAT — read carefully:
- If you need data, reply with ONLY a single JSON object:
    { "tool": "<tool name>", "args": { ... } }
  Do not wrap it in markdown. Do not add any prose.
- Otherwise (the final answer for the user), reply with ONLY a JSON object:
    { "reply": "<your message in plain text or markdown>" }
- Never mix the two shapes in one reply.
- Never invent data. If a tool errors, explain to the user briefly.
- Keep replies concise (under 200 words unless the user asks for detail).`;

const MAX_TOOL_HOPS = 6;

/**
 * Always-appended guidance for the work-feedback summary flow. Kept in code (not
 * only the DB prompt) so it applies regardless of whether the DB "Chatbot prompt"
 * row is present. Tells the model to use the dedicated tool and how to format the
 * reply to match the Work Feedback layout used across the app.
 */
const WORK_FEEDBACK_GUIDANCE = `
WORK FEEDBACK SUMMARIES:
- When the user asks to summarize/review/report THEIR work feedback for a date range
  (e.g. "Summarize my work feedback from 22 jun 2026 to 26 jun 2026"), call the
  summarize_work_feedback tool with start_date and end_date as ISO yyyy-mm-dd.
  Parse natural-language dates yourself (e.g. "22 jun 2026" → "2026-06-22").
- Format the reply as markdown using EXACTLY this structure, and put a blank line
  between every block so they render as separate paragraphs/lists:

    ## Work Feedback — <DD-MM-YYYY> → <DD-MM-YYYY>

    ### Project: <project name>

    **% time worked:** <pct_of_period>%

    **What we have now:**
    - bullet list from current_state

    **What I worked on this period:**
    - bullet list from current_work

    **What I will work on next:**
    - bullet list from next_work

    **What I need from you next & Blockers:**
    - content from blockers

    **Video & Links:**
    - content from video_and_links (keep links as markdown links)

    ---

- Rules: each project name MUST be its own \`###\` heading (bigger, bold). Each of
  the five block labels MUST be bold and on its own line, followed by a blank line
  then its bullet list. Put a \`---\` divider line between projects (not after the
  last one). The content fields arrive as HTML; convert them to clean markdown,
  preserving bullet lists and links. If a project has multiple entries, merge them
  sensibly. Omit a block entirely if it is empty. If the tool returns no projects,
  say there is no work feedback in that range.`;

// `resolveAiConfig` lives in `@/lib/api/ai-config` (shared with the
// sandbox-planner generator + the project task importer).

function buildSystemPrompt(userTypeLabel: string, dbHeader: string | null): string {
  // The DB-loaded prompt (if present) replaces the hardcoded header text.
  // We always append the rendered tool catalog and the JSON output-format
  // footer so the model knows the calling convention.
  const header = dbHeader ?? SYSTEM_PROMPT_HEADER;
  return (
    header +
    "\n\nAvailable tools:\n\n" +
    renderToolCatalog() +
    `\n\nThe user asking you is a "${userTypeLabel}". Tailor your tone accordingly.\n` +
    WORK_FEEDBACK_GUIDANCE +
    SYSTEM_PROMPT_FOOTER
  );
}

function renderHistory(messages: ChatbotMessageRow[]): string {
  return messages
    .map((m) => {
      const who = m.author_type === "user" ? "USER" : "ASSISTANT";
      return `${who}: ${m.message}`;
    })
    .join("\n\n");
}

interface ToolEnvelope { tool: string; args?: Record<string, unknown> }
interface ReplyEnvelope { reply: string }

function parseEnvelope(raw: string): ToolEnvelope | ReplyEnvelope | { error: string } {
  // The dispatcher's three providers all return objects (claimed to be JSON),
  // but they may wrap the JSON in code fences or extra text.  Strip both.
  let s = raw.trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  // Find the first {...} balanced block.
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) return { error: "no JSON in reply" };
  try {
    const obj = JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
    if (typeof obj.reply === "string") return { reply: obj.reply };
    if (typeof obj.tool === "string") {
      return { tool: obj.tool, args: (obj.args as Record<string, unknown>) ?? {} };
    }
    return { error: "unexpected JSON shape" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "parse failed" };
  }
}

interface RunResult { botMsg?: ChatbotMessageRow; error?: string }

export async function runChatbotTurn(chatbotId: string): Promise<RunResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("type")
    .eq("id", user.id)
    .single();
  const userTypeLabel = (profile as { type?: string | null } | null)?.type ?? "user";

  const ai = await resolveAiConfig(supabase, user.id);
  if (!ai) {
    const fallback = "Sorry — no AI provider is configured. Set one in Settings → AI Configuration to enable the chatbot.";
    const { data: row } = await supabase
      .from("private_chatbot_message")
      .insert({ chatbot_id: chatbotId, author_type: "chatbot", message: fallback, created_by: user.id })
      .select("id, chatbot_id, author_type, message, tool_calls, created_at, created_by, updated_at")
      .single();
    return {
      botMsg: row
        ? ({ ...(row as Partial<ChatbotMessageRow>), created_by: (row as ChatbotMessageRow).created_by ?? user.id } as ChatbotMessageRow)
        : undefined,
      error: "AI provider not configured",
    };
  }

  // Load history (most recent 50 turns is plenty).
  const { data: histData } = await supabase
    .from("private_chatbot_message")
    .select("id, chatbot_id, author_type, message, tool_calls, created_at, created_by, updated_at")
    .eq("chatbot_id", chatbotId)
    .order("created_at", { ascending: true })
    .limit(50);
  const history = ((histData ?? []) as Array<Partial<ChatbotMessageRow>>).map((m) => ({
    ...(m as ChatbotMessageRow),
    created_by: m.created_by ?? user.id,
  })) as ChatbotMessageRow[];

  const dbHeader = await loadDbSystemPrompt();
  const system = buildSystemPrompt(userTypeLabel, dbHeader);
  let prompt = `${system}\n\nConversation so far:\n\n${renderHistory(history)}\n\nReply now.`;

  const trace: Array<{ tool: string; args: unknown; result: ToolResult }> = [];

  for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
    const res = await generateAiJsonResponse<unknown>({
      service: ai.service,
      apiKey: ai.apiKey,
      model: ai.model,
      prompt,
    });
    if (res.returned_an_error || res.data == null) {
      const msg = `I hit an error talking to the AI: ${res.error ?? "unknown"}`;
      const { data: row } = await supabase
        .from("private_chatbot_message")
        .insert({ chatbot_id: chatbotId, author_type: "chatbot", message: msg, tool_calls: asJson(trace), created_by: user.id })
        .select("id, chatbot_id, author_type, message, tool_calls, created_at, created_by, updated_at")
        .single();
      return {
        botMsg: row
          ? ({ ...(row as Partial<ChatbotMessageRow>), created_by: (row as ChatbotMessageRow).created_by ?? user.id } as ChatbotMessageRow)
          : undefined,
        error: res.error ?? "AI error",
      };
    }
    // The dispatcher returned a parsed object — re-stringify so we can run
    // the same envelope parser (it strips code fences too in case the model
    // wrapped it, though that's unlikely with JSON-mode providers).
    const raw = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    const env = parseEnvelope(raw);
    if ("error" in env) {
      // Treat unparseable replies as the final reply (defensive — wrap raw).
      const msg = typeof res.data === "string" ? res.data : raw;
      const { data: row } = await supabase
        .from("private_chatbot_message")
        .insert({ chatbot_id: chatbotId, author_type: "chatbot", message: msg, tool_calls: asJson(trace), created_by: user.id })
        .select("id, chatbot_id, author_type, message, tool_calls, created_at, created_by, updated_at")
        .single();
      return {
        botMsg: row
          ? ({ ...(row as Partial<ChatbotMessageRow>), created_by: (row as ChatbotMessageRow).created_by ?? user.id } as ChatbotMessageRow)
          : undefined,
      };
    }
    if ("reply" in env) {
      const { data: row } = await supabase
        .from("private_chatbot_message")
        .insert({
          chatbot_id: chatbotId,
          author_type: "chatbot",
          message: env.reply,
          tool_calls: trace.length > 0 ? asJson(trace) : null,
          // Track which user's session this assistant message belongs to.
          created_by: user.id,
        })
        .select("id, chatbot_id, author_type, message, tool_calls, created_at, created_by, updated_at")
        .single();
      return {
        botMsg: row
          ? ({ ...(row as Partial<ChatbotMessageRow>), created_by: (row as ChatbotMessageRow).created_by ?? user.id } as ChatbotMessageRow)
          : undefined,
      };
    }
    // Tool call. userTypeLabel is forwarded so query_db / count_db can
    // pick a service-role client for admin/manager (RLS-bypass) and a
    // user-clamped client for everyone else.
    const result = await runTool(supabase, env.tool, env.args ?? {}, userTypeLabel);
    trace.push({ tool: env.tool, args: env.args ?? {}, result });
    prompt += `\n\nASSISTANT (tool call): ${JSON.stringify({ tool: env.tool, args: env.args ?? {} })}\nTOOL RESULT: ${JSON.stringify(result)}\n\nNow reply with the final answer (or another tool call if you still need data).`;
  }

  // Hit the hop ceiling — give up gracefully.
  const giveUp = "I tried looking that up but ran out of steps. Could you rephrase or narrow it down?";
  const { data: row } = await supabase
    .from("private_chatbot_message")
    .insert({ chatbot_id: chatbotId, author_type: "chatbot", message: giveUp, tool_calls: asJson(trace) })
    .select("id, chatbot_id, author_type, message, tool_calls, created_at, created_by, updated_at")
    .single();
  return {
    botMsg: row
      ? ({ ...(row as Partial<ChatbotMessageRow>), created_by: (row as ChatbotMessageRow).created_by ?? user.id } as ChatbotMessageRow)
      : undefined,
  };
}
