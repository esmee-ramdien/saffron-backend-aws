import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import mongoose from 'mongoose';

import { json } from './http';
import { verifyToken } from './jwt';
import { User } from './models';

export const badRequest = (message = 'Invalid input') => {
  return json(400, { error: message });
};

export const unauthorized = () => {
  return json(401, { error: 'Unauthorized' });
};

export const forbidden = () => {
  return json(403, { error: 'Forbidden' });
};

export const notFound = () => {
  return json(404, { error: 'Not found' });
};

export const routeParamId = (event: APIGatewayProxyEventV2): string => {
  return event.pathParameters?.id ?? '';
};

export const isObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const parseJsonBody = (event: APIGatewayProxyEventV2): unknown => {
  if (!event.body) return null;
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  return JSON.parse(raw);
};

export type AuthUser = { id: string; email: string; name: string };

export const requireAuth = async (event: APIGatewayProxyEventV2): Promise<AuthUser | null> => {
  try {
    const header = event.headers.authorization ?? event.headers.Authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub).lean();
    if (!user) return null;
    return { id: String(user._id), email: user.email, name: user.name };
  } catch {
    return null;
  }
};

export const maybeGetUserFromAuthHeader = async (event: APIGatewayProxyEventV2): Promise<AuthUser | null> => {
  return requireAuth(event);
};
