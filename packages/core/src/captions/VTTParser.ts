import { Cue, WebVTTData } from '../types/captions';

export class VTTParser {
  /**
   * Parse a WebVTT string into structured WebVTTData
   */
  public static parse(vttContent: string): WebVTTData {
    if (!vttContent || !vttContent.trim().startsWith('WEBVTT')) {
      throw new Error('Invalid WebVTT format: Missing WEBVTT signature header');
    }

    const lines = vttContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const header = lines[0].trim();
    const cues: Cue[] = [];

    let i = 1;
    // Skip header comments or style blocks if present
    while (i < lines.length && lines[i].trim() !== '') {
      i++;
    }

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) {
        i++;
        continue;
      }

      // Skip NOTE blocks
      if (line.startsWith('NOTE')) {
        while (i < lines.length && lines[i].trim() !== '') {
          i++;
        }
        continue;
      }

      // Check for cue identifier vs timestamp line
      let cueId: string | undefined;
      let timestampLine = line;

      if (!line.includes('-->')) {
        cueId = line;
        i++;
        if (i < lines.length) {
          timestampLine = lines[i].trim();
        } else {
          break;
        }
      }

      if (timestampLine.includes('-->')) {
        const arrowIdx = timestampLine.indexOf('-->');
        const startRaw = timestampLine.slice(0, arrowIdx).trim();
        const rest = timestampLine.slice(arrowIdx + 3).trim();
        const endRaw = rest.split(/\s+/)[0].trim();

        // Check for language setting in timestamp line e.g., lang:am
        let lang: string | undefined;
        const langMatch = timestampLine.match(/lang:([a-z]{2,3})/i);
        if (langMatch) {
          lang = langMatch[1].toLowerCase();
        }

        const startTime = this.parseTimestamp(startRaw);
        const endTime = this.parseTimestamp(endRaw);

        i++;
        const textLines: string[] = [];
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i]);
          i++;
        }

        let cueText = textLines.join('\n');
        
        // Extract <lang xx> tag if present in body
        const bodyLangMatch = cueText.match(/<lang\s+([a-z]{2,3})>(.*?)<\/lang>/is);
        if (bodyLangMatch) {
          lang = bodyLangMatch[1].toLowerCase();
          cueText = bodyLangMatch[2].trim();
        }

        cues.push({
          id: cueId,
          startTime,
          endTime,
          text: cueText,
          lang
        });
      } else {
        i++;
      }
    }

    return { header, cues };
  }

  /**
   * Parse timestamp string to seconds
   * Supports MM:SS.mmm and HH:MM:SS.mmm
   */
  public static parseTimestamp(timestamp: string): number {
    const cleaned = timestamp.trim();
    const parts = cleaned.split(':');
    let hours = 0;
    let minutes = 0;
    let secondsWithMillis = 0;

    if (parts.length === 3) {
      hours = parseFloat(parts[0]);
      minutes = parseFloat(parts[1]);
      secondsWithMillis = parseFloat(parts[2]);
    } else if (parts.length === 2) {
      minutes = parseFloat(parts[0]);
      secondsWithMillis = parseFloat(parts[1]);
    } else {
      return 0;
    }

    if (isNaN(hours) || isNaN(minutes) || isNaN(secondsWithMillis)) {
      return 0;
    }

    return hours * 3600 + minutes * 60 + secondsWithMillis;
  }
}
