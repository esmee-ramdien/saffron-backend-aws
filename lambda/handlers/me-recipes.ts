import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { requireAuth, unauthorized } from '../shared/api';
import { connectDb } from '../shared/db';
import { json } from '../shared/http';
import { Recipe } from '../shared/models';

export const handler = async (event: APIGatewayProxyEventV2) => {
  await connectDb();
  const user = await requireAuth(event);
  if (!user) return unauthorized();

  const list = await Recipe.find({ ownerId: user.id }).sort({ updatedAt: -1 }).lean();
  return json(
    200,
    list.map((r) => ({
      id: String(r._id),
      title: r.title,
      emoji: r.emoji,
      category: r.category,
      timeMinutes: r.timeMinutes,
      servings: r.servings,
      ingredientCount: r.ingredients?.length ?? 0,
      isPublic: r.isPublic,
      updatedAt: r.updatedAt,
    }))
  );
};
