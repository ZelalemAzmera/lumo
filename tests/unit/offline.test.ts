import { describe, it, expect } from 'vitest';
import { PackageDownloader } from '../../packages/offline/src/PackageDownloader';

describe('Offline PackageDownloader', () => {
  it('verifies SHA-256 checksum correctly', async () => {
    const text = 'Hello, Lumo offline accessibility!';
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Compute expected hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = await PackageDownloader.verifyChecksum(data.buffer, hashHex);
    expect(isValid).toBe(true);

    const isInvalid = await PackageDownloader.verifyChecksum(data.buffer, '0000000000000000000000000000000000000000000000000000000000000000');
    expect(isInvalid).toBe(false);
  });
});
