import { Hono } from 'hono';
import { supabase } from '../lib/supabase';

type HonoEnv = {
  Variables: {
    user: any;
  };
};

const app = new Hono<HonoEnv>();

const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    return c.json({ error: 'No authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Store user in context
    c.set('user', user);
    await next();
  } catch (error: any) {
    return c.json({ error: 'Authentication failed' }, 401);
  }
};
//Get /api/users/me 
app.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    console.log('Fetching profile for user ID:', user);

    // Get profile with stats
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`*`)
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Get favorites count
    const { count: favoritesCount } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return c.json({
      profile: {
        id: profile.id,
        email: user.email,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        skill_level: profile.skill_level,
        dietary_restrictions: profile.dietary_restrictions || [],
        created_at: profile.created_at,
        stats: {
          recipes_cooked: profile.user_stats?.recipes_cooked || 0,
          total_cooking_time: profile.user_stats?.total_cooking_time || 0,
          reviews_written: profile.user_stats?.reviews_written || 0,
          favorite_recipes: favoritesCount || 0,
          recipes_saved: favoritesCount || 0
        }
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

//PUT /api/users/me 
app.put('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        full_name: body.full_name,
        bio: body.bio,
        skill_level: body.skill_level,
        dietary_restrictions: body.dietary_restrictions,
        avatar_url: body.avatar_url
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return c.json({ profile });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Legacy routes (keep for compatibility)
// GET /api/users/:id - Get user profile by ID
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return c.json({ profile });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GET /api/users/:id - Get user profile


// PUT /api/users/:id - Update user profile by ID
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return c.json({ profile });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;