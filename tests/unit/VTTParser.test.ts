import { describe, it, expect } from 'vitest';
import { VTTParser } from '../../packages/core/src/captions/VTTParser';

describe('VTTParser', () => {
  it('throws an error if WEBVTT signature is missing', () => {
    expect(() => VTTParser.parse('INVALID HEADER\n00:00:01.000 --> 00:00:03.000\nHello')).toThrow(
      'Invalid WebVTT format'
    );
  });

  it('parses timestamps correctly into seconds', () => {
    expect(VTTParser.parseTimestamp('00:00:05.500')).toBe(5.5);
    expect(VTTParser.parseTimestamp('01:30.250')).toBe(90.25);
    expect(VTTParser.parseTimestamp('01:02:03.400')).toBe(3723.4);
    expect(VTTParser.parseTimestamp('invalid')).toBe(0);
  });

  it('parses valid WebVTT cues with language settings and Ethiopic Fidel', () => {
    const vtt = `WEBVTT - Test captions

00:00:01.000 --> 00:00:04.500
Hello and welcome to Lumo.

00:00:05.000 --> 00:00:08.500 lang:am
<lang am>ሰላም እንኳን ወደ ሉሞ በደህና መጡ።</lang>
`;

    const result = VTTParser.parse(vtt);
    expect(result.header).toBe('WEBVTT - Test captions');
    expect(result.cues).toHaveLength(2);

    expect(result.cues[0]).toEqual({
      id: undefined,
      startTime: 1.0,
      endTime: 4.5,
      text: 'Hello and welcome to Lumo.',
      lang: undefined
    });

    expect(result.cues[1]).toEqual({
      id: undefined,
      startTime: 5.0,
      endTime: 8.5,
      text: 'ሰላም እንኳን ወደ ሉሞ በደህና መጡ።',
      lang: 'am'
    });
  });

  it('skips NOTE blocks correctly', () => {
    const vtt = `WEBVTT

NOTE This is a commentary note
spanning multiple lines

1
00:00:01.000 --> 00:00:02.000
Valid Cue After Note
`;

    const result = VTTParser.parse(vtt);
    expect(result.cues).toHaveLength(1);
    expect(result.cues[0].id).toBe('1');
    expect(result.cues[0].text).toBe('Valid Cue After Note');
  });
});
