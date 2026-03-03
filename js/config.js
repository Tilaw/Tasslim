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
            const host = window.location.hostname;
            const protocol = window.location.protocol;

            // If running on localhost or via file:// protocol, point to the local backend
            if (host === '127.0.0.1' || host === 'localhost' || protocol === 'file:') {
                return 'http://localhost:4000/api/v1';
            }

            // Otherwise, assume relative path for production
            return '/api/v1';
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
