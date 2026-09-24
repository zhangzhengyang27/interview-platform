import { SignJWT, jwtVerify } from 'jose'

function getJWTSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET 环境变量未配置，请在生产环境中设置');
    }
    // 仅开发环境使用默认值，并打印警告
    console.warn('[jwt] 使用开发默认密钥，请勿在生产环境中使用');
    return new TextEncoder().encode('dev-secret-change-in-production');
  }
  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJWTSecret();

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({
    id: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)

  return token
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.id as string,
      email: payload.email as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}
