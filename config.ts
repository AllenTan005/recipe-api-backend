const isDev = process.env.NODE_ENV === 'development';

export const CORS_CONFIG = {
  origin: isDev 
    ? 'http://localhost:4200' 
    : 'https://recipe-app-ashen-theta.vercel.app',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: !isDev, // false for localhost, true for production
  sameSite: isDev ? 'Lax' : 'None',
  maxAge: 7 * 24 * 60 * 60 ,
  path: '/',
}as const;