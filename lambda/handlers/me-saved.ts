import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { requireAuth, unauthorized } from '../shared/api';
import { connectDb } from '../shared/db';
import { json } from '../shared/http';
import { Recipe, User } from '../shared/models';

export const handler = async (event: APIGatewayProxyEventV2) => {
  await connectDb();
  const user = await requireAuth(event);
  if (!user) return unauthorized();

  const me = await User.findById(user.id).select('savedRecipeIds').lean();
  const ids = (me?.savedRecipeIds || []).map((x) => String(x));
  const recipes = await Recipe.find({ _id: { $in: ids }, isPublic: true }).lean();
  const byId = new Map(recipes.map((r) => [String(r._id), r]));

  return json(
    200,
    ids
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => r != null)
      .map((r) => ({
        id: String(r._id),
        ownerId: String(r.ownerId),
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
