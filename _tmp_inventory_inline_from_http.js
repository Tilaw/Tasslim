
        const Inventory = {
            data: [],
            filteredData: [],
            suppliers: [],
            currentPage: 1,
            itemsPerPage: 20,

            init: async function () {
                await this.loadData();
                this.filteredData = [...this.data];
                this.renderTable();
                this.populateDropdowns();

                document.getElementById('partForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.savePart();
                });

                // Real-time calculations
                const calcTotal = () => {
                    const cost = parseFloat(document.getElementById('partCost').value) || 0;
                    const vatPercent = parseFloat(document.getElementById('partVat').value) || 0;
                    const vatAmount = cost * (vatPercent / 100);
                    const total = cost + vatAmount;

                    document.getElementById('partVatAmount').value = vatAmount.toFixed(2);
                    document.getElementById('partPrice').value = total.toFixed(2);
                };

                ['partCost', 'partVat'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.addEventListener('input', calcTotal);
                });

                // Real-time validation
                ['partSku', 'partName'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.addEventListener('blur', (e) => {
                            const val = e.target.value.trim();
                            if (!val) return;
                            const field = (id === 'partSku') ? 'sku' : 'name';
                            const currentId = document.getElementById('partId').value;
                            if (this.isDuplicate(field, val, currentId)) {
                                App.showToast(`${val} already in the system`, 'warning');
                                e.target.classList.add('error');
                            } else {
                                e.target.classList.remove('error');
                            }
                        });
                    }
                });

                // Check for auto-open actions
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('action') === 'add') {
                    this.openModal();
                }
            },

            loadData: async function () {
                // Always load from API (no local/demo inventory mode)
                try {
                    const [pData, sData] = await Promise.all([
                        App.apiCall('/products', 'GET'),
                        App.apiCall('/suppliers', 'GET')
                    ]);

                    this.data = (pData && pData.success && Array.isArray(pData.data)) ? pData.data : [];
                    this.suppliers = (sData && sData.success && Array.isArray(sData.data)) ? sData.data : [];

                    // Keep sales local for now (used for print report aggregation)
                    this.sales = JSON.parse(localStorage.getItem(App.KEYS.SALES)) || [];
                } catch (err) {
                    const status = err && err.status ? err.status : null;
                    const msg = err && err.message ? err.message : '';
                    if (status === 401) {
                        App.showToast('Session expired. Please login again.', 'error');
                        window.location.href = 'index.html';
                        return;
                    }
                    App.showToast(msg || 'Failed to load inventory from server', 'error');
                    this.data = [];
                    this.suppliers = [];
                    this.sales = JSON.parse(localStorage.getItem(App.KEYS.SALES)) || [];
                }
            },

            populateDropdowns: function () {
                const supplierSelect = document.getElementById('partSupplier');
                if (supplierSelect) {
                    supplierSelect.innerHTML = '<option value="">Select Supplier</option>';
                    this.suppliers.forEach(s => {
                        const option = document.createElement('option');
                        option.value = s.name;
                        option.textContent = s.name;
                        supplierSelect.appendChild(option);
                    });
                }
            },

            renderTable: function (items = this.filteredData) {
                const tbody = document.getElementById('inventoryTable');
                if (!tbody) return;
                tbody.innerHTML = '';

                if (items.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="11" class="text-center">No parts found</td></tr>';
                    this.renderPagination(0);
                    return;
                }

                // Pagination logic
                const start = (this.currentPage - 1) * this.itemsPerPage;
                const end = start + this.itemsPerPage;
                const pagedItems = items.slice(start, end);

                pagedItems.forEach((item, index) => {
                    const qty = item.stock || 0;
                    const unitPrice = item.price || 0;
                    const totalExcl = qty * unitPrice;
                    const vatRate = item.vat || 0;
                    const vatAmount = totalExcl * (vatRate / 100);
                    const totalIncl = totalExcl + vatAmount;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${start + index + 1}</td>
                        <td style="font-weight: bold;">${item.sku}</td>
                        <td>
                            <div>${item.name}</div>
                            <small style="color: #7f8c8d;">${item.category}</small>
                        </td>
                        <td>
                            <span class="badge ${qty <= (item.minStock || 0) ? 'badge-danger' : 'badge-success'}">
                                ${qty}
                            </span>
                        </td>
                        <td>${item.unit || 'pc'}</td>
                        <td>${App.formatCurrency(unitPrice)}</td>
                        <td>${App.formatCurrency(totalExcl)}</td>
                        <td>${vatRate}%</td>
                        <td>${App.formatCurrency(vatAmount)}</td>
                        <td>${App.formatCurrency(totalIncl)}</td>
                        <td>
                            <button class="btn" style="padding: 5px 10px; background: #6366f1; color: white;" onclick="Inventory.printItemReport('${item.id}')" title="Print Report"><i class="fas fa-print"></i></button>
                            <button class="btn" style="padding: 5px 10px; background: #f39c12; color: white;" onclick="window.location.href='issue-part.html?sku=${item.sku}'" title="Pick Item"><i class="fas fa-hand-holding"></i></button>
                            <button class="btn" style="padding: 5px 10px; background: #3498db; color: white;" onclick="Inventory.edit('${item.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn" style="padding: 5px 10px; background: #e74c3c; color: white;" onclick="Inventory.delete('${item.id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                this.renderPagination(items.length);
                this.renderMobileCards(pagedItems);
            },

            renderMobileCards: function (items) {
                const container = document.getElementById('inventoryMobileList');
                if (!container) return;
                container.innerHTML = '';

                if (items.length === 0) {
                    container.innerHTML = '<div class="text-center" style="padding: 20px; color: var(--text-muted);">No parts found</div>';
                    return;
                }

                items.forEach(item => {
                    const qty = item.stock || 0;
                    const card = document.createElement('div');
                    card.className = 'mobile-data-card';
                    card.onclick = () => this.edit(item.id);

                    card.innerHTML = `
                        <div class="mobile-data-info">
                            <h4>${item.name}</h4>
                            <p>${item.sku} • ${item.category}</p>
                            <div style="margin-top: 8px; display: flex; gap: 8px;">
                                <span class="badge ${qty <= (item.minStock || 0) ? 'badge-danger' : 'badge-success'}">
                                    ${qty} ${item.unit || 'pc'}
                                </span>
                                <span style="font-size: 11px; color: var(--accent-color); font-weight: 600;">
                                    ${App.formatCurrency(item.price || 0)}
                                </span>
                            </div>
                        </div>
                        <div class="mobile-data-value" style="display: flex; gap: 5px;">
                            <button class="btn btn-sm" style="background: #6366f1; color: white;" 
                                onclick="event.stopPropagation(); Inventory.printItemReport('${item.id}')">
                                <i class="fas fa-print"></i>
                            </button>
                            <button class="btn btn-sm" style="background: #f39c12; color: white;" 
                                onclick="event.stopPropagation(); window.location.href='issue-part.html?sku=${item.sku}'">
                                <i class="fas fa-hand-holding"></i>
                            </button>
                        </div>
                    `;
                    container.appendChild(card);
                });
            },

            renderPagination: function (totalItems) {
                const container = document.getElementById('paginationControls');
                if (!container) return;
                container.innerHTML = '';

                const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;

                // Prev Button
                const prevBtn = document.createElement('button');
                prevBtn.className = 'btn';
                prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
                prevBtn.disabled = this.currentPage <= 1;
                prevBtn.style.padding = '8px 15px';
                prevBtn.onclick = () => { this.currentPage--; this.renderTable(); };
                container.appendChild(prevBtn);

                // Info text
                const info = document.createElement('span');
                info.textContent = `Page ${this.currentPage} of ${totalPages} (${totalItems} total items)`;
                info.style.fontSize = '0.9rem';
                info.style.fontWeight = '600';
                info.style.margin = '0 15px';
                container.appendChild(info);

                // Next Button
                const nextBtn = document.createElement('button');
                nextBtn.className = 'btn';
                nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                nextBtn.disabled = this.currentPage >= totalPages;
                nextBtn.style.padding = '8px 15px';
                nextBtn.onclick = () => { this.currentPage++; this.renderTable(); };
                container.appendChild(nextBtn);
            },

            changePageSize: function () {
                this.itemsPerPage = parseInt(document.getElementById('pageSize').value);
                this.currentPage = 1;
                this.renderTable();
            },

            handleFileSelect: function (event) {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                        // Get all rows as arrays to find the header
                        const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                        if (rawRows.length === 0) {
                            alert('Excel file is empty or invalid.');
                            return;
                        }

                        // Find the header row (searching for "SKU" or "Name")
                        let headerRowIndex = -1;
                        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
                            const row = rawRows[i];
                            if (row && row.some(cell => {
                                const c = (cell || '').toString().toLowerCase();
                                return c.includes('sku') || c.includes('name') || c.includes('item') || c.includes('code');
                            })) {
                                headerRowIndex = i;
                            }
                        }

                        if (headerRowIndex === -1) {
                            const foundKeys = rawRows[0]?.join(', ') || 'none';
                            alert(`No valid inventory data found.\n\nCould not find a header row containing "SKU" or "Name".\nFound in first row: ${foundKeys}\n\nPlease check your file format.`);
                            return;
                        }

                        // Parse the sheet starting from the detected header row
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { range: headerRowIndex });

                        if (jsonData.length > 0) {
                            this.processImportedData(jsonData);
                        } else {
                            alert('No data found in the file after header row.');
                        }
                    } catch (error) {
                        console.error('Import failed:', error);
                        alert('Error processing file. Please ensure it is a valid Excel file.');
                    }
                    // Reset input
                    document.getElementById('fileInput').value = '';
                };
                reader.readAsArrayBuffer(file);
            },

            processImportedData: function (data) {
                let addedCount = 0;
                const toCreate = [];

                data.forEach(row => {
                    const name = this.findKey(row, ['Name', 'name', 'Description', 'Item', 'Description (Name)']);
                    const sku = this.findKey(row, ['SKU', 'sku', 'CODE', 'Code', 'SI NO', 'si no']);

                    if (name || sku) {
                        const newItem = {
                            name: name || 'New Item',
                            sku: sku || ('SKU-' + Date.now()),
                            category: this.findKey(row, ['Category', 'category']) || 'Uncategorized',
                            stock: Number(this.findKey(row, ['Stock', 'stock', 'QUANTITY', 'Quantity']) || 0),
                            price: Number(this.findKey(row, ['Price', 'price', 'UNIT PRICE', 'Unit Price']) || 0),
                            cost: Number(this.findKey(row, ['Cost', 'cost', 'Unit Cost']) || 0),
                            supplier: this.findKey(row, ['Supplier', 'supplier']) || 'General',
                            minStock: Number(this.findKey(row, ['MinStock', 'min_stock', 'Min Stock']) || 5),
                            unit: this.findKey(row, ['Unit', 'unit']) || 'pc',
                            vat: Number(this.findKey(row, ['VAT', 'vat', 'VAT %']) || 0),
                            date: new Date().toISOString()
                        };

                        toCreate.push(newItem);
                        addedCount++;
                    }
                });

                if (addedCount > 0) {
                    (async () => {
                        try {
                            App.showToast(`Importing ${addedCount} parts to server...`, 'info');
                            // Sequential import to avoid overwhelming the API / DB
                            for (const item of toCreate) {
                                await App.apiCall('/products', 'POST', {
                                    sku: item.sku,
                                    name: item.name,
                                    category: item.category,
                                    stock: item.stock,
                                    minStock: item.minStock,
                                    unit: item.unit,
                                    cost: item.cost,
                                    price: item.price,
                                    vat: item.vat,
                                    supplier: item.supplier
                                });
                            }
                            await this.loadData();
                            this.filteredData = [...this.data];
                            this.currentPage = 1;
                            this.renderTable();
                            App.showToast(`Imported ${addedCount} parts to server.`);
                        } catch (err) {
                            console.error('Import failed:', err);
                            const msg = err && err.message ? err.message : '';
                            App.showToast(msg || 'Import failed', 'error');
                        }
                    })();
                }
            },

            downloadTemplate: function () {
                const templateData = [
                    {
                        "Name": "Example Part",
                        "SKU": "EX-001",
                        "Category": "Brakes",
                        "Stock": 50,
                        "MinStock": 10,
                        "Unit": "pc",
                        "Cost": 15.00,
                        "Price": 25.00,
                        "VAT": 5,
                        "Supplier": "Local Supplier"
                    }
                ];

                const ws = XLSX.utils.json_to_sheet(templateData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Template");
                XLSX.writeFile(wb, "Inventory_Template.xlsx");
            },

            filterData: function () {
                const query = document.getElementById('searchQuery').value.toLowerCase();
                const category = document.getElementById('categoryFilter').value;
                const stockStatus = document.getElementById('stockFilter').value;

                this.filteredData = this.data.filter(item => {
                    const matchQuery = (item.name || '').toLowerCase().includes(query) || (item.sku || '').toLowerCase().includes(query);
                    const matchCategory = !category || item.category === category;

                    let matchStock = true;
                    if (stockStatus === 'low') {
                        matchStock = item.stock <= (item.minStock || 0) && item.stock > 0;
                    } else if (stockStatus === 'out') {
                        matchStock = item.stock === 0;
                    } else if (stockStatus === 'good') {
                        matchStock = item.stock > (item.minStock || 0);
                    }

                    return matchQuery && matchCategory && matchStock;
                });

                this.currentPage = 1;
                this.renderTable();
            },

            filterItems: function () {
                this.filterData();
            },

            openModal: function (isEdit = false) {
                document.getElementById('modalTitle').textContent = isEdit ? 'Edit Part' : 'Add New Part';
                document.getElementById('partModal').classList.add('open');
                if (!isEdit) {
                    document.getElementById('partForm').reset();
                    document.getElementById('partId').value = '';
                    // Set defaults
                    document.getElementById('partUnit').value = 'pc';
                    document.getElementById('partVat').value = '0';
                    document.getElementById('partVatAmount').value = '';
                }
            },

            closeModal: function () {
                document.getElementById('partModal').classList.remove('open');
                // Clear any error states
                document.getElementById('partSku').classList.remove('error');
                document.getElementById('partName').classList.remove('error');
            },

            isDuplicate: function (field, value, excludeId = null) {
                return this.data.some(item => {
                    if (excludeId && item.id?.toString() === excludeId.toString()) return false;
                    return item[field]?.toString().toLowerCase() === value.toString().toLowerCase();
                });
            },

            savePart: async function () {
                const id = document.getElementById('partId').value;
                const isEdit = !!id;

                const sku = document.getElementById('partSku').value.trim();
                const name = document.getElementById('partName').value.trim();

                // Duplicate Checks
                if (this.isDuplicate('sku', sku, id)) {
                    App.showToast(`SI NO "${sku}" is already in the system`, 'error');
                    document.getElementById('partSku').classList.add('error');
                    return;
                }
                if (this.isDuplicate('name', name, id)) {
                    App.showToast(`Description "${name}" is already in the system`, 'error');
                    document.getElementById('partName').classList.add('error');
                    return;
                }

                const part = {
                    sku: sku,
                    name: name,
                    category: document.getElementById('partCategory')?.value || '',
                    supplier: document.getElementById('partSupplier')?.value || '',
                    stock: parseInt(document.getElementById('partStock')?.value) || 0,
                    minStock: parseInt(document.getElementById('partMinStock')?.value) || 0,
                    unit: document.getElementById('partUnit')?.value || 'pc',
                    cost: parseFloat(document.getElementById('partCost')?.value) || 0,
                    price: parseFloat(document.getElementById('partPrice')?.value) || 0,
                    vat: parseFloat(document.getElementById('partVat')?.value) || 0
                };

                try {
                    const endpoint = isEdit ? `/products/${id}` : '/products';
                    const method = isEdit ? 'PATCH' : 'POST';
                    await App.apiCall(endpoint, method, part);

                    await this.loadData();
                    this.filterData(); // refresh table & pagination with latest server state
                    this.closeModal();
                    App.showToast('Part saved successfully');
                } catch (error) {
                    console.error('Save failed:', error);
                    const status = error && error.status ? error.status : null;
                    const msg = error && error.message ? error.message : '';
                    if (status === 401) {
                        App.showToast('Session expired. Please login again.', 'error');
                        window.location.href = 'index.html';
                        return;
                    }
                    if (status === 403) {
                        App.showToast('Insufficient permissions to save inventory item.', 'error');
                        return;
                    }
                    App.showToast(msg || 'Failed to save part', 'error');
                }
            },

            edit: function (id) {
                const item = this.data.find(i => i.id?.toString() === id.toString());
                if (item) {
                    document.getElementById('partId').value = item.id;
                    document.getElementById('partSku').value = item.sku;
                    document.getElementById('partName').value = item.name;
                    document.getElementById('partCategory').value = item.category;
                    document.getElementById('partSupplier').value = item.supplier;
                    document.getElementById('partStock').value = item.stock;
                    if (document.getElementById('partMinStock')) {
                        document.getElementById('partMinStock').value = item.minStock ?? 0;
                    }
                    document.getElementById('partUnit').value = item.unit || 'pc';
                    document.getElementById('partCost').value = item.cost;
                    document.getElementById('partPrice').value = item.price;
                    document.getElementById('partVat').value = item.vat || 0;

                    // Trigger manual VAT amount update on edit
                    const cost = parseFloat(item.cost) || 0;
                    const vatPercent = parseFloat(item.vat) || 0;
                    document.getElementById('partVatAmount').value = (cost * (vatPercent / 100)).toFixed(2);

                    this.openModal(true);
                }
            },

            delete: async function (id) {
                if (confirm('Are you sure?')) {
                    try {
                        await App.apiCall(`/products/${id}`, 'DELETE');
                        await this.loadData();
                        this.filterData();
                        App.showToast('Part deleted', 'error');
                    } catch (error) {
                        console.error('Delete failed:', error);
                        const status = error && error.status ? error.status : null;
                        const msg = error && error.message ? error.message : '';
                        if (status === 401) {
                            App.showToast('Session expired. Please login again.', 'error');
                            window.location.href = 'index.html';
                            return;
                        }
                        if (status === 403) {
                            App.showToast('Insufficient permissions to delete inventory item.', 'error');
                            return;
                        }
                        App.showToast(msg || 'Failed to delete part', 'error');
                    }
                }
            },

            printItemReport: function (id) {
                const item = this.data.find(i => i.id?.toString() === id.toString());
                if (!item) return;

                // Calculate Taken
                let taken = 0;
                this.sales.forEach(sale => {
                    if (sale.type === 'issue' || !sale.type || sale.type === 'sale') {
                        (sale.items || []).forEach(it => {
                            if (it.productId?.toString() === id.toString() || it.name === item.name) {
                                taken += (Number(it.qty) || 0);
                            }
                        });
                    }
                });

                const left = Number(item.stock) || 0;
                const total = taken + left;

                const printWindow = window.open('', '_blank');
                const html = `
                    <html>
                    <head>
                        <title>Print Item Report - ${item.name}</title>
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
                            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                            .header h1 { margin: 0; font-size: 24px; color: #0f172a; }
                            .header p { margin: 5px 0 0; color: #64748b; }
                            .item-info { display: flex; justify-content: space-between; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 12px; }
                            .item-info div { flex: 1; }
                            .item-info b { display: block; font-size: 12px; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
                            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
                            .stat-card { background: white; border: 1px solid #e2e8f0; padding: 25px; border-radius: 16px; text-align: center; }
                            .stat-card b { display: block; font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 10px; }
                            .stat-card span { font-size: 32px; font-weight: 800; color: #1e293b; }
                            .stat-card.taken span { color: #ef4444; }
                            .stat-card.left span { color: #10b981; }
                            .stat-card.total span { color: #6366f1; }
                            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
                            @media print { .no-print { display: none; } }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Tasslim Parts & Service</h1>
                            <p>Single Item Inventory Status Report</p>
                        </div>
                        
                        <div class="item-info">
                            <div><b>Description</b> ${item.name}</div>
                            <div><b>Code (SKU)</b> ${item.sku}</div>
                            <div><b>Category</b> ${item.category}</div>
                        </div>

                        <div class="stats-grid">
                            <div class="stat-card total">
                                <b>Total Item (Volume)</b>
                                <span>${total}</span>
                            </div>
                            <div class="stat-card taken">
                                <b>Item Taken (Issued)</b>
                                <span>${taken}</span>
                            </div>
                            <div class="stat-card left">
                                <b>Item Left (In Stock)</b>
                                <span>${left}</span>
                            </div>
                        </div>

                        <div class="footer">
                            Report Generated on ${new Date().toLocaleString()} | Tasslim Inventory System
                        </div>

                        <script>
                            window.onload = () => {
                                window.print();
                                setTimeout(() => window.close(), 500);
                            };
                        <\/script>
                    </body>
                    </html>
                `;
                printWindow.document.write(html);
                printWindow.document.close();
            }
        };

        // Make Inventory accessible to inline onclick="Inventory.*" handlers
        window.Inventory = Inventory;

        document.addEventListener('DOMContentLoaded', async () => {
            await App.init();
            await Inventory.init();

            // Header User Info (with safety checks)
            const user = App.getCurrentUser();
            if (user) {
                const displayName = user.name || user.firstName || user.email || 'User';
                const fullName = displayName + (user.lastName ? ' ' + user.lastName : '');
                const userNameEl = document.getElementById('userName');
                const userInitialsEl = document.getElementById('userInitials');

                if (userNameEl) userNameEl.textContent = displayName;
                if (userInitialsEl) userInitialsEl.textContent = fullName.split(' ').filter(Boolean).map(n =>
                    n[0]).join('').toUpperCase() || 'U';
            }
            // keep listener for keyboard accessibility / any cases where inline onclick is stripped
            const addBtn = document.getElementById('addNewBtn');
            if (addBtn) addBtn.addEventListener('click', () => Inventory.openModal());
        });
    
