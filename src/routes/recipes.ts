import { Hono } from 'hono';
import { supabase } from '../lib/supabase';

const app = new Hono();

// GET /api/recipes - Get all recipes
app.get('/', async (c) => {
  try {
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({ recipes });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GET /api/recipes/:id - Get recipe by ID with full details
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    console.log('Fetching recipe with ID:', id, c.req.param('id'));

    // Get recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (recipeError) throw recipeError;

    // Get ingredients
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('*')
      .eq('recipe_id', id)
      .order('order_index', { ascending: true });

    if (ingredientsError) throw ingredientsError;

    // Get steps
    const { data: steps, error: stepsError } = await supabase
      .from('cooking_steps')
      .select('*')
      .eq('recipe_id', id)
      .order('step_number', { ascending: true });

    if (stepsError) throw stepsError;

    // Get nutrition
    const { data: nutrition, error: nutritionError } = await supabase
      .from('nutrition')
      .select('*')
      .eq('recipe_id', id)
      .single();

    // Get reviews (with user info)
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('recipe_id', id)
      .order('created_at', { ascending: false });

    const fullRecipe = {
      ...recipe,
      ingredients: ingredients || [],
      steps: steps || [],
      nutrition: nutrition || null,
      reviews: reviews || [],
    };

    return c.json({ recipe: fullRecipe });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GET /api/recipes/search - Search recipes
app.get('/search', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const category = c.req.query('category');
    const difficulty = c.req.query('difficulty');

    let queryBuilder = supabase
      .from('recipes')
      .select('*');

    // Text search
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Category filter
    if (category && category !== 'all') {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'all') {
      queryBuilder = queryBuilder.eq('difficulty', difficulty);
    }

    const { data: recipes, error } = await queryBuilder
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({ recipes });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// POST /api/recipes - Create new recipe
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert([{
        title: body.title,
        description: body.description,
        category: body.category,
        difficulty: body.difficulty,
        prep_time: body.prep_time,
        cook_time: body.cook_time,
        servings: body.servings,
        image_url: body.image_url,
      }])
      .select()
      .single();

    if (error) throw error;

    return c.json({ recipe }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;