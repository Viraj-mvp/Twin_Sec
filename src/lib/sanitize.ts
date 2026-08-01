import DOMPurify from "dompurify";

export function sanitizeMarkdown(raw: string): string {
  if (typeof window === "undefined") {
    // Return raw during SSR (server functions sanitize via scrubContent)
    return raw;
  }

  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "code",
      "pre",
      "blockquote",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "a",
      "hr",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["href", "title", "rel", "class", "target"],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
  });
}
