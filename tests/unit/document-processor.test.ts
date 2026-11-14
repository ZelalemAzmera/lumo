import { describe, it, expect } from 'vitest';
import { TagChecker } from '../../packages/document-processor/src/TagChecker';
import { HTMLSanitizer } from '../../packages/document-processor/src/HTMLSanitizer';

describe('Document Processor', () => {
  describe('TagChecker', () => {
    it('passes fully accessible HTML document', () => {
      const validHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Accessible Lesson Material</title>
        </head>
        <body>
          <h1>Introduction</h1>
          <p>Welcome to the lesson.</p>
          <h2>Core Concepts</h2>
          <img src="chart.png" alt="Bar chart showing graduation rates across regions" />
          <table>
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Score</th></tr>
            </thead>
            <tbody>
              <tr><td>Abebe</td><td>95</td></tr>
            </tbody>
          </table>
        </body>
        </html>
      `;

      const result = TagChecker.audit(validHtml);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.metrics.headingsFound).toBe(2);
      expect(result.metrics.tablesFound).toBe(1);
      expect(result.metrics.imagesFound).toBe(1);
    });

    it('detects missing lang, missing title, skipped heading levels, missing alt, and table without th', () => {
      const badHtml = `
        <html>
        <head></head>
        <body>
          <h1>Introduction</h1>
          <h4>Skipped Level 4</h4>
          <img src="test.jpg" />
          <table>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
          </table>
        </body>
        </html>
      `;

      const result = TagChecker.audit(badHtml);
      expect(result.isValid).toBe(false);
      expect(result.issues.map(i => i.type)).toContain('MISSING_LANG');
      expect(result.issues.map(i => i.type)).toContain('MISSING_TITLE');
      expect(result.issues.map(i => i.type)).toContain('HEADING_SKIPPED');
      expect(result.issues.map(i => i.type)).toContain('IMAGE_MISSING_ALT');
      expect(result.issues.map(i => i.type)).toContain('TABLE_MISSING_HEADERS');
    });
  });

  describe('HTMLSanitizer', () => {
    it('strips script tags, event handlers, and javascript: links', () => {
      const dirtyHtml = `
        <div>
          <script>alert("hack");</script>
          <button onclick="badCode()">Click</button>
          <a href="javascript:doEvil()">Malicious link</a>
          <p>Clean text</p>
        </div>
      `;

      const clean = HTMLSanitizer.sanitize(dirtyHtml);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('javascript:');
      expect(clean).toContain('<p>Clean text</p>');
    });
  });
});
