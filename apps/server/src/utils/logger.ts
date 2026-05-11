/**
 * Simple color-coded logger for the backend console.
 */

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
};

const getTimestamp = () => new Date().toLocaleTimeString();

export const logger = {
    info: (message: string, ...args: any[]) => {
        console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.blue}[INFO]${colors.reset} ${message}`, ...args);
    },
    success: (message: string, ...args: any[]) => {
        console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.green}[SUCCESS]${colors.reset} ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        console.warn(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${message}`, ...args);
    },
    error: (message: string, error?: any, ...args: any[]) => {
        console.error(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.red}[ERROR]${colors.reset} ${message}`, ...args);
        if (error?.stack) {
            console.error(colors.dim + error.stack + colors.reset);
        } else if (error) {
            console.error(colors.dim, error, colors.reset);
        }
    },
    api: (method: string, path: string, status: number, duration: number) => {
        let statusColor = colors.green;
        if (status >= 400 && status < 500) statusColor = colors.yellow;
        if (status >= 500) statusColor = colors.red;

        console.log(
            `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.cyan}[API]${colors.reset} ` +
            `${colors.bright}${method}${colors.reset} ${path} ` +
            `${statusColor}${status}${colors.reset} ` +
            `${colors.dim}(${duration}ms)${colors.reset}`
        );
    },
    db: (query: string, duration?: number) => {
        console.log(
            `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.magenta}[DB]${colors.reset} ${query}` +
            (duration ? ` ${colors.dim}(${duration}ms)${colors.reset}` : "")
        );
    }
};
