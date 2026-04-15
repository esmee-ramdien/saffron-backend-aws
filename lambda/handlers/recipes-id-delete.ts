import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { forbidden, isObjectId, notFound, requireAuth, routeParamId, unauthorized } from '../shared/api';
import { connectDb } from '../shared/db';
import { json } from '../shared/http';
import { Recipe, User } from '../shared/models';

export const handler = async (event: APIGatewayProxyEventV2) => {
  await connectDb();
  const user = await requireAuth(event);
  if (!user) return unauthorized();

  const id = routeParamId(event);
  if (!isObjectId(id)) return notFound();

  const recipe = await Recipe.findById(id);
  if (!recipe) return notFound();
  if (String(recipe.ownerId) !== user.id) return forbidden();

  await Recipe.deleteOne({ _id: id });
  await User.updateMany({ savedRecipeIds: id }, { $pull: { savedRecipeIds: id } });
  return json(200, { ok: true });
};
