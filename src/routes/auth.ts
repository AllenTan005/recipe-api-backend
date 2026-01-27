import { Hono } from 'hono';
import { supabase } from '../lib/supabase';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';

const app = new Hono();

const COOKIE_OPTIONS = {
  httpOnly: true,      // Not accessible via JavaScript (XSS protection)
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'Lax' as const,     // CSRF protection
  maxAge: 60 * 60 * 24 * 7,     // 7 days
  path: '/'
};

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
    // await supabase
    //   .from('user_stats')
    //   .insert([{
    //     user_id: authData.user.id,
    //     recipes_cooked: 0,
    //     total_cooking_time: 0,
    //     reviews_written: 0
    //   }]);

    // Sign in the user to get a session
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError) throw sessionError;

    setCookie(c, 'auth_token', sessionData.session.access_token, COOKIE_OPTIONS);
    setCookie(c, 'refresh_token', sessionData.session.refresh_token, COOKIE_OPTIONS);

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
    // console.log('Supabase login response data:', data);
    // console.log('Supabase login response error:', error);
    if (error) throw error;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    setCookie(c, 'auth_token', data.session.access_token, COOKIE_OPTIONS);
    setCookie(c, 'refresh_token', data.session.refresh_token, COOKIE_OPTIONS);

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

     deleteCookie(c, 'auth_token');
    deleteCookie(c, 'refresh_token');

    const token = getCookie(c, 'auth_token');
    if (token) {
      await supabase.auth.signOut();
    }

    return c.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// GET /api/auth/me - Get current user
app.get('/me', async (c) => {
try {
    // Get token from cookie instead of Authorization header
    const token = getCookie(c, 'auth_token');
    
    if (!token) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;

    if(!user){
        return c.json({ error: 'Not authenticated' }, 401);
    }
    // Get profile
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
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});

// POST /api/auth/refresh - Refresh token
app.post('/refresh', async (c) => {
  try {
    const refreshToken = getCookie(c, 'refresh_token');
    
    if (!refreshToken) {
      return c.json({ error: 'No refresh token' }, 401);
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) throw error;

    // Update cookies with new tokens
    setCookie(c, 'auth_token', data.session?.access_token || '', COOKIE_OPTIONS);
    setCookie(c, 'refresh_token', data.session?.refresh_token || '', COOKIE_OPTIONS);

    return c.json({ message: 'Token refreshed' });
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});

export default app;