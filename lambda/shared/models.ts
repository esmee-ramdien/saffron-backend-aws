import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    savedRecipeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', index: true }],
  },
  { timestamps: true }
);

const IngredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const RecipeSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    title: { type: String, required: true, trim: true },
    emoji: { type: String, default: '🍲' },
    category: { type: String, required: true, index: true },
    timeMinutes: { type: Number, required: true, min: 1 },
    servings: { type: Number, required: true, min: 1 },
    ingredients: { type: [IngredientSchema], default: [] },
    steps: { type: [String], default: [] },
    isPublic: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

RecipeSchema.index({ title: 'text' });

export const User = mongoose.models.User ?? mongoose.model('User', UserSchema);
export const Recipe = mongoose.models.Recipe ?? mongoose.model('Recipe', RecipeSchema);
