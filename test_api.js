const http = require('http');

async function testApi() {
    console.log("Starting API test...");

    // Login
    const loginRes = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin', password: 'admin' })
    });

    if (!loginRes.ok) {
        console.log("Login failed!", await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    const token = loginData.data.token;
    console.log("Logged in successfully. Token length:", token.length);

    const endpoints = [
        '/products',
        '/mechanics',
        '/bikes',
        '/suppliers',
        '/transactions',
        '/oil-changes?limit=500'
    ];

    for (const endpoint of endpoints) {
        const res = await fetch(`http://localhost:4000/api/v1${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`GET ${endpoint} -> Status: ${res.status}`);
        if (!res.ok) {
            console.log(`Error Response:`, await res.text());
        } else {
            const data = await res.json();
            console.log(`Success: ${data.data.length || 0} items`);
        }
    }
}

testApi().catch(console.error);
