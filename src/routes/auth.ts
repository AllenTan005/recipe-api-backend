import { Hono } from 'hono';
import { supabase } from '../lib/supabase';

const app = new Hono();

// POST /api/auth/signup - Create new user
app.post('/signup', async (c) => {
  try {
    const { email, password, full_name } = await c.req.json();

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError) throw authError;

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        username: email.split('@')[0],
        full_name: full_name,
        skill_level: 'beginner'
      }]);

    if (profileError) throw profileError;

    // Create user stats
    await supabase
      .from('user_stats')
      .insert([{
        user_id: authData.user.id,
        recipes_cooked: 0,
        total_cooking_time: 0,
        reviews_written: 0
      }]);

    return c.json({ 
      message: 'User created successfully',
      user: authData.user 
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// POST /api/auth/login - Login user
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    console.log('Login attempt for email:', email,password);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    console.log('Supabase login response data:', data);
    console.log('Supabase login response error:', error);
    if (error) throw error;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return c.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...profile
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});

// POST /api/auth/logout - Logout user
app.post('/logout', async (c) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return c.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// GET /api/auth/me - Get current user
app.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;

    // Get profile
    if(!user){
     throw new Error('User not found');
    } 
    else{
        const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        ...profile
      }
    });
    }
    
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});

export default app;