import jwt from 'jsonwebtoken';

export const signToken = (payload: { sub: string }): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');
  return jwt.sign(payload, secret, { expiresIn: '30d' });
};

export const verifyToken = (token: string): jwt.JwtPayload & { sub: string } => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new Error('Invalid token');
  }
  return decoded as jwt.JwtPayload & { sub: string };
};
