import { Hono } from 'hono';
import { cors } from 'hono/cors';
import recipesRoutes from './routes/recipes';
import favoritesRoutes from './routes/favorites';
import usersRoutes from './routes/users';
import authRoutes from './routes/auth';  // Add this

const app = new Hono();

const allowedOrigins = [
  'http://localhost:4200',
  'https://recipe-app-ashen-theta.vercel.app',
  process.env.FRONTEND_URL,
  // Add your production URL here after deploying frontend
  // 'https://your-app.vercel.app'
].filter(Boolean);

app.use('/*', cors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return '*';
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) return origin;
    // Default to first allowed origin
    return allowedOrigins[0] || '*';
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/', (c) => {
  return c.json({ 
    message: 'Recipe API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.route('/api/recipes', recipesRoutes);
app.route('/api/favorites', favoritesRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/auth', authRoutes);  // Add this

const port = process.env.PORT || 3000;

console.log(`🚀 Server running on http://localhost:${port}`);
console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 Allowed origins:`, allowedOrigins);

export default {
  port,
  fetch: app.fetch,
};