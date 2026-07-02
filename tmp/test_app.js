const fs = require('fs');
const path = require('path');

// Mock browser global variables
global.window = {
    location: {
        hostname: 'localhost',
        protocol: 'http:'
    },
    sessionStorage: {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null
    }
};
global.document = {
    addEventListener: (event, callback) => {
        console.log(`Registered event listener for: ${event}`);
    },
    documentElement: {
        dir: 'ltr',
        lang: 'en'
    }
};
global.sessionStorage = global.window.sessionStorage;

// Load config first (simulating browser load order)
const configContent = fs.readFileSync(path.join(__dirname, '../apps/client/js/config.js'), 'utf8');
eval(configContent);

// Load app.js
const appContent = fs.readFileSync(path.join(__dirname, '../apps/client/js/app.js'), 'utf8');
try {
    eval(appContent);
    console.log('Successfully executed app.js without runtime errors.');
    console.log('window.App exists:', !!global.window.App);
} catch (err) {
    console.error('Error during app.js execution:', err);
}
