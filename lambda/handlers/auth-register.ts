import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { badRequest } from '../shared/api';
import { connectDb } from '../shared/db';
import { json } from '../shared/http';
import { signToken } from '../shared/jwt';
import { User } from '../shared/models';

const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await connectDb();

    const parsed = registerSchema.safeParse(JSON.parse(event.body ?? 'null'));
    if (!parsed.success) return badRequest();

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return json(409, { error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: normalizedEmail, name, passwordHash });
    const token = signToken({ sub: String(user._id) });

    return json(200, {
      token,
      user: { id: String(user._id), email: user.email, name: user.name },
    });
  } catch (error) {
    if (error instanceof SyntaxError) return badRequest();
    throw error;
  }
};
