export class HTMLSanitizer {
  /**
   * Strip unsafe tags, event handlers, and malicious pseudo-protocols from HTML content
   */
  public static sanitize(html: string): string {
    if (!html) return '';

    let sanitized = html;

    // 1. Remove dangerous script, iframe, object, embed, applet, base, and meta tags with content
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
      .replace(/<base\b[^>]*>/gi, '')
      .replace(/<meta\b[^>]*http-equiv[^>]*>/gi, '');

    // 2. Remove all inline event handlers (e.g. onclick, onerror, onload, onmouseover, onfocus, ontouchstart)
    sanitized = sanitized.replace(/\s+on[a-z0-9_-]+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '');

    // 3. Remove dangerous protocols in href, src, formaction, poster, data (javascript:, vbscript:, data:text/html)
    sanitized = sanitized
      .replace(/\b(href|src|formaction|poster|data)\s*=\s*(["'])\s*(javascript|vbscript|data\s*:\s*text\/html):[^"']*\2/gi, '$1="#"')
      .replace(/\b(href|src|formaction|poster|data)\s*=\s*(javascript|vbscript|data\s*:\s*text\/html):[^\s>]+/gi, '$1="#"');

    // 4. Strip dangerous CSS expressions and behavior in inline style
    sanitized = sanitized.replace(/style\s*=\s*(["'])[^"']*(?:expression|javascript|behavior|url\s*\()[^"']*\1/gi, '');

    return sanitized;
  }
}
