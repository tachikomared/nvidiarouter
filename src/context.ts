import type { IncomingMessage } from "node:http";
import { createHash } from "node:crypto";
import type { ConversationState } from "./router/types.js";

const MAX_SESSIONS = 1000;
const sessionStore = new Map<string, ConversationState>();

function normalizePrompt(prompt: string): string {
  return prompt.trim().toLowerCase();
}

function normalizeContent(content: any): string {
  if (typeof content === "string") return content.trim().toLowerCase();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.input_text === "string") return part.input_text;
        return "";
      })
      .filter(Boolean)
      .join(" ")
      .trim()
      .toLowerCase();
  }
  return "";
}

function extractStableConversationId(body: any): string | null {
  const candidates = [
    body?.session_id,
    body?.sessionId,
    body?.conversation_id,
    body?.conversationId,
    body?.thread_id,
    body?.threadId,
    body?.metadata?.session_id,
    body?.metadata?.conversation_id,
    body?.metadata?.thread_id,
    body?.metadata?.sessionId,
    body?.metadata?.conversationId,
    body?.metadata?.threadId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

export function getSessionId(req: IncomingMessage, body: any): string {
  const headerSession = req.headers["x-session-id"];
  if (typeof headerSession === "string" && headerSession.trim()) {
    return headerSession.trim();
  }

  const explicitSession = extractStableConversationId(body);
  if (explicitSession) return explicitSession;

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const systemMessage = messages.find((m: any) => m?.role === "system")?.content;
  const firstUser = messages.find((m: any) => m?.role === "user")?.content;

  const hints = {
    model: String(body?.model ?? "auto"),
    system: normalizeContent(systemMessage).slice(0, 200),
    firstUser: normalizeContent(firstUser).slice(0, 200),
  };

  const seed = JSON.stringify(hints);
  return createHash("sha256").update(seed).digest("hex");
}

export function isFollowupPrompt(prompt: string, maxChars: number): boolean {
  const text = normalizePrompt(prompt);
  if (!text || text.length > maxChars) return false;

  const followups = new Set([
    "yes",
    "ok",
    "okay",
    "continue",
    "go ahead",
    "do it",
    "fix it",
    "try again",
    "sure",
    "yep",
    "да",
    "ага",
    "сделай",
    "продолжай",
  ]);

  if (followups.has(text)) return true;

  return /^(yes|ok|okay|sure|go ahead|continue|do it|try again)$/i.test(text);
}

export function getConversationState(sessionId: string): ConversationState | undefined {
  return sessionStore.get(sessionId);
}

export function setConversationState(sessionId: string, state: ConversationState): void {
  sessionStore.set(sessionId, state);

  if (sessionStore.size <= MAX_SESSIONS) return;

  const entries = Array.from(sessionStore.entries());
  entries.sort((a, b) => a[1].lastUpdatedAt - b[1].lastUpdatedAt);

  for (let i = 0; i < entries.length - MAX_SESSIONS; i++) {
    sessionStore.delete(entries[i][0]);
  }
}
