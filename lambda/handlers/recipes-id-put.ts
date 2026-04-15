import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { z } from 'zod';

import { badRequest, forbidden, isObjectId, notFound, requireAuth, routeParamId, unauthorized } from '../shared/api';
import { connectDb } from '../shared/db';
import { json } from '../shared/http';
import { Recipe } from '../shared/models';

const recipeUpsertSchema = z.object({
  title: z.string().min(2).max(120),
  emoji: z.string().min(1).max(8).optional(),
  category: z.string().min(2).max(40),
  timeMinutes: z.number().int().min(1).max(24 * 60),
  servings: z.number().int().min(1).max(50),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        amount: z.string().min(1).max(40),
        unit: z.string().min(0).max(30),
      })
    )
    .min(1),
  steps: z.array(z.string().min(1).max(600)).min(1),
  isPublic: z.boolean(),
});

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await connectDb();
    const user = await requireAuth(event);
    if (!user) return unauthorized();

    const id = routeParamId(event);
    if (!isObjectId(id)) return notFound();

    const parsed = recipeUpsertSchema.safeParse(JSON.parse(event.body ?? 'null'));
    if (!parsed.success) return badRequest();

    const recipe = await Recipe.findById(id);
    if (!recipe) return notFound();
    if (String(recipe.ownerId) !== user.id) return forbidden();

    Object.assign(recipe, parsed.data, { emoji: parsed.data.emoji || recipe.emoji || '🍲' });
    await recipe.save();
    return json(200, { ok: true });
  } catch (error) {
    if (error instanceof SyntaxError) return badRequest();
    throw error;
  }
};
