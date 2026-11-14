export interface A11yIssue {
  type: 'HEADING_SKIPPED' | 'IMAGE_MISSING_ALT' | 'TABLE_MISSING_HEADERS' | 'MISSING_LANG' | 'MISSING_TITLE';
  message: string;
  context?: string;
}

export interface DocumentAuditResult {
  isValid: boolean;
  issues: A11yIssue[];
  metrics: {
    headingsFound: number;
    tablesFound: number;
    imagesFound: number;
    hasLang: boolean;
    hasTitle: boolean;
  };
}

export class TagChecker {
  /**
   * Audit an HTML document string for accessibility conformance
   */
  public static audit(html: string): DocumentAuditResult {
    const issues: A11yIssue[] = [];

    // 1. Language check
    const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    const hasLang = Boolean(langMatch && langMatch[1].trim() !== '');
    if (!hasLang) {
      issues.push({
        type: 'MISSING_LANG',
        message: 'The <html> tag is missing a valid lang attribute (e.g. lang="en" or lang="am").'
      });
    }

    // 2. Title check
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const hasTitle = Boolean(titleMatch && titleMatch[1].trim() !== '');
    if (!hasTitle) {
      issues.push({
        type: 'MISSING_TITLE',
        message: 'The document is missing a non-empty <title> tag in <head>.'
      });
    }

    // 3. Heading hierarchy check
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
    let headingMatch: RegExpExecArray | null;
    let lastLevel = 0;
    let headingsFound = 0;

    while ((headingMatch = headingRegex.exec(html)) !== null) {
      headingsFound++;
      const currentLevel = parseInt(headingMatch[1], 10);
      const headingText = headingMatch[2].replace(/<[^>]+>/g, '').trim();

      if (lastLevel > 0 && currentLevel > lastLevel + 1) {
        issues.push({
          type: 'HEADING_SKIPPED',
          message: `Heading level skipped: jumped from <h${lastLevel}> to <h${currentLevel}> without an intermediate level.`,
          context: `<h${currentLevel}>${headingText}</h${currentLevel}>`
        });
      }
      lastLevel = currentLevel;
    }

    // 4. Image alt text check
    const imgRegex = /<img\b([^>]*)>/gi;
    let imgMatch: RegExpExecArray | null;
    let imagesFound = 0;

    while ((imgMatch = imgRegex.exec(html)) !== null) {
      imagesFound++;
      const attrs = imgMatch[1];
      const altMatch = attrs.match(/\balt=(["'])(.*?)\1/i);

      if (!altMatch) {
        issues.push({
          type: 'IMAGE_MISSING_ALT',
          message: 'Image element is missing an alt attribute.',
          context: imgMatch[0]
        });
      }
    }

    // 5. Table header check
    const tableRegex = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch: RegExpExecArray | null;
    let tablesFound = 0;

    while ((tableMatch = tableRegex.exec(html)) !== null) {
      tablesFound++;
      const tableContent = tableMatch[1];
      const hasTh = /<th\b/i.test(tableContent);

      if (!hasTh) {
        issues.push({
          type: 'TABLE_MISSING_HEADERS',
          message: 'Table element is missing <th> header cells.',
          context: tableMatch[0].substring(0, 80) + '...'
        });
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      metrics: {
        headingsFound,
        tablesFound,
        imagesFound,
        hasLang,
        hasTitle
      }
    };
  }
}
