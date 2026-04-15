import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { isObjectId, notFound, requireAuth, routeParamId, unauthorized } from '../shared/api';
import { connectDb } from '../shared/db';
import { json } from '../shared/http';
import { Recipe, User } from '../shared/models';

export const handler = async (event: APIGatewayProxyEventV2) => {
  await connectDb();
  const user = await requireAuth(event);
  if (!user) return unauthorized();

  const id = routeParamId(event);
  if (!isObjectId(id)) return notFound();

  const recipe = await Recipe.findById(id).lean();
  if (!recipe) return notFound();
  if (!recipe.isPublic && String(recipe.ownerId) !== user.id) return notFound();

  await User.updateOne({ _id: user.id }, { $addToSet: { savedRecipeIds: id } });
  return json(200, { ok: true });
};
