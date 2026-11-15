import { describe, it, expect } from 'vitest';
import { ResourceScanner } from '../../packages/resource-discovery/src/ResourceScanner';

describe('ResourceScanner', () => {
  function createMockRoot(elements: {
    videos?: Array<{ src: string; tracks?: Array<{ src: string; srclang: string; kind: string }> }>;
    audios?: Array<{ src: string }>;
    links?: Array<{ href: string }>;
  }) {
    return {
      querySelectorAll(selector: string) {
        if (selector === 'video') {
          return (elements.videos || []).map(v => ({
            src: v.src,
            currentSrc: v.src,
            getAttribute: (attr: string) => (attr === 'src' ? v.src : null),
            querySelectorAll: (subSelector: string) => {
              if (subSelector === 'track') {
                return (v.tracks || []).map(t => ({
                  src: t.src,
                  srclang: t.srclang,
                  kind: t.kind,
                  default: false
                }));
              }
              return [];
            },
            closest: () => null
          }));
        }
        if (selector === 'audio') {
          return (elements.audios || []).map(a => ({
            src: a.src,
            currentSrc: a.src,
            getAttribute: (attr: string) => (attr === 'src' ? a.src : null),
            querySelectorAll: () => [],
            closest: () => null
          }));
        }
        if (selector === 'a[href]') {
          return (elements.links || []).map(l => ({
            href: l.href,
            getAttribute: (attr: string) => (attr === 'href' ? l.href : null)
          }));
        }
        return [];
      }
    };
  }

  it('detects unannotated video and identifies critical caption gap', () => {
    const mockRoot = createMockRoot({
      videos: [{ src: 'https://example.com/lecture.mp4' }]
    });

    const map = ResourceScanner.scan(mockRoot);

    expect(map.mediaElements).toHaveLength(1);
    expect(map.mediaElements[0].src).toBe('https://example.com/lecture.mp4');
    expect(map.mediaElements[0].status).toBe('detected');
    expect(map.gaps.some(g => g.code === 'GAP_NO_CAPTIONS')).toBe(true);
    expect(map.gaps.some(g => g.code === 'GAP_NO_SIGN_LANGUAGE')).toBe(true);
    expect(map.gaps.some(g => g.code === 'GAP_NO_AUDIO_DESCRIPTION')).toBe(true);
    expect(map.accessibilityScore).toBeLessThan(100);
  });

  it('respects explicit host configuration override', () => {
    const mockRoot = createMockRoot({
      videos: [{ src: '/media/lesson.mp4' }]
    });

    const map = ResourceScanner.scan(mockRoot, {
      mediaSrc: '/media/lesson.mp4',
      captionsEn: '/media/lesson.en.vtt',
      captionsAm: '/media/lesson.am.vtt',
      eslSrc: '/media/lesson.ethsl.mp4',
      audioDescriptionSrc: '/media/lesson.ad.mp3',
      transcriptSrc: '/media/lesson.txt'
    });

    const media = map.mediaElements[0];
    expect(media.status).toBe('configured');
    expect(media.captions).toHaveLength(2);
    expect(media.hasSignLanguage).toBe(true);
    expect(media.hasAudioDescription).toBe(true);
    expect(media.hasTranscript).toBe(true);

    // No gaps remaining
    expect(map.gaps).toHaveLength(0);
    expect(map.accessibilityScore).toBe(100);
  });

  it('identifies document links (.pdf, .docx, .epub)', () => {
    const mockRoot = createMockRoot({
      links: [
        { href: '/downloads/syllabus.pdf' },
        { href: '/downloads/accessible/notes-accessible.html' }
      ]
    });

    const map = ResourceScanner.scan(mockRoot);
    expect(map.documents).toHaveLength(1);
    expect(map.documents[0].format).toBe('pdf');
    expect(map.documents[0].isRemediated).toBe(false);
  });
});
