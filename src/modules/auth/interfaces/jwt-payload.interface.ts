import type { UserRole } from '../../entity-registry';

export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  type: TokenType;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}
