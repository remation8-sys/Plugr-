import { describe, expect, it } from 'vitest';

import { urlBase64ToUint8Array } from '../../../src/features/web-push/web-push-client';

describe('urlBase64ToUint8Array', () => {
  it('decodes URL-safe base64 application server keys', () => {
    expect(Array.from(urlBase64ToUint8Array('SGVsbG8'))).toEqual([
      72, 101, 108, 108, 111,
    ]);
  });

  it('supports URL-safe dash and underscore characters', () => {
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([251, 255]);
  });
});
