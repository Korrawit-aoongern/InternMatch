export function buildVideoSearchUrl(title?: string, targetSkill?: string): string {
  const parts: string[] = [];
  if (targetSkill && targetSkill.trim()) {
    parts.push(targetSkill.trim());
  }
  if (title && title.trim()) {
    if (!targetSkill || !title.toLowerCase().includes(targetSkill.toLowerCase())) {
      parts.push(title.trim());
    } else {
      parts.length = 0;
      parts.push(title.trim());
    }
  }
  const query = parts.join(" ").trim() || title || "tutorial";
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function ensureVideoSearchUrl(url?: string, title?: string, targetSkill?: string): string {
  if (url && url.includes("youtube.com/results?search_query=")) {
    return url;
  }
  return buildVideoSearchUrl(title, targetSkill);
}
