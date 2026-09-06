import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

import pool from './config/database';
import userRoutes from './routes/userRoutes';
import jobRoutes from './routes/jobRoutes';
import educationRoutes from './routes/educationRoutes';
import projectRoutes from './routes/projectRoutes';
import skillRoutes from './routes/skillRoutes';
import achievementRoutes from './routes/achievementRoutes';
import contactInfoRoutes from './routes/contactInfoRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

// The app sits behind nginx, itself behind Caddy — trust the first proxy hop
// so req.ip / req.secure reflect the real client (from X-Forwarded-*) instead
// of the nginx container. Without this, any future per-IP logic (e.g.
// application-level rate limiting) would key every request in the world to
// the same address.
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : DEFAULT_ALLOWED_ORIGINS,
  })
);
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/contact-info', contactInfoRoutes);

// Health check — verifies database connectivity
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});

// Error handling middleware
export const errorHandler = (
  err: Error & { status?: number; statusCode?: number },
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  // Express 5 forwards rejected promises from route/middleware handlers to
  // error middleware, so this can now be reached after a response has
  // already started (e.g. a stream that errors mid-flight). Express's own
  // default error handler delegates in that case — calling res.status()
  // here instead would throw ERR_HTTP_HEADERS_SENT from inside the error
  // handler itself, with nothing left to catch it.
  if (res.headersSent) {
    next(err);
    return;
  }

  console.error(err.stack);

  // Errors thrown by Express/middleware (e.g. express.json() on a malformed
  // body) carry a meaningful status, such as 400. Preserve it instead of
  // always answering 500.
  const status = err.status || err.statusCode || 500;
  const message = status >= 500 ? 'Internal server error' : err.message;
  res.status(status).json({ error: message });
};

app.use(errorHandler);

/* v8 ignore if -- @preserve: exercised by running the server, not by unit tests */
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
