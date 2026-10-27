import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

export interface AccessTokenPayload {
  sub: string;
  role: string;
}

export async function signAccessToken(
  userId: number,
  role: string,
  secret: string,
  ttlSeconds: number,
): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(encoder.encode(secret));
}

export async function verifyAccessToken(
  token: string,
  secret: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, encoder.encode(secret));

  return {
    sub: payload.sub as string,
    role: payload.role as string,
  };
}
