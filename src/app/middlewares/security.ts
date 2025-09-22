import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression, { CompressionOptions } from 'compression';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { body, validationResult } from 'express-validator';
import AppError from '../errors/AppError';
import { StatusCodes } from 'http-status-codes';

// Helmet configuration for security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API-only backend
});

// Rate limiting configurations
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per minute for sensitive operations
  message: {
    error: 'Too many requests for this operation, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// MongoDB injection sanitization - Updated configuration to avoid query modification
export const sanitizeInput = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized input detected from ${req.ip}: ${key}`);
  },
});

// Compression middleware
export const compressionConfig: RequestHandler = compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses larger than 1KB
});

// Enhanced input sanitization middleware with MongoDB injection protection
export const additionalSanitization = (req: Request, res: Response, next: NextFunction) => {
  // MongoDB injection patterns to remove
  const mongoInjectionPatterns = [
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$lt/gi,
    /\$gte/gi,
    /\$lte/gi,
    /\$exists/gi,
    /\$in/gi,
    /\$nin/gi,
    /\$size/gi,
    /\$all/gi,
    /\$regex/gi,
    /\$options/gi,
    /\$expr/gi,
    /\$jsonSchema/gi,
    /\$mod/gi,
    /\$text/gi,
    /\$elemMatch/gi,
  ];

  // Sanitize common XSS patterns and MongoDB injection
  const sanitizeString = (str: string): string => {
    let sanitized = str;
    
    // Remove XSS patterns
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    // Remove MongoDB injection patterns
    mongoInjectionPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '_');
    });

    return sanitized;
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Check if key itself contains MongoDB injection patterns
          const sanitizedKey = sanitizeString(key);
          sanitized[sanitizedKey] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize body (safe to modify)
  if (req.body) {
    try {
      req.body = sanitizeObject(req.body);
    } catch (error) {
      console.warn('Error sanitizing request body:', error);
    }
  }

  // Log potential injection attempts
  const checkForInjection = (data: any, source: string) => {
    const dataStr = JSON.stringify(data);
    mongoInjectionPatterns.forEach(pattern => {
      if (pattern.test(dataStr)) {
        console.warn(`Potential MongoDB injection attempt detected in ${source} from ${req.ip}:`, {
          pattern: pattern.source,
          data: dataStr.substring(0, 200) + (dataStr.length > 200 ? '...' : ''),
          userAgent: req.get('User-Agent'),
          url: req.url,
        });
      }
    });
  };

  // Check for injection patterns in query and params (without modifying them)
  if (req.query) {
    checkForInjection(req.query, 'query');
  }
  if (req.params) {
    checkForInjection(req.params, 'params');
  }

  next();
};

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw new AppError(StatusCodes.BAD_REQUEST, `Validation failed: ${errorMessages}`);
  }
  next();
};

// Common validation rules
export const validateEmail = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email address');


export const validateObjectId = (field: string) =>
  body(field)
    .isMongoId()
    .withMessage(`${field} must be a valid MongoDB ObjectId`);