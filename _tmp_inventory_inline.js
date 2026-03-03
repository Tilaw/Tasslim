
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
            Inventory.init();

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
            const addBtn = document.getElementById('addNewBtn');
            if (addBtn) addBtn.addEventListener('click', () => Inventory.openModal());
        });
    