import { Hono } from 'hono';
import { cors } from 'hono/cors';
import recipesRoutes from './routes/recipes';
import favoritesRoutes from './routes/favorites';
import usersRoutes from './routes/users';
import authRoutes from './routes/auth';  // Add this

const app = new Hono();

app.use('/*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
}));

app.get('/', (c) => {
  return c.json({ message: 'Recipe API is running!' });
});

// Routes
app.route('/api/recipes', recipesRoutes);
app.route('/api/favorites', favoritesRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/auth', authRoutes);  // Add this

const port = process.env.PORT || 3000;

console.log(`🚀 Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};