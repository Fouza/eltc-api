// Every secret comes from the environment (.env locally, Heroku config vars in prod).
const env = process.env;

const config = {
  env: env.NODE_ENV ?? 'development',
  port: Number(env.PORT ?? 3010),
  mongoUri: env.MONGODB_URI,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN ?? '12h',
  corsOrigin: env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ?? [],
  bodyLimit: env.BODY_LIMIT ?? '10mb',
  admin: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
};

export const isProd = config.env === 'production';

export default config;
