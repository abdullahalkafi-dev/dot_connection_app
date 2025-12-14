import express from 'express';

/**
 * Middleware to capture raw request body for webhook signature verification
 * This should be used BEFORE the JSON body parser for webhook endpoints
 */
export const rawBodySaver = (
  req: express.Request,
  res: express.Response,
  buf: Buffer,
  encoding: BufferEncoding
) => {
  if (buf && buf.length) {
    (req as any).rawBody = buf.toString(encoding || 'utf8');
  }
};

/**
 * Express middleware to preserve raw body for specific routes
 */
export const preserveRawBody = express.json({
  verify: rawBodySaver,
  limit: '10mb'
});
