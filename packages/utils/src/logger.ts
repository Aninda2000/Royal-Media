import pino from 'pino';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Create logger instance with Pino
const createLogger = (serviceName: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const logger = pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      service: serviceName,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    },
    ...(isProduction
      ? {
          // Production config
          redact: {
            paths: ['password', 'token', 'authorization', 'cookie'],
            remove: true,
          },
        }
      : {
          // Development config
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss',
              ignore: 'pid,hostname',
            },
          },
        }),
  });

  return logger;
};

// Request logging middleware
export const requestLogger = (serviceName: string) => {
  const logger = createLogger(serviceName);
  
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || generateRequestId();
    
    // Add request ID to request object
    req.requestId = requestId;
    
    // Add request ID to response headers
    res.setHeader('x-request-id', requestId);
    
    // Create child logger with request context
    req.logger = logger.child({
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    
    // Log request
    req.logger.info('Incoming request');
    
    // Log response
    const originalSend = res.send;
    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      
      req.logger.info({
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseSize: Buffer.byteLength(data || ''),
      }, 'Request completed');
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Generate unique request ID
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Error logging helper
export const logError = (logger: any, error: Error, context?: Record<string, any>) => {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  }, 'Error occurred');
};

// Performance logging helper
export const logPerformance = (logger: any, operation: string, duration: number, context?: Record<string, any>) => {
  logger.info({
    operation,
    duration: `${duration}ms`,
    ...context,
  }, 'Performance metric');
};

// Business logic logging helper
export const logBusinessEvent = (logger: any, event: string, data?: Record<string, any>) => {
  logger.info({
    event,
    ...data,
  }, 'Business event');
};

export default createLogger;