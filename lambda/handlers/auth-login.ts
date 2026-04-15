import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import bcrypt from 'bcrypt';
import { z } from 'zod';

import { badRequest } from '../shared/api';
import { connectDb } from '../shared/db';
import { json } from '../shared/http';
import { signToken } from '../shared/jwt';
import { User } from '../shared/models';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

const DEMO_PASSWORD = 'demo';
const DEMO_USERS = [
  { email: 'amara@example.com', name: 'Amara' },
  { email: 'leo@example.com', name: 'Leo' },
] as const;

const ensureDemoUsersExist = async (): Promise<void> => {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const u of DEMO_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      await User.create({ email: u.email, name: u.name, passwordHash: hash });
    }
  }
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await connectDb();

    const parsed = loginSchema.safeParse(JSON.parse(event.body ?? 'null'));
    if (!parsed.success) return badRequest();

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    if (DEMO_USERS.some((u) => u.email === normalizedEmail)) {
      await ensureDemoUsersExist();
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return json(401, { error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return json(401, { error: 'Invalid credentials' });

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
