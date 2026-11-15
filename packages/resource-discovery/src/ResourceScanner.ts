import {
  LearningResourceMap,
  DiscoveredMedia,
  DiscoveredCaption,
  AccessibilityGap,
  HostConfigOverride,
  ResourceStatus
} from './types';

export interface ScannableNode {
  querySelectorAll(selectors: string): any[];
}

export class ResourceScanner {
  /**
   * Scan root document or container element for accessible learning resources
   */
  public static scan(
    root?: any,
    override?: HostConfigOverride
  ): LearningResourceMap {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost';
    const mediaList: DiscoveredMedia[] = [];
    const gaps: AccessibilityGap[] = [];

    const effectiveRoot = root || (typeof document !== 'undefined' ? document : null);

    // 1. Inspect <video> and <audio> elements safely
    const videoElements: any[] = effectiveRoot ? Array.from(effectiveRoot.querySelectorAll('video')) : [];
    const audioElements: any[] = effectiveRoot ? Array.from(effectiveRoot.querySelectorAll('audio')) : [];

    for (const vid of videoElements) {
      // Ignore videos inside Lumo's own Shadow DOM or container
      if (vid.closest && vid.closest('db-player, lumo-player, .lumo-container')) {
        continue;
      }
      mediaList.push(this.inspectMediaElement(vid, 'video'));
    }

    for (const aud of audioElements) {
      if (aud.closest && aud.closest('db-player, lumo-player, .lumo-container')) {
        continue;
      }
      mediaList.push(this.inspectMediaElement(aud, 'audio'));
    }

    // 2. Apply Host Config Override if provided (explicit overrides automatic discovery)
    if (override && override.mediaSrc) {
      let targetMedia = mediaList.find(m => m.src === override.mediaSrc);
      if (!targetMedia) {
        targetMedia = {
          element: 'video',
          src: override.mediaSrc,
          captions: [],
          hasAudioDescription: false,
          hasSignLanguage: false,
          hasTranscript: false,
          status: 'configured'
        };
        mediaList.unshift(targetMedia);
      } else {
        targetMedia.status = 'configured';
      }

      if (override.captionsEn) {
        targetMedia.captions = targetMedia.captions.filter(c => c.lang !== 'en');
        targetMedia.captions.push({
          src: override.captionsEn,
          lang: 'en',
          label: 'English',
          status: 'configured'
        });
      }

      if (override.captionsAm) {
        targetMedia.captions = targetMedia.captions.filter(c => c.lang !== 'am');
        targetMedia.captions.push({
          src: override.captionsAm,
          lang: 'am',
          label: 'አማርኛ (Amharic)',
          status: 'configured'
        });
      }

      if (override.eslSrc) {
        targetMedia.hasSignLanguage = true;
        targetMedia.signLanguageSrc = override.eslSrc;
      }

      if (override.audioDescriptionSrc) {
        targetMedia.hasAudioDescription = true;
        targetMedia.audioDescriptionSrc = override.audioDescriptionSrc;
      }

      if (override.transcriptSrc) {
        targetMedia.hasTranscript = true;
        targetMedia.transcriptSrc = override.transcriptSrc;
      }
    }

    // 3. Scan for downloadable learning documents (.pdf, .docx, .epub)
    const documentLinks: any[] = effectiveRoot ? Array.from(effectiveRoot.querySelectorAll('a[href]')) : [];
    const discoveredDocuments = documentLinks
      .map(a => a.href || a.getAttribute?.('href') || '')
      .filter((href: string) => href.endsWith('.pdf') || href.endsWith('.docx') || href.endsWith('.epub'))
      .map((url: string) => ({
        url,
        format: url.split('.').pop() || 'unknown',
        isRemediated: url.includes('/accessible/') || url.includes('-accessible.html')
      }));

    // 4. Analyze Accessibility Gaps across discovered media
    for (const media of mediaList) {
      const hasEnCaptions = media.captions.some(c => c.lang === 'en');
      const hasAmCaptions = media.captions.some(c => c.lang === 'am');

      if (media.captions.length === 0) {
        gaps.push({
          code: 'GAP_NO_CAPTIONS',
          severity: 'critical',
          resourceType: 'captions',
          message: `Media "${media.src}" has no synchronized captions.`,
          remediationRecommendation: 'Provide WebVTT caption tracks for deaf and hard-of-hearing learners.'
        });
      } else if (!hasAmCaptions) {
        gaps.push({
          code: 'GAP_MISSING_AMHARIC_CAPTIONS',
          severity: 'moderate',
          resourceType: 'captions',
          message: `Media "${media.src}" lacks Amharic Fidel localization.`,
          remediationRecommendation: 'Add an Amharic WebVTT caption track (lesson.am.vtt).'
        });
      }

      if (!media.hasSignLanguage) {
        gaps.push({
          code: 'GAP_NO_SIGN_LANGUAGE',
          severity: 'moderate',
          resourceType: 'sign_language',
          message: `Media "${media.src}" does not have an Ethiopian Sign Language interpreter video.`,
          remediationRecommendation: 'Provide a synchronized EthSL overlay recording (sign="lesson.ethsl.mp4").'
        });
      }

      if (!media.hasAudioDescription) {
        gaps.push({
          code: 'GAP_NO_AUDIO_DESCRIPTION',
          severity: 'moderate',
          resourceType: 'audio_description',
          message: `Media "${media.src}" does not provide Audio Description for visual elements.`,
          remediationRecommendation: 'Provide a secondary audio description track (describe="lesson.ad.mp3").'
        });
      }

      if (!media.hasTranscript) {
        gaps.push({
          code: 'GAP_NO_TRANSCRIPT',
          severity: 'enhancement',
          resourceType: 'transcript',
          message: `Media "${media.src}" does not provide a downloadable text transcript.`,
          remediationRecommendation: 'Generate an interactive text transcript with cue seeking.'
        });
      }
    }

    // 5. Calculate Accessibility Health Score (0 - 100)
    let totalScore = 100;
    for (const gap of gaps) {
      if (gap.severity === 'critical') totalScore -= 25;
      else if (gap.severity === 'moderate') totalScore -= 10;
      else if (gap.severity === 'enhancement') totalScore -= 5;
    }
    const accessibilityScore = Math.max(0, Math.min(100, totalScore));

    return {
      scannedAt: new Date().toISOString(),
      hostOrigin: origin,
      mediaElements: mediaList,
      documents: discoveredDocuments,
      gaps,
      accessibilityScore
    };
  }

  private static inspectMediaElement(
    el: HTMLMediaElement,
    type: 'video' | 'audio'
  ): DiscoveredMedia {
    const src = el.currentSrc || el.src || el.querySelector('source')?.getAttribute('src') || '';
    const title = el.getAttribute('title') || el.getAttribute('aria-label') || undefined;
    const poster = type === 'video' ? (el as HTMLVideoElement).poster : undefined;

    const captions: DiscoveredCaption[] = [];
    const tracks = Array.from(el.querySelectorAll<HTMLTrackElement>('track'));

    for (const track of tracks) {
      const trackKind = track.kind || 'subtitles';
      if (trackKind === 'subtitles' || trackKind === 'captions') {
        captions.push({
          src: track.src,
          lang: track.srclang || 'en',
          label: track.label || undefined,
          isDefault: track.default,
          status: 'detected'
        });
      }
    }

    return {
      element: type,
      id: el.id || undefined,
      src,
      title,
      poster,
      captions,
      hasAudioDescription: false,
      hasSignLanguage: false,
      hasTranscript: false,
      status: 'detected'
    };
  }
}
