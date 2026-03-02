/**
 * Application Configuration
 * All global system settings should be managed here.
 */
const CONFIG = {
    // API Configuration
    API: {
        // Use relative URL if serving from the same backend server, 
        // or absolute URL if serving from a different domain.
        BASE_URL: (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
            ? 'http://localhost:4000/api/v1'
            : '/api/v1',

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

// Export for use in app.js (if not using modules, it's global)
window.CONFIG = CONFIG;
