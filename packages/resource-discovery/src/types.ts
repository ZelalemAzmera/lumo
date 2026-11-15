export type ResourceStatus = 'detected' | 'configured' | 'generated' | 'missing';

export interface DiscoveredCaption {
  src: string;
  lang: string;
  label?: string;
  isDefault?: boolean;
  status: ResourceStatus;
}

export interface DiscoveredMedia {
  element: 'video' | 'audio' | 'custom';
  id?: string;
  src: string;
  title?: string;
  poster?: string;
  captions: DiscoveredCaption[];
  hasAudioDescription: boolean;
  audioDescriptionSrc?: string;
  hasSignLanguage: boolean;
  signLanguageSrc?: string;
  hasTranscript: boolean;
  transcriptSrc?: string;
  status: ResourceStatus;
}

export interface HostConfigOverride {
  targetSelector?: string;
  mediaSrc?: string;
  captionsEn?: string;
  captionsAm?: string;
  eslSrc?: string;
  audioDescriptionSrc?: string;
  transcriptSrc?: string;
  languagePreference?: 'en' | 'am';
}

export interface AccessibilityGap {
  code: string;
  severity: 'critical' | 'moderate' | 'enhancement';
  resourceType: 'captions' | 'sign_language' | 'audio_description' | 'transcript' | 'document';
  message: string;
  remediationRecommendation: string;
}

export interface LearningResourceMap {
  scannedAt: string;
  hostOrigin: string;
  mediaElements: DiscoveredMedia[];
  documents: {
    url: string;
    format: string;
    isRemediated: boolean;
  }[];
  gaps: AccessibilityGap[];
  accessibilityScore: number; // 0 - 100
}
