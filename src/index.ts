import { Hono } from 'hono';
import { cors } from 'hono/cors';
import recipesRoutes from './routes/recipes';
import favoritesRoutes from './routes/favorites';
import usersRoutes from './routes/users';
import authRoutes from './routes/auth';  // Add this
import { serve } from 'bun'

const app = new Hono();
const id = Math.random().toString(36).slice(2);



const allowedOrigins = [
  'http://localhost:4200',
  'https://recipe-app-ashen-theta.vercel.app',
  process.env.FRONTEND_URL,
  // Add your production URL here after deploying frontend
  // 'https://your-app.vercel.app'
].filter(Boolean);

const isDev = process.env.NODE_ENV === 'development';

app.use('*', cors({
  origin: isDev 
    ? 'http://localhost:4200' 
    : 'https://recipe-app-ashen-theta.vercel.app',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/', (c) => {
  return c.json({ 
    message: 'Recipe API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    instance: process.env.PORT || '3000',    
    timestamp: new Date().toISOString()   
  });
});

// Routes
app.route('/api/recipes', recipesRoutes);
app.route('/api/favorites', favoritesRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/auth', authRoutes);  // Add this

const port = process.env.PORT || 3000;

// const targets = ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];
// let current = 0;

// serve({
//   port:3000,
//   reusePort:true,
//   fetch(request){
//     const target = targets[current];
//     current = (current + 1) % targets.length;
//     console.log(`Forwarding to ${target}`);
//     return fetch(target, request);
//   }
// })

console.log(`🚀 Server running on http://localhost:${port}`);
console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 Allowed origins:`, allowedOrigins);

export default {
  port,
  fetch: app.fetch,
};