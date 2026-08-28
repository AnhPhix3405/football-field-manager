import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

@Injectable()
export class PasswordHasher {
  private readonly keyLength = 64;

  hash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, this.keyLength);
    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
  }

  verify(password: string, storedHash: string): boolean {
    const [algorithm, salt, encodedHash] = storedHash.split('$');
    if (algorithm !== 'scrypt' || !salt || !encodedHash) return false;

    const expected = Buffer.from(encodedHash, 'hex');
    const actual = scryptSync(password, salt, expected.length);
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }
}
