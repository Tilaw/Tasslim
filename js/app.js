/**
 * Core Application Logic
 * Handles data persistence, authentication, and state management.
 */

// Auto-detect if we're running locally (file protocol or localhost) or in production
const isLocal = window.location.protocol === 'file:' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost';
const API_BASE_URL = isLocal ? 'http://127.0.0.1:4000/api/v1' : '/api/v1';

const App = {
    // Data Keys for LocalStorage
    KEYS: {
        USERS: 'spi_users',
        INVENTORY: 'spi_inventory',
        SALES: 'spi_sales',
        SUPPLIERS: 'spi_suppliers',
        MECHANICS: 'spi_mechanics',
        BIKES: 'spi_bikes',
        SESSION: 'spi_session',
        MAPPINGS: 'spi_mappings',
        DB_MIGRATED: 'spi_db_migrated'
    },

    /**
     * Helper for API calls
     */
    apiCall: async function (endpoint, method = 'GET', data = null) {
        const session = JSON.parse(localStorage.getItem(this.KEYS.SESSION));
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add Bearer token if we have one
        if (session && session.token) {
            headers['Authorization'] = `Bearer ${session.token}`;
        }

        const options = {
            method,
            headers
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

            // Check if response is actually JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error(`[api]: Expected JSON but got ${contentType || 'no content-type'}. Response text:`, text.substring(0, 500));
                throw new Error(`Server returned non-JSON response (${response.status}). The server might be down or misconfigured.`);
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || result.error || 'API Request failed');
            }

            return result;
        } catch (error) {
            console.error(`[api]: ${method} ${endpoint} failed:`, error);
            throw error;
        }
    },

    // Default Data (for initialization)
    defaults: {
        users: [
            { id: 1, name: 'Admin User', email: 'admin', password: 'admin', role: 'admin' },
            { id: 2, name: 'Staff User', email: 'staff', password: 'staff', role: 'staff' }
        ],
        inventory: [],
        suppliers: [],
        mechanics: [],
        bikes: [],
        sales: []
    },

    // Localization
    currentLang: 'en',

    translations: {
        en: {
            'appTitle': 'Tasslim Parts Manager',
            'dashboard': 'Dashboard',
            'inventory': 'Inventory',
            'pos': 'Sales / POS', // ... (rest is same, just updating title)
            'suppliers': 'Suppliers',
            'mechanics': 'Mechanics',
            'users': 'Users',
            'bikes': 'Bikes',
            'reports': 'Reports',
            'settings': 'Settings',
            'logout': 'Logout',
            'translate': 'Translate',

            // Login
            'loginTitle': 'Sign In',
            'username': 'Username',
            'password': 'Password',
            'loginBtn': 'Login',

            // Dashboard
            'totalProducts': 'Total Products',
            'lowStock': 'Low Stock Items',
            'totalRevenue': 'Total Revenue',
            'totalSuppliers': 'Total Suppliers',
            'recentSales': 'Recent Sales',
            'lowStockAlerts': 'Low Stock Alerts',
            'mechanicReport': 'Mechanic Consumption Report',

            // Common
            'add': 'Add New',
            'edit': 'Edit',
            'delete': 'Delete',
            'save': 'Save',
            'cancel': 'Cancel',
            'search': 'Search...',
            'actions': 'Actions',
            'name': 'Name',
            'import': 'Import Excel',
            'template': 'Download Template',
            'phone': 'Phone',
            'email': 'Email',
            'role': 'Role',
            'date': 'Date',
            'total': 'Total',
            'status': 'Status',

            // Inventory
            'sku': 'SKU',
            'category': 'Category',
            'stock': 'Stock',
            'price': 'Price',
            'cost': 'Cost',
            'supplier': 'Supplier',
            'minStock': 'Min Stock',

            // POS
            'cart': 'Current Order',
            'checkout': 'Checkout',
            'pay': 'Pay Now',
            'emptyCart': 'Cart is empty',

            // Inventory Filters
            'allCategories': 'All Categories',
            'cat_brakes': 'Brakes',
            'cat_filters': 'Filters',
            'cat_ignition': 'Ignition',
            'cat_lighting': 'Lighting',
            'cat_engine': 'Engine',
            'cat_suspension': 'Suspension',
            'cat_body': 'Body',
            'cat_electrical': 'Electrical',
            'allStock': 'All Stock Status',
            'stock_low': 'Low Stock',
            'stock_out': 'Out of Stock',
            'stock_good': 'In Stock',

            // Users & Mechanics & Bikes
            'plate': 'Plate Number',
            'plateCategory': 'Category',
            'kind': 'Kind',
            'regRenew': 'Reg. Renew Date',
            'city': 'City',
            'emirate': 'Emirate',
            'insurance': 'Insurance',
            'specialization': 'Specialization',
            'passport': 'Passport No.',
            'personalIdentity': 'Personal Identity',
            'contactSpec': 'Contact & Specialization',
            'code': 'Code',
            'uniqueCode': 'Unique Code',
            'location': 'Location',
            'ajman': 'Ajman',
            'sharjah': 'Sharjah',
            'vehicleIdentity': 'Vehicle Identity',
            'regInsurance': 'Registration & Insurance',
            'branchDetails': 'Branch & Details',
            'ownership': 'Ownership',
            'accident': 'Accident Details',
            'pickItem': 'Issue Part (Mapping)'
        },
        ar: {
            'appTitle': 'نظام تسليم لقطع الغيار',
            'dashboard': 'لوحة التحكم',
            'inventory': 'المخزون',
            'pos': 'نقطة البيع',
            'suppliers': 'الموردين',
            'mechanics': 'الميكانيكيين',
            'users': 'المستخدمين',
            'bikes': 'الدراجات',
            'reports': 'التقارير',
            'settings': 'الإعدادات',
            'logout': 'تسجيل خروج',
            'translate': 'ترجمة',

            // Login
            'loginTitle': 'تسجيل الدخول',
            'username': 'اسم المستخدم',
            'password': 'كلمة المرور',
            'loginBtn': 'دخول',

            // Dashboard
            'totalProducts': 'إجمالي المنتجات',
            'lowStock': 'عناصر منخفضة المخزون',
            'totalRevenue': 'إجمالي الإيرادات',
            'totalSuppliers': 'إجمالي الموردين',
            'recentSales': 'المبيعات الأخيرة',
            'lowStockAlerts': 'تنبيهات المخزون المنخفض',
            'mechanicReport': 'تقرير استهلاك الميكانيكي',

            // Common
            'add': 'إضافة جديد',
            'edit': 'تعديل',
            'delete': 'حذف',
            'save': 'حفظ',
            'cancel': 'إلغاء',
            'search': 'بحث...',
            'actions': 'إجراءات',
            'name': 'الاسم',
            'import': 'استيراد إكسل',
            'template': 'تحميل نموذج',
            'phone': 'الهاتف',
            'email': 'البريد الإلكتروني',
            'role': 'الدور',
            'date': 'التاريخ',
            'total': 'المجموع',
            'status': 'الحالة',

            // Inventory
            'sku': 'الرمز',
            'category': 'الفئة',
            'stock': 'المخزون',
            'price': 'السعر',
            'cost': 'التكلفة',
            'supplier': 'المورد',
            'minStock': 'الحد الأدنى',

            // Inventory Filters
            'allCategories': 'كل الفئات',
            'cat_brakes': 'فرامل',
            'cat_filters': 'فلاتر',
            'cat_ignition': 'إشعال',
            'cat_lighting': 'إضاءة',
            'cat_engine': 'محرك',
            'cat_suspension': 'نظام تعليق',
            'cat_body': 'هيكل',
            'cat_electrical': 'كهرباء',
            'allStock': 'كل حالات المخزون',
            'stock_low': 'مخزون منخفض',
            'stock_out': 'نفد المخزون',
            'stock_good': 'متوفر',

            // POS
            'cart': 'الطلب الحالي',
            'checkout': 'دفع',
            'pay': 'ادفع الآن',
            'emptyCart': 'السلة فارغة',

            // Users & Mechanics & Bikes
            'plate': 'رقم اللوحة',
            'plateCategory': 'الفئة',
            'kind': 'النوع',
            'regRenew': 'تاريخ التجديد',
            'city': 'المدينة',
            'emirate': 'الإمارة',
            'insurance': 'التأمين',
            'specialization': 'تخصص',
            'passport': 'رقم الجواز',
            'personalIdentity': 'الهوية الشخصية',
            'contactSpec': 'الاتصال والتخصص',
            'code': 'الرمز',
            'uniqueCode': 'الرمز الفريد',
            'location': 'الموقع',
            'ajman': 'عجمان',
            'sharjah': 'الشارقة',
            'vehicleIdentity': 'هوية المركبة',
            'regInsurance': 'التسجيل والتأمين',
            'branchDetails': 'الفرع والتفاصيل',
            'ownership': 'الملكية',
            'accident': 'تفاصيل الحادث',
            'pickItem': 'إصدار قطعة (ربط)'
        }
    },

    _initPromise: null,
    /**
     * Initialize the application (Singleton Promise)
     */
    init: function () {
        if (!this._initPromise) {
            this._initPromise = (async () => {
                await this.loadData();
                // Load language preference
                const savedLang = localStorage.getItem('spi_lang');
                if (savedLang) {
                    this.currentLang = savedLang;
                }

                // Load Sidebar State (Persistence)
                const sidebarState = localStorage.getItem('spi_sidebar_active');
                if (sidebarState === 'true') {
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar) sidebar.classList.add('active');
                }

                this.updateContent();
                this.checkAuth();
                this.applyRolePermissions();
                return true;
            })();
        }
        return this._initPromise;
    },

    toggleLanguage: function () {
        this.currentLang = this.currentLang === 'en' ? 'ar' : 'en';
        localStorage.setItem('spi_lang', this.currentLang);
        this.updateContent();
    },

    updateContent: function () {
        // Update Direction
        document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLang;

        // Update Text
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[this.currentLang][key]) {
                if (el.placeholder) {
                    el.placeholder = this.translations[this.currentLang][key];
                } else {
                    el.textContent = this.translations[this.currentLang][key];
                }
            }
        });

        // Update Sidebar toggle if needed (re-render or specific logic)
    },

    /**
     * Load data from LocalStorage or initialize with defaults
     * If migrated, syncs with Backend API.
     */
    loadData: async function () {
        const session = this.getCurrentUser();
        // 1. Backend Sync if migrated OR if we have a session (proactive sync)
        if (localStorage.getItem(this.KEYS.DB_MIGRATED) === 'true' || session) {
            // If we have a session but flag is missing, we might be on a new origin/port.
            // We'll try to sync; if it succeeds, we'll set the migration flag permanently.
            try {
                const [pData, mData, bData, sData, tData] = await Promise.all([
                    this.apiCall('/products'),
                    this.apiCall('/mechanics'),
                    this.apiCall('/bikes'),
                    this.apiCall('/suppliers'),
                    this.apiCall('/transactions')
                ]);

                if (pData.success) {
                    if (pData.data.length > 0 || localStorage.getItem(this.KEYS.INVENTORY) === null) {
                        const mapped = pData.data.map(p => ({
                            id: p.id,
                            name: p.name,
                            sku: p.sku,
                            category: p.category,
                            cost: p.cost,
                            price: p.price,
                            stock: p.stock || 0,
                            minStock: p.minStock,
                            brand: p.brand,
                            model: p.model,
                            unit: p.unit
                        }));
                        localStorage.setItem(this.KEYS.INVENTORY, JSON.stringify(mapped));
                    }
                }

                if (mData.success) {
                    const mapped = mData.data.map(m => ({
                        id: m.id,
                        code: m.code,
                        uniqueCode: m.uniqueCode,
                        name: m.name,
                        passport: m.passportNumber,
                        phone: m.phone,
                        specialization: m.specialization
                    }));
                    localStorage.setItem(this.KEYS.MECHANICS, JSON.stringify(mapped));
                }

                if (bData.success) {
                    const mapped = bData.data.map(b => ({
                        id: b.id,
                        plate: b.plate,
                        category: b.category || 'Private',
                        kind: b.kind || '',
                        color: b.color || '',
                        ownership: b.ownership || '',
                        regRenew: b.regRenew || '',
                        regExp: b.regExp || '',
                        insExp: b.insExp || '',
                        location: b.location || '',
                        accident: b.accident || '',
                        customer: b.customer,
                        phone: b.phone
                    }));
                    localStorage.setItem(this.KEYS.BIKES, JSON.stringify(mapped));
                }

                if (sData.success) {
                    localStorage.setItem(this.KEYS.SUPPLIERS, JSON.stringify(sData.data));
                }

                // If we reached here, the sync was successful.
                // Ensure the migration flag is set so we don't rely only on session existence.
                localStorage.setItem(this.KEYS.DB_MIGRATED, 'true');

                if (tData.success) {
                    // Map transactions to 'sales' format (Grouping by reference_id or fingerprint)
                    const transactions = tData.data;
                    const groups = {};

                    transactions.forEach(t => {
                        const key = t.reference_id || `tx_${t.created_at}_${t.mechanic_id}`;
                        if (!groups[key]) {
                            groups[key] = {
                                id: t.reference_id || t.id,
                                date: t.created_at,
                                type: t.transaction_type,
                                items: [],
                                mechanic: t.mechanic_name || '',
                                bike: t.bike_plate_number || '',
                                status: 'completed',
                                user: (t.first_name || '') + ' ' + (t.last_name || ''),
                                total: 0
                            };
                        }

                        // We use absolute value for quantity in the frontend 'items' display
                        const qty = Math.abs(t.quantity);
                        groups[key].items.push({
                            productId: t.product_id,
                            name: t.product_name,
                            sku: t.product_sku,
                            qty: qty,
                            price: 0, // Backend might not store unit price in trans table yet
                            total: 0
                        });
                    });

                    const mappedSales = Object.values(groups);
                    if (mappedSales.length > 0) {
                        // Merge with existing local sales to avoid data loss for unsynced records
                        const localSales = JSON.parse(localStorage.getItem(this.KEYS.SALES)) || [];
                        const localMap = new Map();

                        // Index local sales by ID
                        localSales.forEach(s => {
                            if (s && s.id) localMap.set(s.id.toString(), s);
                        });

                        // Overwrite/Add backend records
                        mappedSales.forEach(s => {
                            if (s && s.id) localMap.set(s.id.toString(), s);
                        });

                        const merged = Array.from(localMap.values());
                        localStorage.setItem(this.KEYS.SALES, JSON.stringify(merged));
                    }
                }

            } catch (error) {
                console.warn('[app]: Sync failed, using local cache', error);
                // If token is invalid/expired, clear session so user can log in again
                if (error.message && (error.message.includes('Invalid') || error.message.includes('expired'))) {
                    localStorage.removeItem(this.KEYS.SESSION);
                    if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/' && window.location.pathname !== '') {
                        window.location.href = 'index.html';
                    }
                }
            }
        }

        // 2. Local Initialization (Fallback/Initial)
        // Check for legacy users and update if found
        const existingUsers = localStorage.getItem(this.KEYS.USERS);
        if (existingUsers) {
            const users = JSON.parse(existingUsers);
            // If the first user is the old admin email, force update the users list
            if (users[0] && users[0].email === 'admin@shop.com') {
                localStorage.setItem(this.KEYS.USERS, JSON.stringify(this.defaults.users));
            }
        }

        if (!localStorage.getItem(this.KEYS.USERS)) {
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(this.defaults.users));
        }
        if (!localStorage.getItem(this.KEYS.INVENTORY)) {
            localStorage.setItem(this.KEYS.INVENTORY, JSON.stringify(this.defaults.inventory));
        }
        if (!localStorage.getItem(this.KEYS.SUPPLIERS)) {
            localStorage.setItem(this.KEYS.SUPPLIERS, JSON.stringify(this.defaults.suppliers));
        }
        if (!localStorage.getItem(this.KEYS.MECHANICS)) {
            localStorage.setItem(this.KEYS.MECHANICS, JSON.stringify(this.defaults.mechanics));
        }
        if (!localStorage.getItem(this.KEYS.BIKES)) {
            localStorage.setItem(this.KEYS.BIKES, JSON.stringify(this.defaults.bikes));
        }
        if (!localStorage.getItem(this.KEYS.SALES)) {
            localStorage.setItem(this.KEYS.SALES, JSON.stringify(this.defaults.sales));
        }
    },

    // Check if user is logged in
    checkAuth: function () {
        const session = JSON.parse(localStorage.getItem(this.KEYS.SESSION));
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('index.html') || currentPath.endsWith('/') || currentPath === '';

        // If not logged in and NOT on the login page → send to login
        if (!session && !isLoginPage) {
            window.location.href = 'index.html';
        }
        // NOTE: We do NOT redirect logged-in users away from the login page.
        // If you open index.html directly, you always see the login form.
    },

    /**
     * Login function (Transitioned to Backend)
     */
    login: async function (email, password) {
        try {
            const result = await this.apiCall('/auth/login', 'POST', { email, password });

            if (result.success) {
                // Store the backend session (which includes token and user data)
                const sessionData = {
                    ...result.data.user,
                    token: result.data.token,
                    refreshToken: result.data.refreshToken
                };
                localStorage.setItem(this.KEYS.SESSION, JSON.stringify(sessionData));
                localStorage.setItem(this.KEYS.DB_MIGRATED, 'true'); // Auto-detect migration on login
                return { success: true, user: sessionData };
            }
            return { success: false, message: 'Invalid response from server' };
        } catch (error) {
            // Fallback to local login ONLY IF not migrated yet?
            // Actually, keep it simple for now: if backend is up, use it.
            if (localStorage.getItem(this.KEYS.DB_MIGRATED) !== 'true') {
                console.warn('[auth]: Backend failed, falling back to local storage auth during migration period.');
                const users = JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [];
                const user = users.find(u =>
                    (u.email === email || u.email.split('@')[0] === email) &&
                    u.password === password
                );
                if (user) {
                    localStorage.setItem(this.KEYS.SESSION, JSON.stringify(user));
                    return { success: true, user: user };
                }
            }
            return { success: false, message: error.message || 'Login failed' };
        }
    },

    /**
     * Logout function
     */
    logout: function () {
        localStorage.removeItem(this.KEYS.SESSION);
        window.location.href = 'index.html';
    },

    saveData: function (key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    toggleSidebar: function () {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('active');
        // Save state to localStorage
        localStorage.setItem('spi_sidebar_active', sidebar.classList.contains('active'));
    },

    /**
     * Get current user
     */
    getCurrentUser: function () {
        return JSON.parse(localStorage.getItem(this.KEYS.SESSION));
    },

    /**
     * Format currency
     */
    formatCurrency: function (amount) {
        return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(amount);
    },

    /**
     * Show Toast Notification
     */
    showToast: function (message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '15px 25px';
        toast.style.background = type === 'success' ? '#27ae60' : '#c0392b';
        toast.style.color = '#fff';
        toast.style.borderRadius = '5px';
        toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
        toast.style.zIndex = '9999';
        toast.style.transition = 'opacity 0.5s';

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    /**
     * Apply Role-Based Permissions to the UI
     */
    applyRolePermissions: function () {
        const user = this.getCurrentUser();
        if (!user) return;

        // 1. Sidebar Restrictions (Staff Only)
        if (user.role === 'staff') {
            const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
            sidebarLinks.forEach(link => {
                const i18nSpan = link.querySelector('[data-i18n]');
                if (i18nSpan) {
                    const key = i18nSpan.getAttribute('data-i18n');
                    if (key === 'users' || key === 'reports' || key === 'settings') {
                        link.parentElement.style.display = 'none';
                    }
                }
            });
        }

        // 2. Global Delete Restriction (Staff Only)
        // This ensures admins can still manage data while staff is restricted
        if (user.role === 'staff') {
            const style = document.createElement('style');
            style.innerHTML = `
                .btn-delete, 
                [onclick*="delete"], 
                .action-delete,
                .fa-trash,
                .fa-trash-alt { 
                    display: none !important; 
                }
            `;
            document.head.appendChild(style);

            // Immediate cleanup for existing elements
            document.querySelectorAll('.btn-delete, [onclick*="delete"], .action-delete, .fa-trash').forEach(btn => {
                btn.style.display = 'none';
            });
        }
    },
    async exportToDatabase() {
        const inventory = JSON.parse(localStorage.getItem(this.KEYS.INVENTORY) || '[]');
        const sales = JSON.parse(localStorage.getItem(this.KEYS.SALES) || '[]');
        const suppliers = JSON.parse(localStorage.getItem(this.KEYS.SUPPLIERS) || '[]');
        const mechanics = JSON.parse(localStorage.getItem(this.KEYS.MECHANICS) || '[]');
        const bikes = JSON.parse(localStorage.getItem(this.KEYS.BIKES) || '[]');

        if (inventory.length === 0 && sales.length === 0) {
            this.showToast('No data found to migrate', 'info');
            return;
        }

        this.showToast('Migrating data to persistent database...', 'info');

        try {
            const response = await fetch(`${API_BASE_URL}/migration/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inventory, sales, suppliers, mechanics, bikes })
            });

            const result = await response.json();
            if (result.success) {
                this.showToast('Migration successful!', 'success');
                localStorage.setItem('spi_db_migrated', 'true');
                // Optional: reload to use new data source in future steps
                setTimeout(() => window.location.reload(), 2000);
            } else {
                throw new Error(result.error || 'Migration failed');
            }
        } catch (error) {
            console.error('Migration error:', error);
            this.showToast('Migration failed: ' + error.message, 'error');
        }
    }
};

// IMPORTANT: Make App accessible to inline onclick="App.*" handlers.
// Top-level `const App = ...` does not create `window.App` in browsers.
window.App = App;

// Initialize App on load
document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
});
