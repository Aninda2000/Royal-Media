export const createLogger = (service: string) => ({
  info: (message: string, ...args: any[]) => console.log(`[${new Date().toISOString()}] [INFO] [${service}]`, message, ...args),
  error: (message: string, ...args: any[]) => console.error(`[${new Date().toISOString()}] [ERROR] [${service}]`, message, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[${new Date().toISOString()}] [WARN] [${service}]`, message, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[${new Date().toISOString()}] [DEBUG] [${service}]`, message, ...args),
});