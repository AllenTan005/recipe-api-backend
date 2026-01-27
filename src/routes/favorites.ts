import { Hono } from 'hono';
import { supabase } from '../lib/supabase';

const app = new Hono();

// GET /api/favorites/:userId - Get user's favorites
app.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        *,
        recipes (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({ favorites });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// POST /api/favorites - Add to favorites
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert([{
        user_id: body.user_id,
        recipe_id: body.recipe_id,
      }])
      .select()
      .single();

    if (error) {
      // Handle duplicate favorite
      if (error.code === '23505') {
        return c.json({ error: 'Already in favorites' }, 409);
      }
      throw error;
    }

    return c.json({ favorite }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// DELETE /api/favorites/:userId/:recipeId - Remove from favorites
app.delete('/:userId/:recipeId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const recipeId = c.req.param('recipeId');

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId);

    if (error) throw error;

    return c.json({ message: 'Removed from favorites' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;