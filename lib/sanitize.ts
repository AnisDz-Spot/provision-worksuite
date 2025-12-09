// lib/sanitize.ts - HTML sanitization utility
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Untrusted HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(
  dirty: string,
  options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  }
): string {
  const config: any = {
    // Default allowed tags for rich text content
    ALLOWED_TAGS: options?.allowedTags || [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "a",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
      "span",
      "div",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    // Default allowed attributes
    ALLOWED_ATTR: options?.allowedAttributes || [
      "href",
      "target",
      "class",
      "id",
      "style",
    ],
    // Forbid dangerous tags
    FORBID_TAGS: ["script", "iframe", "object", "embed", "style"],
    // Forbid dangerous attributes
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    // Keep safe links only
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  };

  return String(DOMPurify.sanitize(dirty, config));
}

/**
 * Sanitize user mentions in comments
 * Preserves mention highlighting while preventing XSS
 */
export function sanitizeMentions(content: string): string {
  return String(
    sanitizeHtml(content, {
      allowedTags: ["p", "br", "strong", "em", "span"],
      allowedAttributes: ["class", "data-mention"],
    })
  );
}

/**
 * Sanitize for plain text display (strips all HTML)
 */
export function sanitizeToPlainText(dirty: string): string {
  return String(DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] }));
}
