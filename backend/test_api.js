
async function testSave() {
    const API_URL = 'http://localhost:4000/api/v1';

    // First, login to get a token
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin', password: 'admin' })
    });

    const loginData = await loginRes.json();
    if (!loginData.success) {
        console.error('Login failed:', loginData);
        return;
    }

    const token = loginData.data.token;
    console.log('Login successful, token obtained.');

    // Try to save a transaction
    const transData = {
        productId: 'SOME_PRODUCT_ID', // We need a real ID here for FK check
        transactionType: 'issue',
        quantity: -1,
        mechanicId: null,
        bikeId: null,
        referenceId: 'TEST-' + Date.now(),
        notes: 'Test transaction'
    };

    // Find a real product ID first
    const prodRes = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const prods = await prodRes.json();
    if (prods.success && prods.data.length > 0) {
        transData.productId = prods.data[0].id;
        console.log('Using real product ID:', transData.productId);
    } else {
        console.error('No products found to test with.');
        return;
    }

    const saveRes = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transData)
    });

    const result = await saveRes.json();
    console.log('Save result:', result);
}

testSave();
