import { BadRequestException } from '@nestjs/common';
import { decodeCursor, encodeCursor } from '../cursor';

describe('cursor', () => {
  it('ida y vuelta', () => {
    const c = { createdAt: '2026-09-28T21:40:00.000Z', id: '0b7c0f6e-2f0e-4b8e-9d7c-1f5a8b2c3d4e' };
    expect(decodeCursor(encodeCursor(c))).toEqual(c);
  });

  it.each(['basura', Buffer.from('["no-fecha","x"]').toString('base64url'), Buffer.from('{}').toString('base64url')])(
    'rechaza %p',
    (raw) => {
      expect(() => decodeCursor(raw)).toThrow(BadRequestException);
    },
  );
});
