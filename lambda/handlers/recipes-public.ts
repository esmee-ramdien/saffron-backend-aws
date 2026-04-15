import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { maybeGetUserFromAuthHeader } from '../shared/api';
import { connectDb } from '../shared/db';
import { json } from '../shared/http';
import { Recipe, User } from '../shared/models';

export const handler = async (event: APIGatewayProxyEventV2) => {
  await connectDb();

  const search = event.queryStringParameters?.search?.trim() ?? '';
  const category = event.queryStringParameters?.category?.trim() ?? '';

  const filter: Record<string, unknown> = { isPublic: true };
  if (category && category.toLowerCase() !== 'all') filter.category = category;
  if (search) filter.$text = { $search: search };

  const user = await maybeGetUserFromAuthHeader(event);
  const list = await Recipe.find(filter).sort({ createdAt: -1 }).limit(200).lean();

  let savedSet = new Set<string>();
  if (user) {
    const me = await User.findById(user.id).select('savedRecipeIds').lean();
    savedSet = new Set((me?.savedRecipeIds || []).map((x: any) => String(x)));
  }

  return json(
    200,
    list.map((r) => ({
      id: String(r._id),
      ownerId: String(r.ownerId),
      title: r.title,
      emoji: r.emoji,
      category: r.category,
      timeMinutes: r.timeMinutes,
      servings: r.servings,
      ingredientCount: r.ingredients?.length ?? 0,
      isPublic: r.isPublic,
      isSaved: savedSet.has(String(r._id)),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
  );
};
