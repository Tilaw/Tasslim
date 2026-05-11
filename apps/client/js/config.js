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
            // Check if there is an environment override (from js/env.js)
            if (window.ENV_CONFIG && window.ENV_CONFIG.API_BASE_URL) {
                return window.ENV_CONFIG.API_BASE_URL;
            }

            const host = window.location.hostname;
            const protocol = window.location.protocol;

            // Safe fallback: If running on localhost or via file:// protocol
            if (host === '127.0.0.1' || host === 'localhost' || protocol === 'file:') {
                return 'http://localhost:4000/api/v1';
            }

            // Production default fallback
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
