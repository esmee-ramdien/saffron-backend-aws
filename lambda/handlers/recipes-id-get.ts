import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { isObjectId, maybeGetUserFromAuthHeader, notFound, routeParamId } from '../shared/api';
import { connectDb } from '../shared/db';
import { json } from '../shared/http';
import { Recipe, User } from '../shared/models';

export const handler = async (event: APIGatewayProxyEventV2) => {
  await connectDb();

  const id = routeParamId(event);
  if (!isObjectId(id)) return notFound();

  const recipe = await Recipe.findById(id).lean();
  if (!recipe) return notFound();

  const user = await maybeGetUserFromAuthHeader(event);
  const isOwner = user ? String(recipe.ownerId) === user.id : false;
  if (!recipe.isPublic && !isOwner) return notFound();

  let isSaved = false;
  if (user) {
    const me = await User.findById(user.id).select('savedRecipeIds').lean();
    isSaved = (me?.savedRecipeIds || []).some((x) => String(x) === id);
  }

  return json(200, {
    id: String(recipe._id),
    ownerId: String(recipe.ownerId),
    title: recipe.title,
    emoji: recipe.emoji,
    category: recipe.category,
    timeMinutes: recipe.timeMinutes,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    isPublic: recipe.isPublic,
    ingredientCount: recipe.ingredients?.length ?? 0,
    isSaved,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  });
};
