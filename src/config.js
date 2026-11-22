// Every secret comes from the environment (.env locally, the host's environment variables in production).
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
  cronSecret: env.CRON_SECRET, // protects POST /api/cron/run
};

export const isProd = config.env === 'production';

export default config;
