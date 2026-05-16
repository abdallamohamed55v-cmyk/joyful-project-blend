// Unified build agent — streams an AI SDK loop with file/web/github/sandbox tools.
// Used by both /build and /megsy-pr workspaces.

import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "npm:ai@4";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@0";
import { z } from "npm:zod@3";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const streamHeaders = {
  ...corsHeaders,
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

// ───────── Gateway provider ─────────
const gateway = createOpenAICompatible({
  name: "lovable",
  baseURL: "https://ai.gateway.lovable.dev/v1",
  headers: {
    "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY") ?? "",
    "X-Lovable-AIG-SDK": "vercel-ai-sdk",
  },
});

// ───────── Supabase clients ─────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// ───────── Tool implementations ─────────
const MAX_FILE_BYTES = 256 * 1024;

type Ctx = {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  projectId: string;
};

async function ownsProject(ctx: Ctx): Promise<string | null> {
  const { data, error } = await ctx.supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", ctx.projectId)
    .maybeSingle();
  if (error) return error.message;
  if (!data) return "project_not_found";
  if (data.user_id !== ctx.userId) return "forbidden";
  return null;
}

async function saveMessage(ctx: Ctx, role: "user" | "assistant", content: string) {
  const { error } = await ctx.supabase.from("ai_project_messages").insert({
    project_id: ctx.projectId,
    role,
    content,
  });
  if (error) console.error("message save failed:", error.message);
}

// ─── Files ───
async function fsList(ctx: Ctx, { prefix }: { prefix?: string }) {
  const err = await ownsProject(ctx);
  if (err) return { ok: false, error: err };
  let q = ctx.supabase
    .from("ai_project_files")
    .select("path, content, updated_at")
    .eq("project_id", ctx.projectId)
    .order("path")
    .limit(500);
  if (prefix) q = q.like("path", `${prefix}%`);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((r: any) => ({
      path: r.path,
      size: (r.content ?? "").length,
      updatedAt: r.updated_at,
    })),
  };
}

async function fsRead(ctx: Ctx, { path }: { path: string }) {
  const err = await ownsProject(ctx);
  if (err) return { ok: false, error: err };
  const { data, error } = await ctx.supabase
    .from("ai_project_files")
    .select("path, content")
    .eq("project_id", ctx.projectId)
    .eq("path", path)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "file_not_found" };
  return { ok: true, data: { path: data.path, content: data.content ?? "" } };
}

async function fsWrite(
  ctx: Ctx,
  { path, content }: { path: string; content: string },
) {
  if (content.length > MAX_FILE_BYTES)
    return { ok: false, error: `file_too_large (>${MAX_FILE_BYTES})` };
  const err = await ownsProject(ctx);
  if (err) return { ok: false, error: err };
  const before = await ctx.supabase
    .from("ai_project_files")
    .select("path")
    .eq("project_id", ctx.projectId)
    .eq("path", path)
    .maybeSingle();
  const { error } = await ctx.supabase.from("ai_project_files").upsert(
    {
      project_id: ctx.projectId,
      path,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id,path" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { path, bytes: content.length, action: before.data ? "update" : "create" } };
}

async function fsDelete(ctx: Ctx, { path }: { path: string }) {
  const err = await ownsProject(ctx);
  if (err) return { ok: false, error: err };
  const { error } = await ctx.supabase
    .from("ai_project_files")
    .delete()
    .eq("project_id", ctx.projectId)
    .eq("path", path);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { path } };
}

async function fsSearch(
  ctx: Ctx,
  { query, pathPrefix }: { query: string; pathPrefix?: string },
) {
  if (!query || query.length < 2) return { ok: false, error: "query_too_short" };
  const err = await ownsProject(ctx);
  if (err) return { ok: false, error: err };
  let q = ctx.supabase
    .from("ai_project_files")
    .select("path, content")
    .eq("project_id", ctx.projectId)
    .ilike("content", `%${query}%`)
    .limit(50);
  if (pathPrefix) q = q.like("path", `${pathPrefix}%`);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  const matches: { path: string; line: number; preview: string }[] = [];
  const needle = query.toLowerCase();
  for (const row of data ?? []) {
    const lines = ((row as any).content ?? "").split(/\r?\n/);
    for (let i = 0; i < lines.length && matches.length < 30; i++) {
      if (lines[i].toLowerCase().includes(needle)) {
        matches.push({
          path: (row as any).path,
          line: i + 1,
          preview: lines[i].slice(0, 200),
        });
      }
    }
  }
  return { ok: true, data: { matches } };
}

// ─── Firecrawl ───
async function firecrawl(path: string, body: unknown) {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return { ok: false, error: "FIRECRAWL_API_KEY not configured" };
  const res = await fetch(`https://api.firecrawl.dev/v2${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return res.ok
      ? { ok: true, data: JSON.parse(text) }
      : { ok: false, error: `firecrawl_${res.status}: ${text.slice(0, 200)}` };
  } catch {
    return { ok: false, error: text.slice(0, 200) };
  }
}

// ─── GitHub ───
async function gh(path: string, init: RequestInit = {}) {
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) return { ok: false, error: "GITHUB_TOKEN not configured" };
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers as any),
    },
  });
  const text = await res.text();
  try {
    return res.ok
      ? { ok: true, data: JSON.parse(text) }
      : { ok: false, error: `github_${res.status}: ${text.slice(0, 200)}` };
  } catch {
    return { ok: false, error: text.slice(0, 200) };
  }
}

// ─── Sandbox ───
function sandboxEvalMath({ expr }: { expr: string }) {
  if (!/^[\d+\-*/%().\s]+$/.test(expr))
    return { ok: false, error: "expression_not_allowed" };
  try {
    const v = Number(new Function(`"use strict";return (${expr});`)());
    return Number.isFinite(v)
      ? { ok: true, data: { value: v } }
      : { ok: false, error: "non_finite" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function sandboxRunJs({ code, input }: { code: string; input?: unknown }) {
  if (code.length > 4096) return { ok: false, error: "code_too_long" };
  if (/\b(fetch|XMLHttpRequest|require|import|process|globalThis|Deno|window|document)\b/.test(code))
    return { ok: false, error: "disallowed_identifier" };
  try {
    const fn = new Function("input", `"use strict";${code}`);
    return { ok: true, data: { result: fn(input) } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ───────── Build AI SDK tools ─────────
function buildTools(ctx: Ctx, emit?: (event: Record<string, unknown>) => void) {
  const wrap = <T extends Record<string, unknown>>(name: string, run: (args: T) => Promise<unknown> | unknown) =>
    async (args: T) => {
      const path = typeof args.path === "string" ? args.path : undefined;
      const query = typeof args.query === "string" ? args.query : undefined;
      emit?.({ type: "step", text: `tool:${name} ${path ?? query ?? ""}`.trim() });
      const result = await run(args);
      if (name.startsWith("fs_") && path) {
        emit?.({ type: "file", action: name === "fs_write" ? (result as any)?.data?.action ?? "update" : name.replace("fs_", ""), path });
      }
      return result;
    };
  return {
    fs_list: tool({
      description: "List files in the project (optionally by path prefix).",
      inputSchema: z.object({ prefix: z.string().optional() }),
      execute: wrap("fs_list", (args) => fsList(ctx, args)),
    }),
    fs_read: tool({
      description: "Read a file from the project.",
      inputSchema: z.object({ path: z.string() }),
      execute: wrap("fs_read", (args) => fsRead(ctx, args)),
    }),
    fs_write: tool({
      description: "Create or overwrite a file in the project.",
      inputSchema: z.object({ path: z.string(), content: z.string() }),
      execute: wrap("fs_write", (args) => fsWrite(ctx, args)),
    }),
    fs_delete: tool({
      description: "Delete a file from the project.",
      inputSchema: z.object({ path: z.string() }),
      execute: wrap("fs_delete", (args) => fsDelete(ctx, args)),
    }),
    fs_search: tool({
      description: "Grep-style search across project files.",
      inputSchema: z.object({
        query: z.string(),
        pathPrefix: z.string().optional(),
      }),
      execute: wrap("fs_search", (args) => fsSearch(ctx, args)),
    }),
    web_scrape: tool({
      description: "Fetch a URL (markdown/html) via Firecrawl.",
      inputSchema: z.object({
        url: z.string(),
        formats: z.array(z.string()).optional(),
      }),
      execute: wrap("web_scrape", (args) =>
        firecrawl("/scrape", {
          url: args.url,
          formats: args.formats ?? ["markdown"],
        })),
    }),
    web_search: tool({
      description: "Web search via Firecrawl.",
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().optional(),
      }),
      execute: wrap("web_search", (args) =>
        firecrawl("/search", { query: args.query, limit: args.limit ?? 10 })),
    }),
    web_map: tool({
      description: "Discover URLs on a website.",
      inputSchema: z.object({ url: z.string(), limit: z.number().optional() }),
      execute: wrap("web_map", (args) =>
        firecrawl("/map", { url: args.url, limit: args.limit ?? 200 })),
    }),
    gh_list_repos: tool({
      description: "List authenticated user's GitHub repos.",
      inputSchema: z.object({ per_page: z.number().optional() }),
      execute: wrap("gh_list_repos", (args) =>
        gh(`/user/repos?per_page=${args.per_page ?? 30}&sort=updated`)),
    }),
    gh_get_repo: tool({
      description: "Get a GitHub repo's metadata.",
      inputSchema: z.object({ owner: z.string(), repo: z.string() }),
      execute: wrap("gh_get_repo", (args) => gh(`/repos/${args.owner}/${args.repo}`)),
    }),
    gh_get_file: tool({
      description: "Fetch a file from a GitHub repo.",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string(),
        ref: z.string().optional(),
      }),
      execute: (args) =>
        gh(
          `/repos/${args.owner}/${args.repo}/contents/${encodeURIComponent(
            args.path,
          )}${args.ref ? `?ref=${encodeURIComponent(args.ref)}` : ""}`,
        ),
    }),
    gh_create_issue: tool({
      description: "Create a GitHub issue.",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        title: z.string(),
        body: z.string().optional(),
      }),
      execute: (args) =>
        gh(`/repos/${args.owner}/${args.repo}/issues`, {
          method: "POST",
          body: JSON.stringify({ title: args.title, body: args.body }),
        }),
    }),
    gh_search_code: tool({
      description: "Search code across GitHub.",
      inputSchema: z.object({ query: z.string() }),
      execute: (args) =>
        gh(`/search/code?q=${encodeURIComponent(args.query)}`),
    }),
    sandbox_eval_math: tool({
      description: "Evaluate a pure arithmetic expression.",
      inputSchema: z.object({ expr: z.string() }),
      execute: (args) => sandboxEvalMath(args),
    }),
    sandbox_run_js: tool({
      description: "Run a tiny pure JS snippet (no network/fs).",
      inputSchema: z.object({
        code: z.string(),
        input: z.unknown().optional(),
      }),
      execute: (args) => sandboxRunJs(args),
    }),
  };
}

const SYSTEM_PROMPT = `You are a unified programming agent for both the /build and /megsy-pr workspaces.

You have access to tools across four families:
- Files (fs_list, fs_read, fs_write, fs_delete, fs_search) — operate on the project's stored files in ai_project_files.
- Web (web_scrape, web_search, web_map) — research the web via Firecrawl.
- GitHub (gh_list_repos, gh_get_repo, gh_get_file, gh_create_issue, gh_search_code) — interact with GitHub repositories.
- Sandbox (sandbox_eval_math, sandbox_run_js) — safe computation only, no network or filesystem.

Best practices:
1. Before editing, read or search to understand existing code.
2. Make focused, minimal changes. Prefer fs_write with full file contents.
3. Verify your changes by reading back when uncertain.
4. Be concise in your replies; do the work with tools instead of describing it.`;

// ───────── HTTP handler ─────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer "))
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    // Authenticated supabase client (RLS-respecting) for project ownership check
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user)
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const body = await req.json();
    const projectId = (body.projectId ?? body.project_id) as string | undefined;
    const singleMessage = typeof body.message === "string" ? body.message.trim() : "";
    const messages = body.messages as UIMessage[] | undefined;
    if (!projectId || (!Array.isArray(messages) && !singleMessage))
      return new Response("projectId/project_id and messages/message are required", {
        status: 400,
        headers: corsHeaders,
      });

    // Service-role client for tool execution (we already verified ownership inside tools)
    const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const ctx: Ctx = {
      supabase: serviceClient,
      userId: userData.user.id,
      projectId,
    };

    const encoder = new TextEncoder();
    const emitSse = (controller: ReadableStreamDefaultController<Uint8Array>, event: Record<string, unknown>) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    };

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (event: Record<string, unknown>) => emitSse(controller, event);
        let assistantText = "";
        const heartbeat = setInterval(() => controller.enqueue(encoder.encode(": keep-alive\n\n")), 15000);
        try {
          emit({ type: "step", text: "think: سأفهم المطلوب ثم أعدل الملفات مباشرة" });
          if (singleMessage) await saveMessage(ctx, "user", singleMessage);

          const modelMessages = Array.isArray(messages)
            ? await convertToModelMessages(messages)
            : [{ role: "user", content: singleMessage } as any];

          const result = streamText({
            model: gateway("openai/gpt-5"),
            system: SYSTEM_PROMPT,
            messages: modelMessages,
            tools: buildTools(ctx, emit),
            stopWhen: stepCountIs(50),
          });

          for await (const delta of result.textStream) {
            assistantText += delta;
            emit({ type: "text", delta });
          }

          const finalText = assistantText.trim() || "تم الانتهاء من التعديلات.";
          await saveMessage(ctx, "assistant", finalText);
          emit({ type: "step", text: "done: انتهيت من التعديلات" });
          emit({ type: "done" });
        } catch (e) {
          console.error("build-agent stream error:", e);
          emit({ type: "error", message: (e as Error).message });
        } finally {
          clearInterval(heartbeat);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: streamHeaders });
  } catch (e) {
    console.error("build-agent error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
