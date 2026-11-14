import { describe, it, expect } from 'vitest';
import { formatTimeDisplay, formatTimeSpoken } from '../../packages/core/src/utils/formatTime';

describe('formatTime Utilities', () => {
  describe('formatTimeDisplay', () => {
    it('formats seconds to MM:SS', () => {
      expect(formatTimeDisplay(0)).toBe('00:00');
      expect(formatTimeDisplay(45)).toBe('00:45');
      expect(formatTimeDisplay(75)).toBe('01:15');
      expect(formatTimeDisplay(599)).toBe('09:59');
    });

    it('formats seconds to HH:MM:SS when duration exceeds 1 hour', () => {
      expect(formatTimeDisplay(3600)).toBe('01:00:00');
      expect(formatTimeDisplay(3665)).toBe('01:01:05');
      expect(formatTimeDisplay(7322)).toBe('02:02:02');
    });

    it('handles negative or invalid inputs gracefully', () => {
      expect(formatTimeDisplay(-10)).toBe('00:00');
      expect(formatTimeDisplay(NaN)).toBe('00:00');
    });
  });

  describe('formatTimeSpoken', () => {
    it('formats time to screen-reader accessible speech', () => {
      expect(formatTimeSpoken(0)).toBe('0 seconds');
      expect(formatTimeSpoken(1)).toBe('1 second');
      expect(formatTimeSpoken(45)).toBe('45 seconds');
      expect(formatTimeSpoken(60)).toBe('1 minute');
      expect(formatTimeSpoken(90)).toBe('1 minute 30 seconds');
      expect(formatTimeSpoken(3600)).toBe('1 hour');
      expect(formatTimeSpoken(3661)).toBe('1 hour 1 minute 1 second');
    });

    it('handles negative or invalid inputs gracefully', () => {
      expect(formatTimeSpoken(-5)).toBe('0 seconds');
      expect(formatTimeSpoken(NaN)).toBe('0 seconds');
    });
  });
});
