/**
 * Application Configuration
 * All global system settings should be managed here.
 */
var CONFIG = {
    // API Configuration
    API: {
        // Use relative URL if serving from the same backend server, 
        // or absolute URL if serving from a different domain or file:// protocol.
        BASE_URL: (() => {
            // 1. Explicit override (from js/env.js — local dev only, gitignored)
            //    Production env.js on the server should set the correct API URL.
            if (window.ENV_CONFIG && window.ENV_CONFIG.API_BASE_URL) {
                return window.ENV_CONFIG.API_BASE_URL;
            }

            const host = window.location.hostname;
            const protocol = window.location.protocol;

            // 2. Local dev via file:// or localhost — use the local backend directly
            if (host === '127.0.0.1' || host === 'localhost' || protocol === 'file:') {
                return 'http://localhost:4000/api/v1';
            }

            // 3. Production fallback — frontend (Apache) and API (Node.js) are on
            //    different origins, so a relative URL won't work. Use the API subdomain.
            return 'https://api.taslimalwataniah.ae/api/v1';
        })(),

        // Timeout for API requests in milliseconds
        TIMEOUT: 15000,

        // Storage prefix for localStorage keys
        STORAGE_PREFIX: 'spi_'
    },

    // System Features
    FEATURES: {
        OFFLINE_MODE: true,
        TRANSLATION: true,
        MOBILE_NAV: true
    },

    // Default system language
    DEFAULT_LANG: 'en'
};

// Export for use in app.js
window.CONFIG = CONFIG;
