/**
 * Core Application Logic
 * Handles data persistence, authentication, and state management.
 */

// Live server URL — all devices (PC and mobile) sync from the same database
// API Configuration (Externalized to config.js)
const API_BASE_URL = (window.CONFIG && window.CONFIG.API)
    ? window.CONFIG.API.BASE_URL
    : (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
        ? 'http://localhost:4000/api/v1'
        : '/api/v1';


const App = {
    // Data Keys (no longer tied to localStorage; kept for consistency)
    KEYS: {
        USERS: 'spi_users',
        INVENTORY: 'spi_inventory',
        SALES: 'spi_sales',
        SUPPLIERS: 'spi_suppliers',
        MECHANICS: 'spi_mechanics',
        BIKES: 'spi_bikes',
        SESSION: 'spi_session',
        MAPPINGS: 'spi_mappings',
        OIL_CHANGES: 'spi_oil_changes',
        DB_MIGRATED: 'spi_db_migrated',
        LOGIN_ATTEMPTS: 'spi_login_attempts',
        LOCKOUT_TIME: 'spi_lockout_time'
    },

    // In-memory application state hydrated from the backend APIs
    state: {
        inventory: [],
        suppliers: [],
        mechanics: [],
        bikes: [],
        sales: [],
        oilChanges: []
    },

    _sessionCache: null,


    /**
     * Helper for API calls. On 401 (invalid/expired token), tries to refresh the token once and retries.
     * @param {string} endpoint - API path (e.g. '/transactions')
     * @param {string} method - GET, POST, etc.
     * @param {object|null} data - Body for POST/PATCH
     * @param {boolean} _retriedAfterRefresh - Internal: skip refresh to avoid loop
     */
    apiCall: async function (endpoint, method = 'GET', data = null, _retriedAfterRefresh = false) {
        const session = this.getCurrentUser();
        const headers = {
            'Content-Type': 'application/json'
        };

        if (session && session.token) {
            headers['Authorization'] = `Bearer ${session.token}`;
        }

        const options = { method, headers };
        if (data) options.body = JSON.stringify(data);

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error(`[api]: Expected JSON but got ${contentType || 'no content-type'}. Response text:`, text.substring(0, 500));
                const err = new Error(`Server returned non-JSON response (${response.status}). The server might be down or misconfigured.`);
                err.status = response.status;
                throw err;
            }

            const result = await response.json();

            if (!response.ok) {
                const err = new Error(result.error?.message || result.error || 'API Request failed');
                err.status = response.status;

                // 401 and token expired: try refresh once, then retry this request
                if (response.status === 401 && !_retriedAfterRefresh && session && session.refreshToken) {
                    const isAuthEndpoint = (endpoint === '/auth/refresh' || endpoint.startsWith('/auth/'));
                    const isTokenError = (result.error?.message || '').toLowerCase().includes('token') || (result.error?.message || '').toLowerCase().includes('expired');
                    if (!isAuthEndpoint && isTokenError) {
                        try {
                            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ refreshToken: session.refreshToken })
                            });
                            const refreshData = await refreshRes.json();
                            if (refreshData.success && refreshData.data && refreshData.data.token) {
                                const updatedSession = {
                                    ...(session || {}),
                                    token: refreshData.data.token,
                                    refreshToken: refreshData.data.refreshToken || (session && session.refreshToken)
                                };
                                this._setSession(updatedSession);
                                return this.apiCall(endpoint, method, data, true);
                            }
                        } catch (refreshErr) {
                            console.warn('[api]: Token refresh failed', refreshErr);
                        }
                    }
                }

                if (response.status === 401) {
                    this._setSession(null);
                    if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/' && window.location.pathname !== '') {
                        alert('401 Error on endpoint: ' + endpoint + '\\nResponse text: ' + await response.text().catch(e => 'No text'));
                        this.showToast('Session expired. Please sign in again.', 'error');
                        window.location.href = 'index.html';
                        return;
                    }
                }

                throw err;
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
                const savedLang = sessionStorage.getItem('spi_lang');
                if (savedLang) {
                    this.currentLang = savedLang;
                }

                // Load Sidebar State (Persistence)
                const sidebarState = sessionStorage.getItem('spi_sidebar_active');
                if (sidebarState === 'true') {
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar) sidebar.classList.add('active');
                }

                this.initSidebar();
                this.initBottomNav();

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
        sessionStorage.setItem('spi_lang', this.currentLang);
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
     * Load data from Backend API into in-memory state.
     * No localStorage caching – DB is the single source of truth.
     */
    loadData: async function () {
        const session = this.getCurrentUser();
        if (!session || !session.token) {
            return;
        }

        try {
            const [pData, mData, bData, sData, tData, oData] = await Promise.all([
                this.apiCall('/products'),
                this.apiCall('/mechanics'),
                this.apiCall('/bikes'),
                this.apiCall('/suppliers'),
                this.apiCall('/transactions'),
                this.apiCall('/oil-changes?limit=500')
            ]);

            if (pData && pData.success) {
                this.state.inventory = pData.data.map(p => ({
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
            }

            if (mData && mData.success) {
                this.state.mechanics = mData.data.map(m => ({
                    id: m.id,
                    code: m.code,
                    uniqueCode: m.uniqueCode,
                    name: m.name,
                    passport: m.passportNumber,
                    phone: m.phone,
                    specialization: m.specialization
                }));
            }

            if (bData && bData.success) {
                this.state.bikes = bData.data.map(b => ({
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
            }

            if (sData && sData.success) {
                this.state.suppliers = sData.data;
            }

            if (oData && oData.success) {
                this.state.oilChanges = (oData.data || []).map((o) => ({
                    id: o.id,
                    bikeId: o.bikeId,
                    bikePlate: o.bikePlate,
                    mechanicId: o.mechanicId,
                    mechanicName: o.mechanicName,
                    date: o.changeDate,
                    changeDate: o.changeDate,
                    oilType: o.oilType,
                    mileage: o.mileage,
                    riderName: o.riderName,
                    riderPhone: o.riderPhone,
                    createdAt: o.createdAt
                }));
            }

            if (tData && tData.success) {
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
                            total: 0,
                            riderName: t.rider_name || '',
                            riderNumber: t.rider_phone || '',
                            riderId: t.rider_id || '',
                            receiverName: t.receiver_name || ''
                        };
                    }

                    const qty = Math.abs(t.quantity);
                    groups[key].items.push({
                        productId: t.product_id,
                        name: t.product_name,
                        sku: t.product_sku,
                        qty: qty,
                        price: 0,
                        total: 0
                    });
                });

                this.state.sales = Object.values(groups);
            }
        } catch (error) {
            console.warn('[app]: Data sync failed', error);
            if (error.message && (error.message.includes('Invalid') || error.message.includes('expired'))) {
                this._setSession(null);
                if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/' && window.location.pathname !== '') {
                    window.location.href = 'index.html';
                }
            }
        }
    },

    // Check if user is logged in
    checkAuth: function () {
        const session = this.getCurrentUser();
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('index.html') || currentPath.endsWith('/') || currentPath === '';

        // Require a valid API session token for protected pages
        // (Prevents demo/offline sessions from bypassing API authorization)
        const hasToken = session && session.token;

        // If not logged in (or missing token) and NOT on the login page → send to login
        if ((!session || !hasToken) && !isLoginPage) {
            window.location.href = 'index.html';
        }
        // NOTE: We do NOT redirect logged-in users away from the login page.
        // If you open index.html directly, you always see the login form.
    },

    /**
     * Login function (Transitioned to Backend)
     */
    login: async function (email, password) {
        // Ensure system is fully initialized before checking credentials
        await this.init();

        // Check for brute-force lockout (stored per-tab in sessionStorage)
        const lockoutTime = sessionStorage.getItem(this.KEYS.LOCKOUT_TIME);
        if (lockoutTime) {
            const timeLeft = Math.ceil((parseInt(lockoutTime) + (2 * 60 * 1000) - Date.now()) / 1000);
            if (timeLeft > 0) {
                return {
                    success: false,
                    message: `SYSTEM LOCKED: Security protocol active. Retry in ${timeLeft}s.`,
                    locked: true,
                    timeLeft: timeLeft
                };
            } else {
                // Lockout expired
                sessionStorage.removeItem(this.KEYS.LOCKOUT_TIME);
                sessionStorage.setItem(this.KEYS.LOGIN_ATTEMPTS, '0');
            }
        }

        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();

        try {
            console.log(`[auth]: Attempting login for ${cleanEmail}...`);
            const result = await this.apiCall('/auth/login', 'POST', {
                email: cleanEmail,
                password: cleanPassword
            });

            if (result.success) {
                // Successful login - reset security counters
                sessionStorage.setItem(this.KEYS.LOGIN_ATTEMPTS, '0');
                sessionStorage.removeItem(this.KEYS.LOCKOUT_TIME);

                const sessionData = {
                    ...result.data.user,
                    token: result.data.token,
                    refreshToken: result.data.refreshToken
                };
                this._setSession(sessionData);
                return { success: true, user: sessionData };
            }
            return { success: false, message: 'Invalid response from server' };
        } catch (error) {
            console.warn(`[auth]: Backend login failed: ${error.message}`);

            // Authentication failed - increment attempts
            let attempts = parseInt(sessionStorage.getItem(this.KEYS.LOGIN_ATTEMPTS) || '0') + 1;
            sessionStorage.setItem(this.KEYS.LOGIN_ATTEMPTS, attempts.toString());

            if (attempts >= 3) {
                sessionStorage.setItem(this.KEYS.LOCKOUT_TIME, Date.now().toString());
                return {
                    success: false,
                    message: 'TOO MANY ATTEMPTS: System locked for 2 minutes for security.'
                };
            }

            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Logout function
     */
    logout: function () {
        this._setSession(null);
        window.location.href = 'index.html';
    },

    saveData: function (key, data) {
        // Legacy helper – now just mirrors into in-memory state map (if used)
        this.state[key] = data;
    },

    toggleSidebar: function () {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        sidebar.classList.toggle('active');

        const isActive = sidebar.classList.contains('active');
        sessionStorage.setItem('spi_sidebar_active', isActive);

        if (overlay) {
            if (isActive && window.innerWidth <= 768) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }
    },

    /**
     * Initialize Sidebar interactions (Touch & Overlay)
     */
    initSidebar: function () {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // 1. Create Overlay if it doesn't exist
        if (!document.querySelector('.sidebar-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.onclick = () => this.toggleSidebar();
            document.body.appendChild(overlay);
        }

        // 2. Add Close Button (Mobile Only)
        if (!sidebar.querySelector('.sidebar-close')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'sidebar-close';
            closeBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleSidebar();
            };

            // RTL Support for Icon
            if (document.documentElement.dir === 'rtl') {
                closeBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            }

            sidebar.appendChild(closeBtn);
        }
    },

    /**
     * Initialize Mobile Bottom Navigation
     */
    initBottomNav: function () {
        if (window.innerWidth > 768) return;

        // 1. Create Bottom Nav if it doesn't exist
        if (!document.querySelector('.bottom-nav')) {
            const nav = document.createElement('div');
            nav.className = 'bottom-nav';

            const currentPath = window.location.pathname;
            const menuItems = [
                { icon: 'fas fa-th-large', label: 'Home', link: 'dashboard.html' },
                { icon: 'fas fa-boxes', label: 'Stock', link: 'inventory.html' },
                { icon: 'fas fa-plus-circle', label: 'Issue', link: 'issue-part.html' },
                { icon: 'fas fa-chart-bar', label: 'Reports', link: 'reports.html' },
                { icon: 'fas fa-history', label: 'History', link: 'mechanic-history.html' }
            ];

            nav.innerHTML = menuItems.map(item => {
                const isActive = currentPath.includes(item.link);
                return `
                    <a href="${item.link}" class="bottom-nav-item ${isActive ? 'active' : ''}" onclick="this.style.transform='scale(0.9)'">
                        <i class="${item.icon}"></i>
                        <span>${item.label}</span>
                    </a>
                `;
            }).join('');

            document.body.appendChild(nav);
        }
    },

    /**
     * Get current user (from sessionStorage-backed cache)
     */
    getCurrentUser: function () {
        if (this._sessionCache) return this._sessionCache;
        try {
            const raw = sessionStorage.getItem(this.KEYS.SESSION);
            this._sessionCache = raw ? JSON.parse(raw) : null;
            return this._sessionCache;
        } catch {
            return null;
        }
    },

    _setSession: function (session) {
        this._sessionCache = session || null;
        if (!session) {
            sessionStorage.removeItem(this.KEYS.SESSION);
        } else {
            sessionStorage.setItem(this.KEYS.SESSION, JSON.stringify(session));
        }
    },

    // Simple selectors for hydrated state
    getInventory: function () { return this.state.inventory || []; },
    getSuppliers: function () { return this.state.suppliers || []; },
    getMechanics: function () { return this.state.mechanics || []; },
    getBikes: function () { return this.state.bikes || []; },
    getSales: function () { return this.state.sales || []; },
    getOilChanges: function () { return this.state.oilChanges || []; },

    /**
     * Format currency
     */
    formatCurrency: function (amount) {
        const user = this.getCurrentUser();
        if (user && user.role === 'staff') {
            return '***';
        }
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

        // Treat legacy/DB roles consistently.
        const role = (user.role || '').toString();
        const elevatedRoles = new Set(['admin', 'super_admin']);
        if (elevatedRoles.has(role)) return;

        console.log(`[auth]: Applying restricted permissions for role: ${user.role}`);

        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const restrictedPages = ['users.html', 'settings.html', 'reports.html', 'suppliers.html', 'mechanics.html', 'purchase-order.html'];

        // Manager roles can access operational pages like suppliers/mechanics/purchase order.
        const managerRoles = new Set(['store_manager', 'inventory_manager']);
        const effectiveRestrictedPages = managerRoles.has(role)
            ? ['users.html', 'settings.html', 'reports.html']
            : restrictedPages;

        // 1. Page-Level Protection
        if (effectiveRestrictedPages.includes(currentPath)) {
            console.warn(`[auth]: Unauthorized access to ${currentPath}. Redirecting...`);
            window.location.href = 'dashboard.html';
            return;
        }

        // 2. Sidebar Restrictions
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (effectiveRestrictedPages.some(p => href && href.includes(p))) {
                link.parentElement.style.display = 'none';
            }
        });

        // 3. Global Action & Financial Restrictions (CSS Injection)
        const style = document.createElement('style');
        style.id = 'role-permissions-style';
        if (!document.getElementById(style.id)) {
            style.innerHTML = `
                /* Hide Administrative Actions */
                .btn-delete, .action-delete, .fa-trash, .fa-trash-alt,
                .btn-import, .import-btn, [onclick*="import"], [onclick*="Import"],
                .btn-add, .add-btn, [onclick*="Add"][onclick*="New"],
                .btn-edit, .action-edit, .fa-edit {
                    display: none !important;
                }

                /* Hide Financial Data & Sensitive UI Elements */
                .financial-info, .total-revenue, .valuation-box, .revenue-card,
                [id*="Revenue"], [id*="Value"], [id*="Profit"], [id*="potentialProfit"],
                .stat-card:nth-child(3), .stat-card:nth-child(4) /* Target revenue stats on dashboard */ {
                    display: none !important;
                }
                
                /* Inventory Table: Hide Unit Price, Total Excl, VAT %, VAT Amount, Total Incl */
                #inventoryTable th:nth-child(n+6):nth-child(-n+10),
                #inventoryTable td:nth-child(n+6):nth-child(-n+10),
                table:has(#inventoryTable) th:nth-child(n+6):nth-child(-n+10),
                table:has(#inventoryTable) td:nth-child(n+6):nth-child(-n+10) {
                    display: none !important;
                }

                /* Dashboard: Hide 'Total' column in Recent Sales */
                #recentSalesTable th:nth-child(4),
                #recentSalesTable td:nth-child(4),
                table:has(#recentSalesTable) th:nth-child(4),
                table:has(#recentSalesTable) td:nth-child(4) {
                    display: none !important;
                }

                /* General Financial concealment */
                .staff-hide-financial { display: none !important; }
            `;
            document.head.appendChild(style);
        }

        // 4. Immediate cleanup for existing elements that might not be caught by CSS properly or need JS logic
        document.querySelectorAll('.btn-delete, .action-delete, .btn-import, .btn-add').forEach(el => {
            el.remove();
        });
    },
    async exportToDatabase() {
        // Legacy helper for migrating browser-only data to DB.
        // In the new architecture all data already lives in the DB, so this is a no-op.
        this.showToast('Data export is no longer required; all data is stored in the central database.', 'info');
    }
};

// IMPORTANT: Make App accessible to inline onclick="App.*" handlers.
// Top-level `const App = ...` does not create `window.App` in browsers.
window.App = App;

// Initialize App on load
document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
});
