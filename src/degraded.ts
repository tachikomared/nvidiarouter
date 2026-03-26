export function isDegradedResponse(content: string | null | undefined, isStructured: boolean = false): boolean {
  if (content == null) return true;
  const trimmed = content.trim();
  if (trimmed === '') return true;

  if (isStructured) {
    try {
      JSON.parse(trimmed);
      return false;
    } catch {
      return true;
    }
  }

  // Check for repeated token loops (naive check: same 5 chars repeated many times)
  if (trimmed.length > 50) {
    const chunk = trimmed.substring(0, 10);
    const count = (trimmed.match(new RegExp(chunk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (count > trimmed.length / 20) {
      return true;
    }
  }

  return false;
}
