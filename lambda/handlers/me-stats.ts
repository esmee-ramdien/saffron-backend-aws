import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { requireAuth, unauthorized } from '../shared/api';
import { connectDb } from '../shared/db';
import { json } from '../shared/http';
import { Recipe, User } from '../shared/models';

export const handler = async (event: APIGatewayProxyEventV2) => {
  await connectDb();
  const user = await requireAuth(event);
  if (!user) return unauthorized();

  const [totalRecipes, publicRecipes, me] = await Promise.all([
    Recipe.countDocuments({ ownerId: user.id }),
    Recipe.countDocuments({ ownerId: user.id, isPublic: true }),
    User.findById(user.id).select('savedRecipeIds').lean(),
  ]);

  return json(200, {
    totalRecipes,
    publicRecipes,
    savedCount: me?.savedRecipeIds?.length ?? 0,
  });
};
