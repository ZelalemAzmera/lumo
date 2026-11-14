export class HTMLSanitizer {
  /**
   * Strip unsafe tags, event handlers, and javascript: links from HTML content
   */
  public static sanitize(html: string): string {
    if (!html) return '';

    return html
      // Remove <script> tags and contents
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove <iframe>, <object>, <embed> tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
      // Remove inline event handlers like onclick, onload, onerror
      .replace(/\s+on[a-z]+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
      // Remove javascript: pseudo-protocol in href or src
      .replace(/\b(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
  }
}
