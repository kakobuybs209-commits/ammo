// ─── showView: global SPA view switcher ───────────────────────────────────────
window.showView = function showView(viewId) {
    document.querySelectorAll('.main-view').forEach(v => {
        v.classList.add('hidden');
        v.classList.remove('active');
    });
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        // Reset CSS animations for tool views on every entry
        if (target.classList.contains('tool-view')) {
            target.classList.remove('active');
            void target.offsetWidth;
        }
        target.classList.add('active');
    }
    window.scrollTo(0, 0);
    const footer = document.getElementById('site-footer');
    if (footer) footer.style.display = viewId === 'home-view' ? 'block' : 'none';
};

// Global Admin Tab Switcher & Logout
window.switchAdminTab = function(targetName) {
    console.log('switchAdminTab called:', targetName);
    try {
        const adminLinks = document.querySelectorAll('.admin-link');
        const adminViews = document.querySelectorAll('.admin-view');

        adminLinks.forEach(l => {
            if (l.getAttribute('data-target') === targetName) {
                l.classList.add('active');
            } else {
                l.classList.remove('active');
            }
        });

        adminViews.forEach(v => {
            v.classList.remove('active');
            v.style.display = 'none';
        });

        const targetView = document.getElementById('view-' + targetName);
        if (targetView) {
            targetView.classList.add('active');
            targetView.style.display = 'block';
        }

        if (targetName === 'sellers' && typeof loadAdminSellers === 'function') {
            loadAdminSellers().catch(e => console.error(e));
        }
        if (targetName === 'products' && typeof loadAdminProducts === 'function') {
            loadAdminProducts().catch(e => console.error(e));
        }
    } catch(err) {
        console.error('switchAdminTab error:', err);
    }
};

window.adminLogout = function() {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_user');
    sessionStorage.removeItem('discord_user');
    window.location.href = '/admin992slg.html';
};

// Global: open Bulk Import modal
window.openBulkScrapeModal = function() {
    const modal = document.getElementById('bulk-scrape-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
    } else {
        console.error('bulk-scrape-modal not found in DOM');
    }
};

// Global: export products to CSV
window.exportProductsCSV = async function() {
    try {
        const products = await getProducts();
        if (!products || !products.length) {
            if (typeof showToast === 'function') showToast('Brak produktów do wyeksportowania', 'warning');
            return;
        }
        const csv = exportProductsToCSV(products);
        const stamp = new Date().toISOString().slice(0, 10);
        downloadCSV(csv, `products-export-${stamp}.csv`);
        if (typeof showToast === 'function') showToast(`Wyeksportowano ${products.length} produktów`, 'success');
    } catch (error) {
        console.error('CSV export failed:', error);
        if (typeof showToast === 'function') showToast('Błąd eksportu: ' + error.message, 'error');
    }
};

// =========================================
// REAL VISIT TRACKING
// Records each page visit into localStorage by date+hour
// =========================================
(function trackVisit() {
    try {
        // Don't count admin sessions as visits
        if (sessionStorage.getItem('admin_authenticated') === 'true') return;
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // 'YYYY-MM-DD'
        const hour = now.getHours();
        const raw = localStorage.getItem('itemfinder_visits');
        const visits = raw ? JSON.parse(raw) : {};
        if (!visits[today]) visits[today] = {};
        visits[today][hour] = (visits[today][hour] || 0) + 1;
        localStorage.setItem('itemfinder_visits', JSON.stringify(visits));
    } catch(e) { /* silent fail */ }
})();

// Returns stored visit data: { 'YYYY-MM-DD': { 0: count, 1: count, ... }, ... }
function getVisitData() {
    try { return JSON.parse(localStorage.getItem('itemfinder_visits') || '{}'); } catch(e) { return {}; }
}

// Returns total visit count for a specific date key ('YYYY-MM-DD')
function getDayVisitCount(dateKey) {
    const visits = getVisitData();
    const dayData = visits[dateKey] || {};
    return Object.values(dayData).reduce((s, v) => s + v, 0);
}

// Global: Close Register Promo Modal
window.closeRegisterPromoModal = function() {
    const modal = document.getElementById('register-promo-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }
};

document.addEventListener('DOMContentLoaded', () => {

    // Auto-show Promo Popup on site visit (non-admin)
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminMode = urlParams.get('admin') === 'true' || sessionStorage.getItem('admin_authenticated') === 'true';
    if (!isAdminMode) {
        setTimeout(() => {
            if (typeof showPromoPopup === 'function') {
                const s = (typeof loadPromoPopupSettings === 'function') ? loadPromoPopupSettings() : {};
                if (s.triggerHome !== false) showPromoPopup();
            }
        }, 800);
    }

    
    if (isAdminMode) {
        // Show admin panel immediately
        document.querySelectorAll('.container').forEach(c => c.style.display = 'none');
        document.body.classList.add('admin-mode');
        document.querySelectorAll('.main-view').forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('active');
        });
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.classList.remove('hidden');
            adminPanel.classList.add('active');
            adminPanel.style.display = 'flex';
        }
        if (typeof initializeAdminEventListeners === 'function') {
            initializeAdminEventListeners();
        }
        // Hydrate Discord user profile if available
        try {
            const discordUser = JSON.parse(sessionStorage.getItem('discord_user') || 'null');
            if (discordUser) {
                const avatarImg = document.querySelector('.admin-avatar');
                const nameSpan = document.querySelector('.admin-name');
                const roleSpan = document.querySelector('.admin-role');
                if (avatarImg && discordUser.avatar) {
                    avatarImg.src = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;
                }
                if (nameSpan) {
                    nameSpan.textContent = discordUser.global_name || discordUser.username || 'Administrator';
                }
                if (roleSpan) {
                    roleSpan.textContent = '@' + (discordUser.username || 'admin');
                }
            }
        } catch (e) {
            console.warn('Could not load discord user profile:', e);
        }

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // SPA View Routing (Home vs Sellers)
    const navHomeBtn = document.getElementById('nav-home-btn');
    const navSellersBtn = document.getElementById('nav-sellers-btn');
    const homeView = document.getElementById('home-view');
    const sellersView = document.getElementById('sellers-view');

    // Helper: przełącz widok — też dostępna globalnie
    function showView(viewId) {
        document.querySelectorAll('.main-view').forEach(v => {
            v.classList.add('hidden');
            v.classList.remove('active');
        });
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.remove('hidden');
            // Reset CSS entry animations for tool views on every entry
            if (target.classList.contains('tool-view')) {
                target.classList.remove('active');
                void target.offsetWidth;
            }
            target.classList.add('active');
        }
        window.scrollTo(0, 0);
        // Odblokuj scrollowanie przy zmianie widoku
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        // footer visibility
        const footer = document.getElementById('site-footer');
        if (footer) footer.style.display = viewId === 'home-view' ? 'block' : 'none';

        // Promo Popup Trigger
        if (typeof showPromoPopup === 'function' && typeof loadPromoPopupSettings === 'function') {
            const s = loadPromoPopupSettings();
            const isProducts = viewId === 'products-view';
            const isTool = ['tracking-view','converter-view','qc-view'].includes(viewId);
            if ((isProducts && s.triggerProducts !== false) || (isTool && s.triggerTools === true)) {
                showPromoPopup();
            } else {
                if (typeof promoShowTimer !== 'undefined' && promoShowTimer) clearTimeout(promoShowTimer);
                if (typeof closePromoPopup === 'function') closePromoPopup();
            }
        }
    }
    window.showView = showView; // eksportuj globalnie

    if(navHomeBtn && homeView) {
        navHomeBtn.addEventListener('click', () => showView('home-view'));
    }

    if(navSellersBtn && sellersView) {
        navSellersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showView('sellers-view');
        });
    }

    const footerLogoBtn = document.getElementById('footer-logo-btn');
    if(footerLogoBtn && homeView) {
        footerLogoBtn.addEventListener('click', () => showView('home-view'));
    }

    // ── Mobile hamburger menu ──
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const mobileNavClose = document.getElementById('mobile-nav-close');

    function openMobileNav() {
        mobileNav.classList.remove('hidden');
        mobileNavOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        setTimeout(() => mobileNav.classList.add('open'), 10);
    }

    function closeMobileNav() {
        mobileNav.classList.remove('open');
        setTimeout(() => {
            mobileNav.classList.add('hidden');
            mobileNavOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }, 350);
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileNav);
    if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
    if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileNav);

    // Mobile nav links routing
    const mobileNavProductsBtn = document.getElementById('mobile-nav-products-btn');
    if (mobileNavProductsBtn) {
        mobileNavProductsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeMobileNav();
            showView('products-view');
            if (typeof loadProductsGrid === 'function') loadProductsGrid();
            if (typeof setNavActive === 'function') setNavActive('products');
        });
    }

    const mobileNavGuideBtn = document.getElementById('mobile-nav-guide-btn');
    if (mobileNavGuideBtn) {
        mobileNavGuideBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeMobileNav();
            showView('guide-view');
        });
    }

    document.querySelectorAll('.mobile-nav-view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const view = btn.dataset.view;
            if (view) {
                closeMobileNav();
                showView(view);
            }
        });
    });


    // ── Scroll Reveal (IntersectionObserver) ──
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const delay = parseInt(el.dataset.delay || '0', 10);
            setTimeout(() => el.classList.add('is-visible'), delay);
            revealObserver.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-up, .reveal-card, .reveal-row').forEach(el => {
        revealObserver.observe(el);
    });

    // hf-card kliknięcia (features section)
    document.querySelectorAll('.hf-card[data-view]').forEach(card => {
        card.addEventListener('click', () => {
            const viewId = card.getAttribute('data-view');
            showView(viewId);
            if (viewId === 'products-view') loadProductsGrid();
        });
    });

    // Eksploruj Spreadsheet → products-view
    const heroExploreBtn = document.getElementById('hero-explore-btn');
    if (heroExploreBtn) {
        heroExploreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showView('products-view');
            loadProductsGrid();
            // animacja wejścia
            const pv = document.getElementById('products-view');
            if (pv) {
                pv.classList.remove('pv-animate-in');
                void pv.offsetWidth; // reflow
                pv.classList.add('pv-animate-in');
            }
        });
    }

    // Products filter bar
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.products-filter-btn');
        if (!btn) return;
        document.querySelectorAll('.products-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-cat');
        filterProductsGrid(cat);
    });


    // Sellers Tags Logic
    // Sellers Tags Logic — event delegation żeby działało z nowymi tagami
    const sellersGrid = document.getElementById('sellers-grid');

    // Helper function to normalize brand names (remove special chars, lowercase)
    function normalizeBrand(brand) {
        return brand.toLowerCase().trim()
            .replace(/['']/g, '')  // Remove apostrophes
            .replace(/[\s\-\.]/g, ''); // Remove spaces, hyphens, dots
    }

    function filterSellersByBrand(brand) {
        console.log('🔍 filterSellersByBrand called with:', brand);
        const cards = document.querySelectorAll('.seller-card-premium');
        const normalizedSearchBrand = normalizeBrand(brand);
        
        console.log('Filtering by brand:', brand, 'normalized:', normalizedSearchBrand);
        
        let visibleCount = 0;
        cards.forEach(card => {
            const cardBrands = card.getAttribute('data-brands') || '';
            
            // Show all if "Wszystkie"
            if (brand === 'Wszystkie') {
                card.style.display = '';
                visibleCount++;
                return;
            }
            
            // Split brands by comma and normalize each
            const brandList = cardBrands.split(',').map(b => normalizeBrand(b));
            
            // Check if any brand matches EXACTLY (not partial match)
            const matches = brandList.some(b => b === normalizedSearchBrand);
            
            if (matches) {
                card.style.display = '';
                visibleCount++;
                console.log('Showing card for:', brand);
            } else {
                card.style.display = 'none';
            }
        });
        
        console.log('Visible cards:', visibleCount);
    }

    function filterSellersBySearch(query) {
        const cards = document.querySelectorAll('.seller-card-premium');
        const q = query.toLowerCase().trim();
        
        console.log('Searching for:', q);
        
        // Reset active tag to "Wszystkie" when searching
        if (q) {
            document.querySelectorAll('#sellers-view .sv-tag, #sellers-view .seller-tag')
                .forEach(t => t.classList.remove('active'));
            const wszystkieTag = Array.from(document.querySelectorAll('#sellers-view .sv-tag, #sellers-view .seller-tag'))
                .find(t => t.textContent.trim() === 'Wszystkie');
            if (wszystkieTag) wszystkieTag.classList.add('active');
        }
        
        let visibleCount = 0;
        cards.forEach(card => {
            if (!q) {
                card.style.display = '';
                card.style.visibility = 'visible';
                card.style.opacity = '1';
                card.style.position = 'relative';
                visibleCount++;
                return;
            }
            
            const name   = (card.querySelector('.seller-info h3')?.textContent || '').toLowerCase();
            const brands = (card.getAttribute('data-brands') || '').toLowerCase();
            const desc   = (card.querySelector('.seller-desc')?.textContent || '').toLowerCase();
            
            const matches = name.includes(q) || brands.includes(q) || desc.includes(q);
            
            if (matches) {
                card.style.display = '';
                card.style.visibility = 'visible';
                card.style.opacity = '1';
                card.style.position = 'relative';
                visibleCount++;
            } else {
                card.style.display = 'none';
                card.style.visibility = 'hidden';
                card.style.opacity = '0';
                card.style.position = 'absolute';
            }
        });
        
        console.log('Search results:', visibleCount, 'cards');
    }

    // Tag click — event delegation
    document.addEventListener('click', (e) => {
        const tag = e.target.closest('#sellers-view .sv-tag, #sellers-view .seller-tag');
        if (!tag) return;
        
        console.log('Tag clicked:', tag.textContent.trim());
        
        // Clear search when clicking tag
        const searchInput = document.querySelector('#sellers-view .sellers-search-input');
        if (searchInput) searchInput.value = '';
        
        document.querySelectorAll('#sellers-view .sv-tag, #sellers-view .seller-tag')
            .forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        filterSellersByBrand(tag.innerText.trim());
    });

    // Sellers search — event delegation na input
    document.addEventListener('input', (e) => {
        if (!e.target.classList.contains('sellers-search-input')) return;
        filterSellersBySearch(e.target.value);
    });

    // Category selection logic
    const categoryItems = document.querySelectorAll('.category-item');

    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.id === 'show-girls-btn') {
                const subCategories = document.getElementById('girls-subcategories');
                if (!subCategories) return;
                subCategories.classList.toggle('hidden');
                if (subCategories.classList.contains('hidden')) {
                    item.classList.remove('active');
                } else {
                    categoryItems.forEach(i => { if(i.id !== 'show-girls-btn') i.classList.remove('active'); });
                    item.classList.add('active');
                }
                return;
            }
            categoryItems.forEach(i => { if(!i.classList.contains('girl-item')) i.classList.remove('active'); });
            item.classList.add('active');
            if (!item.classList.contains('girl-item') && item.id !== 'show-girls-btn') {
                const subCategories = document.getElementById('girls-subcategories');
                if (subCategories) subCategories.classList.add('hidden');
            }
            const nameEl = item.querySelector('.category-name');
            if (nameEl) console.log(`Selected category: ${nameEl.innerText}`);

        });
    });

    // Search bar logic
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') console.log(`Searching for: ${searchInput.value}`);
        });
    }

    // Sort select logic
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            console.log(`Sorting by: ${e.target.value}`);
        });
    }        // Perform sort

    // Typewriter effect
    const textElement = document.getElementById('typewriter-text');
    
    // Function to get translated typewriter texts
    function getTypewriterTexts() {
        if (typeof t === 'function') {
            return [
                t('typewriter.1'),
                t('typewriter.2'),
                t('typewriter.3')
            ];
        }
        // Fallback if translations not loaded yet
        return [
            "Najlepsze przedmioty z rzetelnymi recenzjami!",
            "Narzędzia, które podniosą Twoją wiedzę!",
            "Nowości ze świata Reps, których potrzebujesz"
        ];
    }
    
    let textsToType = getTypewriterTexts();
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 70;
    let pauseAfterTyping = 2000;
    let pauseAfterDeleting = 500;

    function typeWriter() {
        const currentText = textsToType[textIndex];
        
        if (!isDeleting && charIndex < currentText.length) {
            // Type next character
            textElement.innerHTML = currentText.substring(0, charIndex + 1);
            charIndex++;
            setTimeout(typeWriter, typingSpeed);
        } else if (isDeleting && charIndex > 0) {
            // Delete character
            textElement.innerHTML = currentText.substring(0, charIndex - 1);
            charIndex--;
            setTimeout(typeWriter, typingSpeed / 2); // delete faster
        } else if (!isDeleting && charIndex === currentText.length) {
            // Finished typing, pause then start deleting
            isDeleting = true;
            setTimeout(typeWriter, pauseAfterTyping);
        } else if (isDeleting && charIndex === 0) {
            // Finished deleting, pause then start typing again
            isDeleting = false;
            textIndex = (textIndex + 1) % textsToType.length; // move to next string
            setTimeout(typeWriter, pauseAfterDeleting);
        }
    }
    
    // Update typewriter texts when language changes
    if (typeof window !== 'undefined') {
        window.addEventListener('languageChanged', () => {
            textsToType = getTypewriterTexts();
            // Reset to start with new language
            if (isDeleting) {
                // If currently deleting, let it finish and pick up new texts
                return;
            }
            // If at the start of a text, update immediately
            if (charIndex === 0) {
                textIndex = 0;
            }
        });
    }

    // Start the animation
    setTimeout(typeWriter, 1000);

    // Modal logic
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');

    function toggleModal() {
        if (!settingsModal) return;
        const isHidden = settingsModal.classList.contains('hidden');
        
        if (isHidden) {
            // Otwieranie modala
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
            document.body.classList.add('modal-open');
            
            // Usuń klasę hidden żeby zaczęła się animacja
            settingsModal.classList.remove('hidden');
            
            // Force reflow żeby animacja zadziałała
            void settingsModal.offsetHeight;
        } else {
            // Zamykanie modala
            settingsModal.classList.add('hidden');
            
            // Odblokuj scrollowanie po zakończeniu animacji
            setTimeout(() => {
                document.body.classList.remove('modal-open');
                document.documentElement.style.setProperty('--scrollbar-width', '0px');
            }, 300);
        }
    }

    if (settingsBtn) settingsBtn.addEventListener('click', toggleModal);
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', toggleModal);

    // Close modal on outside click
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) toggleModal();
        });
    }

    // Modal option selection logic
    const settingsSections = document.querySelectorAll('.settings-section');
    
    settingsSections.forEach(section => {
        const options = section.querySelectorAll('.settings-option');
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class and hide check icon from all options in this section
                options.forEach(opt => {
                    opt.classList.remove('active');
                    opt.querySelector('.check-icon').classList.add('hidden');
                });
                
                // Add active class and show check icon for clicked option
                option.classList.add('active');
                option.querySelector('.check-icon').classList.remove('hidden');
            });
        });
    });

    // Login Modal Logic
    const loginBtn = document.querySelector('.login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginBtn = document.getElementById('close-login');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    function toggleLoginModal() {
        if (!loginModal) return;
        const isHidden = loginModal.classList.contains('hidden');
        
        if (isHidden) {
            // Otwieranie modala
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
            document.body.classList.add('modal-open');
            
            loginModal.classList.remove('hidden');
            if (loginError) loginError.classList.add('hidden');
            if (loginForm) loginForm.reset();
        } else {
            // Zamykanie modala
            loginModal.classList.add('hidden');
            
            setTimeout(() => {
                document.body.classList.remove('modal-open');
                document.documentElement.style.setProperty('--scrollbar-width', '0px');
            }, 300);
        }
    }

    if (loginBtn) loginBtn.addEventListener('click', toggleLoginModal);
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', toggleLoginModal);
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) toggleLoginModal();
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // prevent page reload
        
        const emailInput = document.getElementById('admin-login').value;
        const passwordInput = document.getElementById('admin-password').value;

        // Show loading state
        loginError.classList.add('hidden');
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logowanie...';
        submitBtn.disabled = true;

        try {
            // Try Supabase Auth first
            if (typeof window.signInWithEmail === 'function') {
                const result = await window.signInWithEmail(emailInput, passwordInput);
                
                if (result.success) {
                    // Success with Supabase
                    toggleLoginModal();
                    showAdminPanel();
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    return;
                }
            }
            
            // Fallback: hardcoded admin check (temporary)
            if (emailInput === 'admin' && passwordInput === 'fxlserepswebsiteapi') {
                toggleLoginModal();
                showAdminPanel();
            } else {
                loginError.textContent = 'Nieprawidłowy email lub hasło';
                loginError.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Login error:', error);
            // Fallback on error
            if (emailInput === 'admin' && passwordInput === 'fxlserepswebsiteapi') {
                toggleLoginModal();
                showAdminPanel();
            } else {
                loginError.textContent = 'Błąd logowania';
                loginError.classList.remove('hidden');
            }
        }
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });

    function showAdminPanel() {
        // Hide main site elements
        document.querySelectorAll('.container').forEach(c => c.style.display = 'none');
        // Admin mode hides the floating social bubbles
        document.body.classList.add('admin-mode');
        
        // Hide all main views
        document.querySelectorAll('.main-view').forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('active');
        });
        
        // Show admin panel
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.classList.remove('hidden');
            adminPanel.classList.add('active');
            adminPanel.style.display = 'flex';
        }
        
        // Initialize admin event listeners
        initializeAdminEventListeners();
    }

    // Admin Panel Navigation
    function switchAdminTab(targetName) {
        const adminLinks = document.querySelectorAll('.admin-link');
        const adminViews = document.querySelectorAll('.admin-view');

        adminLinks.forEach(l => {
            if (l.getAttribute('data-target') === targetName) {
                l.classList.add('active');
            } else {
                l.classList.remove('active');
            }
        });

        adminViews.forEach(v => {
            v.classList.remove('active');
            v.style.display = 'none';
        });

        const targetView = document.getElementById('view-' + targetName);
        if (targetView) {
            targetView.classList.add('active');
            targetView.style.display = 'block';
        }

        if (targetName === 'sellers' && typeof loadAdminSellers === 'function') loadAdminSellers();
        if (targetName === 'products' && typeof loadAdminProducts === 'function') loadAdminProducts();
    }
    window.switchAdminTab = switchAdminTab;

    function adminLogout() {
        sessionStorage.removeItem('admin_authenticated');
        sessionStorage.removeItem('admin_user');
        sessionStorage.removeItem('discord_user');
        window.location.href = '/admin992slg.html';
    }
    window.adminLogout = adminLogout;

    const adminLinks = document.querySelectorAll('.admin-link');
    adminLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            if (target) switchAdminTab(target);
        });
    });

    // Admin Settings Tabs
    const settingsTabs = document.querySelectorAll('.settings-tab');
    const settingsPanes = document.querySelectorAll('.settings-pane');

    settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs and panes
            settingsTabs.forEach(t => t.classList.remove('active'));
            settingsPanes.forEach(p => p.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            
            // Show corresponding pane
            const targetId = 'pane-' + tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Logout
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', async () => {
        // Clear Discord session
        sessionStorage.removeItem('discord_user');
        sessionStorage.removeItem('admin_authenticated');
        
        // Sign out from Supabase (if used)
        if (typeof window.signOut === 'function') {
            await window.signOut();
        }
        
        document.getElementById('admin-panel').classList.add('hidden');
        const cont = document.querySelector('.container');
        if (cont) cont.style.display = 'block';
        document.body.classList.remove('admin-mode');
    });

    // Sellers Tags Scroll and Drag Logic
    const tagsContainer = document.querySelector('.sellers-tags-scroll');

    if (tagsContainer) {
        let isDown = false;
        let startX;
        let scrollLeft;

        tagsContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            tagsContainer.style.cursor = 'grabbing';
            startX = e.pageX - tagsContainer.offsetLeft;
            scrollLeft = tagsContainer.scrollLeft;
        });

        tagsContainer.addEventListener('mouseleave', () => {
            isDown = false;
            tagsContainer.style.cursor = 'grab';
        });

        tagsContainer.addEventListener('mouseup', () => {
            isDown = false;
            tagsContainer.style.cursor = 'grab';
        });

        tagsContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - tagsContainer.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast
            tagsContainer.scrollLeft = scrollLeft - walk;
        });

        // Setup cursors
        tagsContainer.style.cursor = 'grab';
    }

    // =========================================
    // BULK SCRAPE LOGIC (Weidian)
    // =========================================
    
    const bulkScrapeBtn = document.getElementById('bulk-import-btn');
    const bulkScrapeModal = document.getElementById('bulk-scrape-modal');
    const closeBulkScrapeBtn = document.getElementById('close-bulk-scrape-modal');
    const bulkScrapeUrlsTextarea = document.getElementById('bulk-scrape-urls');
    const startBulkScrapeBtn = document.getElementById('start-bulk-scrape-btn');
    const bulkScrapeBatchSelect = document.getElementById('bulk-scrape-batch');
    const bulkScrapeConcurrencySelect = document.getElementById('bulk-scrape-concurrency');
    const bulkScrapePinCheckbox = document.getElementById('bulk-scrape-pin');
    const bulkScrapeProgress = document.getElementById('bulk-scrape-progress');
    const bulkScrapeProgressBar = document.getElementById('bulk-scrape-progress-bar');
    const bulkScrapeStatus = document.getElementById('bulk-scrape-status');
    const bulkScrapeResults = document.getElementById('bulk-scrape-results');
    const bulkScrapeSuccessCount = document.getElementById('bulk-scrape-success-count');
    const bulkScrapeErrorCount = document.getElementById('bulk-scrape-error-count');
    
    console.log('Bulk scrape elements:', { bulkScrapeBtn, bulkScrapeModal, closeBulkScrapeBtn });
    
    // Open bulk scrape modal
    if (bulkScrapeBtn) {
        bulkScrapeBtn.addEventListener('click', () => {
            console.log('Bulk Scrape button clicked');
            if (bulkScrapeModal) {
                console.log('Opening bulk scrape modal');
                bulkScrapeModal.classList.remove('hidden');
                document.body.classList.add('modal-open');
            } else {
                console.error('Bulk scrape modal not found');
            }
        });
    } else {
        console.error('Bulk scrape button not found');
    }
    
    // Close bulk scrape modal
    if (closeBulkScrapeBtn) {
        closeBulkScrapeBtn.addEventListener('click', () => {
            bulkScrapeModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        });
    }
    
    // Click outside to close
    if (bulkScrapeModal) {
        bulkScrapeModal.addEventListener('click', (e) => {
            if (e.target === bulkScrapeModal) {
                closeBulkScrapeBtn.click();
            }
        });
    }
    
    // Start bulk scrape
    if (startBulkScrapeBtn) {
        startBulkScrapeBtn.addEventListener('click', async () => {
            const urls = bulkScrapeUrlsTextarea.value.trim();
            if (!urls) {
                showToast('Wklej przynajmniej jeden link Weidian', 'error');
                return;
            }
            
            // Parse URLs
            const urlArray = urls.split(/[\n\s]+/).filter(url => url.trim());
            console.log('Parsed URLs:', urlArray);
            
            const batch = bulkScrapeBatchSelect.value;
            const concurrency = parseInt(bulkScrapeConcurrencySelect.value);
            const pin = bulkScrapePinCheckbox.checked;
            
            // Show progress
            bulkScrapeProgress.classList.remove('hidden');
            bulkScrapeResults.classList.add('hidden');
            bulkScrapeProgressBar.style.width = '0%';
            bulkScrapeStatus.textContent = 'Rozpoczynam scraping...';
            startBulkScrapeBtn.disabled = true;
            
            try {
                const response = await fetch('/api/scrape-bulk', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        urls: urlArray,
                        batch,
                        concurrency,
                        pin,
                        replaceMode: 'none'
                    })
                });
                
                const data = await response.json();
                console.log('Bulk scrape response:', data);
                
                // Update progress bar
                bulkScrapeProgressBar.style.width = '100%';
                
                // Show results
                bulkScrapeProgress.classList.add('hidden');
                bulkScrapeResults.classList.remove('hidden');
                bulkScrapeSuccessCount.textContent = data.successes || 0;
                bulkScrapeErrorCount.textContent = data.failures || 0;
                
                if (data.success) {
                    showToast(`Zaimportowano ${data.successes} produktów!`, 'success');
                    // Reload products after successful import
                    if (typeof loadAdminProducts === 'function') {
                        loadAdminProducts();
                    }
                } else {
                    showToast(`Import zakończony z ${data.failures} błędami`, 'warning');
                }
                
            } catch (error) {
                console.error('Bulk scrape error:', error);
                bulkScrapeProgress.classList.add('hidden');
                showToast('Błąd podczas scrapingu: ' + error.message, 'error');
            } finally {
                startBulkScrapeBtn.disabled = false;
            }
        });
    }

    // =========================================
    // BULK IMPORT/EXPORT LOGIC (CSV/JSON)
    // =========================================
    
    const exportBtn = document.getElementById('export-products-btn');
    const importModal = document.getElementById('import-products-modal');
    const closeImportBtn = document.getElementById('close-import-modal');
    const selectFileBtn = document.getElementById('select-file-btn');
    const fileInput = document.getElementById('import-file-input');
    const startImportBtn = document.getElementById('start-import-btn');
    const downloadTemplateBtn = document.getElementById('download-template');
    
    let selectedProducts = [];
    
    console.log('CSV/JSON import elements:', { importModal, closeImportBtn });
    
    // Close import modal
    if (closeImportBtn) {
        closeImportBtn.addEventListener('click', () => {
            importModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
            // Reset modal
            selectedProducts = [];
            document.getElementById('file-info').classList.add('hidden');
            document.getElementById('import-progress').classList.add('hidden');
            document.getElementById('import-results').classList.add('hidden');
            startImportBtn.disabled = true;
        });
    }
    
    // Click outside to close
    if (importModal) {
        importModal.addEventListener('click', (e) => {
            if (e.target === importModal) {
                closeImportBtn.click();
            }
        });
    }
    
    // Select file button
    if (selectFileBtn) {
        selectFileBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    // File selected
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                selectedProducts = await importProductsFromFile(file);
                
                // Show file info
                document.getElementById('file-name').textContent = file.name;
                document.getElementById('products-count').textContent = selectedProducts.length;
                document.getElementById('file-info').classList.remove('hidden');
                startImportBtn.disabled = false;
                
                // Hide results from previous import
                document.getElementById('import-results').classList.add('hidden');
                
            } catch (error) {
                showToast('Błąd podczas wczytywania pliku: ' + error.message, 'error');
            }
        });
    }
    
    // Start import
    if (startImportBtn) {
        startImportBtn.addEventListener('click', async () => {
            startImportBtn.disabled = true;
            selectFileBtn.disabled = true;
            
            // Show progress
            document.getElementById('import-progress').classList.remove('hidden');
            
            const results = await bulkImportProducts(selectedProducts, (progress) => {
                // Update progress bar
                const percent = (progress.current / progress.total) * 100;
                document.getElementById('import-progress-bar').style.width = percent + '%';
                document.getElementById('import-status').textContent = 
                    `Importowanie ${progress.current}/${progress.total}: ${progress.product}`;
            });
            
            // Show results
            document.getElementById('success-count').textContent = results.success;
            document.getElementById('error-count').textContent = results.failed;
            document.getElementById('import-results').classList.remove('hidden');
            
            // Hide progress
            document.getElementById('import-progress').classList.add('hidden');
            
            // Re-enable buttons
            selectFileBtn.disabled = false;
            
            // Reload products table
            if (results.success > 0) {
                await loadAdminProducts();
                showToast(`Zaimportowano ${results.success} produktów!`, 'success');
            }
            
            if (results.failed > 0) {
                console.error('Import errors:', results.errors);
            }
        });
    }
    
    // Download template
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const template = generateCSVTemplate();
            downloadCSV(template, 'products-template.csv');
            showToast('Szablon pobrany!', 'success');
        });
    }
    
    // Export products
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                const products = await getProducts();

                if (!products.length) {
                    showToast('Brak produktów do wyeksportowania', 'warning');
                    return;
                }

                const csv = exportProductsToCSV(products);
                const stamp = new Date().toISOString().slice(0, 10);
                downloadCSV(csv, `products-export-${stamp}.csv`);
                showToast(`Wyeksportowano ${products.length} produktów`, 'success');
            } catch (error) {
                console.error('CSV export failed:', error);
                showToast('Błąd podczas eksportu: ' + error.message, 'error');
            }
        });
    }
    
    // Function to initialize admin event listeners after login
    let adminListenersReady = false;

    function initializeAdminEventListeners() {
        // Called on every login; without this guard each login stacked another
        // copy of every listener below.
        if (adminListenersReady) return;
        adminListenersReady = true;

        // Get elements after admin panel is shown
        const addProductBtn = document.getElementById('dodaj-przedmiot-btn');
        const addMethodModal = document.getElementById('add-method-modal');
        const closeMethodBtn = document.getElementById('close-method-modal');
        const methodScraperCard = document.getElementById('method-scraper');
        const methodBulkCard = document.getElementById('method-bulk');
        const addProductModal = document.getElementById('add-product-modal');
        const closeAddProductBtn = document.getElementById('close-add-product');
        
        // Open add product modal directly (no method selection)
        if (addProductBtn) {
            addProductBtn.addEventListener('click', openAddProductModal);
        }

        // Close on overlay click
        if (addProductModal) {
            addProductModal.addEventListener('click', (e) => {
                if (e.target === addProductModal) closeAddProductModal();
            });
        }
        
        // Close method modal
        if (closeMethodBtn) {
            closeMethodBtn.addEventListener('click', () => {
                addMethodModal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            });
        }
        
        // Click outside to close
        if (addMethodModal) {
            addMethodModal.addEventListener('click', (e) => {
                if (e.target === addMethodModal) {
                    closeMethodBtn.click();
                }
            });
        }
        
        // Hover effects for cards
        document.querySelectorAll('.add-method-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
                card.style.background = 'rgba(255,255,255,0.08)';
                card.style.borderColor = 'rgba(255,255,255,0.2)';
                card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.background = 'rgba(255,255,255,0.03)';
                card.style.borderColor = 'rgba(255,255,255,0.1)';
                card.style.boxShadow = 'none';
            });
        });
        
        // Scraper method - opens manual add modal
        if (methodScraperCard) {
            methodScraperCard.addEventListener('click', () => {
                addMethodModal.classList.add('hidden');
                if (addProductModal) {
                    addProductModal.classList.remove('hidden');
                }
            });
        }
        
        // Bulk method - opens import modal
        if (methodBulkCard) {
            methodBulkCard.addEventListener('click', () => {
                addMethodModal.classList.add('hidden');
                const importModal = document.getElementById('import-products-modal');
                if (importModal) {
                    importModal.classList.remove('hidden');
                    document.body.classList.add('modal-open');
                }
            });
        }
        
        // Close add product modal
        if (closeAddProductBtn) {
            closeAddProductBtn.addEventListener('click', () => {
                if (addProductModal) {
                    addProductModal.classList.toggle('hidden');
                }
            });
        }
        
        if (addProductModal) {
            addProductModal.addEventListener('click', (e) => {
                if (e.target === addProductModal) {
                    addProductModal.classList.toggle('hidden');
                }
            });
        }
    }
    
    // Make function available globally
    window.initializeAdminEventListeners = initializeAdminEventListeners;

});


// =========================================
// TRACKING — 111.231.71.230:8082 API
// =========================================
// TRACKING — 111.231.71.230:8082
// Używamy iframe trick: POST przez hidden form → iframe → parsujemy contentDocument
// (serwer nie ma CORS, fetch jest blokowany przez przeglądarkę)
// =========================================

const TRACKING_API = 'http://111.231.71.230:8082';

// Enter na polu trackingu
document.addEventListener('DOMContentLoaded', () => {
    const iqNum = document.getElementById('YQNum');
    if (iqNum) iqNum.addEventListener('keydown', e => { if (e.key === 'Enter') doTrack(); });
});

// Statusy → polskie
const TRACK_STATUS_MAP = {
    'The shipment has been successfully delivered': 'Przesyłka dostarczona ✓',
    'Loaded to movement / tour vehicle': 'Załadowano do pojazdu',
    'Movement / tour vehicle arrived': 'Pojazd dotarł na miejsce',
    'The shipment has been processed in the destination parcel center': 'Przetworzona w centrum docelowym',
    'Unloaded from movement / tour vehicle': 'Rozładowano z pojazdu',
    'The shipment has been processed in the parcel center of origin': 'Przetworzona w centrum nadawczym',
    'Pick-up was successful': 'Odebrano przesyłkę',
    'Pick-up was successful.': 'Odebrano przesyłkę',
    'Customs clearance completed pending scanning': 'Odprawa celna zakończona',
    'Export customs clearance completed': 'Eksportowa odprawa celna zakończona',
    'Flight has arrived': 'Samolot wylądował',
    'Flight has departed': 'Samolot wystartował',
    '拆板中Dismantling the board': 'Rozpakowywanie palety',
    '航班已抵达Flight has arrived': 'Samolot wylądował',
    '航班已起飞Flight has departed': 'Samolot wystartował',
    '清关完成,等待提取Customs clearance completed pending scanning': 'Odprawa celna zakończona',
    '出口清关完成 Export customs clearance completed': 'Eksportowa odprawa celna zakończona',
};

function _track_translateStatus(status) {
    if (!status) return '';
    const t = status.trim();
    if (TRACK_STATUS_MAP[t]) return TRACK_STATUS_MAP[t];
    for (const [key, val] of Object.entries(TRACK_STATUS_MAP)) {
        if (t.includes(key)) return t.replace(key, val);
    }
    return t;
}

function _track_parseDoc(doc) {
    let reference = '', trackingNum = '', destination = '', latestStatus = '', recipient = '';

    // Główny wiersz — li z klasami div_li*
    const liItems = doc.querySelectorAll('.div_li3, .div_li1, .div_li2, .div_li4');
    if (liItems.length >= 4) {
        const texts = Array.from(liItems).map(el => el.textContent.trim().replace(/\s+/g, ' '));
        trackingNum  = texts.find(t => /^[A-Z]{2}\d{6,}/i.test(t)) || '';
        destination  = texts.find(t => /^[A-Z]{2}$/.test(t)) || '';
        latestStatus = texts.find(t => t.length > 15 && t !== trackingNum && t !== destination) || '';
        reference    = texts[0] || '';
    }

    // Odbiorca — szukaj li bez klasy lub ostatni li
    doc.querySelectorAll('li').forEach(li => {
        const cls = li.className || '';
        const txt = li.textContent.trim();
        if (!cls && txt.includes(' ') && txt.length > 3 && txt.length < 50) recipient = txt;
    });

    // Eventy — td z datą YYYY-MM-DD
    const events = [];
    const tds = Array.from(doc.querySelectorAll('td'));
    for (let i = 0; i < tds.length; i++) {
        const cellText = tds[i].textContent.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(cellText)) {
            const date     = cellText;
            const location = tds[i + 1]?.textContent.trim() || '';
            const status   = tds[i + 2]?.textContent.trim() || '';
            if (status || location) {
                events.push({ date, location, status: status || location });
                i += 2; // przeskocz przetworzone komórki
            }
        }
    }

    return { reference, trackingNum, destination, latestStatus, recipient, events };
}

function _track_renderResult(container, data) {
    const { trackingNum, destination, latestStatus, recipient, events } = data;
    const isDelivered = (latestStatus || '').toLowerCase().includes('delivered') || (latestStatus || '').includes('dostarczona');
    const badgeColor  = isDelivered ? '#10b981' : '#a3a3a3';

    const metaParts = [
        trackingNum && `<span><i class="fa-solid fa-barcode"></i> ${trackingNum}</span>`,
        destination && `<span><i class="fa-solid fa-location-dot"></i> ${destination}</span>`,
        recipient   && `<span><i class="fa-solid fa-user"></i> ${recipient}</span>`,
    ].filter(Boolean).join('');

    const eventsHtml = events.length
        ? events.map((ev, i) => `
            <div class="track-event ${i === 0 ? 'track-event--first' : ''}">
                <div class="track-event__dot ${i === 0 ? 'track-event__dot--active' : ''}"></div>
                <div class="track-event__content">
                    <div class="track-event__date">${ev.date}</div>
                    <div class="track-event__status">${_track_translateStatus(ev.status)}</div>
                    ${ev.location ? `<div class="track-event__loc"><i class="fa-solid fa-location-dot"></i> ${ev.location}</div>` : ''}
                </div>
            </div>`).join('')
        : `<p style="text-align:center;color:rgba(255,255,255,0.3);padding:2rem 0">Brak szczegółów przesyłki.</p>`;

    container.innerHTML = `
        <div class="track-result">
            <div class="track-result__header">
                <div class="track-result__badge" style="background:${badgeColor}22;border:1px solid ${badgeColor}55;color:${badgeColor}">
                    <i class="fa-solid fa-circle" style="font-size:0.45rem"></i>
                    ${_track_translateStatus(latestStatus) || 'W drodze'}
                </div>
                ${metaParts ? `<div class="track-result__meta">${metaParts}</div>` : ''}
            </div>
            <div class="track-result__timeline">${eventsHtml}</div>
        </div>`;
}

function doTrack() {
    const input = document.getElementById('YQNum');
    const num   = input ? input.value.trim() : '';
    if (!num) { if (input) input.focus(); return; }

    const container = document.getElementById('YQContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.4);">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;margin-bottom:1rem;display:block;"></i>
            Sprawdzam status przesyłki...
        </div>`;

    // Usuń stary iframe jeśli istnieje
    const oldFrame = document.getElementById('_track_iframe');
    if (oldFrame) oldFrame.remove();
    const oldForm  = document.getElementById('_track_form');
    if (oldForm)  oldForm.remove();

    // Utwórz ukryty iframe jako target dla form POST
    const iframe = document.createElement('iframe');
    iframe.id    = '_track_iframe';
    iframe.name  = '_track_iframe';
    iframe.style.cssText = 'display:none;width:0;height:0;border:none;position:absolute;';
    document.body.appendChild(iframe);

    // Utwórz ukryty form POST
    const form = document.createElement('form');
    form.id     = '_track_form';
    form.method = 'POST';
    form.action = `${TRACKING_API}/trackIndex.htm`;
    form.target = '_track_iframe';
    form.style.cssText = 'display:none;';

    const field = document.createElement('input');
    field.type  = 'hidden';
    field.name  = 'documentCode';
    field.value = num;
    form.appendChild(field);
    document.body.appendChild(form);

    // Timeout — jeśli iframe nie załaduje się w 12s
    const timeout = setTimeout(() => {
        iframe.remove();
        form.remove();
        container.innerHTML = `
            <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">
                <span style="font-size:2rem;display:block;margin-bottom:1rem;">⚠️</span>
                <strong style="color:rgba(255,255,255,0.6);">Brak odpowiedzi serwera</strong><br>
                <small style="margin-top:0.5rem;display:block;opacity:0.6;">Sprawdź czy serwer śledzenia jest dostępny.</small>
            </div>`;
    }, 12000);

    // Gdy iframe załaduje odpowiedź — parsujemy DOM
    iframe.addEventListener('load', () => {
        clearTimeout(timeout);
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            if (!doc || !doc.body) throw new Error('empty_response');

            const data = _track_parseDoc(doc);

            if (!data.events.length && !data.trackingNum) {
                container.innerHTML = `
                    <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">
                        <span style="font-size:2rem;display:block;margin-bottom:1rem;">📦</span>
                        Nie znaleziono przesyłki o numerze <strong style="color:rgba(255,255,255,0.6)">${num}</strong>.
                    </div>`;
            } else {
                _track_renderResult(container, data);
            }
        } catch (err) {
            container.innerHTML = `
                <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">
                    <span style="font-size:2rem;display:block;margin-bottom:1rem;">⚠️</span>
                    <strong style="color:rgba(255,255,255,0.6);">Błąd odczytu odpowiedzi</strong><br>
                    <small style="margin-top:0.5rem;display:block;opacity:0.6;">${err.message}</small>
                </div>`;
        } finally {
            iframe.remove();
            form.remove();
        }
    });

    form.submit();
}
document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetViewId = link.getAttribute('data-view');
        
        // Ukryj wszystkie views
        document.querySelectorAll('.main-view').forEach(v => {
            v.classList.add('hidden');
            v.classList.remove('active');
        });
        
        // Pokaż target view
        const targetView = document.getElementById(targetViewId);
        if(targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
            
            // Scrolluj do góry NOWEGO view
            window.scrollTo(0,0);
        }
    });
});

// Image Search Logic
document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('upload-zone');
    const imageInput = document.getElementById('image-upload-input');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    if(uploadZone && imageInput) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleImageFile(e.dataTransfer.files[0]);
            }
        });

        imageInput.addEventListener('change', function() {
            if(this.files && this.files.length > 0) {
                handleImageFile(this.files[0]);
            }
        });

        // Trigger file input on zone click (except button)
        uploadZone.addEventListener('click', (e) => {
            if(e.target !== document.querySelector('.upload-btn')) {
                imageInput.click();
            }
        });
    }

    function handleImageFile(file) {
        if(!file.type.startsWith('image/')) {
            alert('Proszę wybrać plik graficzny (JPG, PNG).');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            uploadZone.classList.add('hidden');
            previewContainer.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
    
    window.resetImageSearch = function() {
        imageInput.value = '';
        imagePreview.src = '';
        previewContainer.classList.add('hidden');
        uploadZone.classList.remove('hidden');
    }
    
    window.startImageSearch = function() {
        alert('Moduł wyszukiwania sztuczną inteligencją w przygotowaniu! Wersja docelowa połączy się tu z API wyszukiwarki Taobao/1688.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const uploadZone1688 = document.getElementById('upload-zone-1688');
    const imageInput1688 = document.getElementById('image-upload-input-1688');
    const previewContainer1688 = document.getElementById('image-preview-container-1688');
    const imagePreview1688 = document.getElementById('image-preview-1688');
    const resultsContainer = document.getElementById('search-results-1688');

    if(uploadZone1688 && imageInput1688) {
        uploadZone1688.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone1688.classList.add('dragover'); });
        uploadZone1688.addEventListener('dragleave', (e) => { e.preventDefault(); uploadZone1688.classList.remove('dragover'); });
        uploadZone1688.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone1688.classList.remove('dragover');
            if(e.dataTransfer.files && e.dataTransfer.files.length > 0) handleImageFile1688(e.dataTransfer.files[0]);
        });
        
        imageInput1688.addEventListener('change', function() {
            if(this.files && this.files.length > 0) handleImageFile1688(this.files[0]);
        });
        uploadZone1688.addEventListener('click', () => imageInput1688.click());
    }

    function handleImageFile1688(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview1688.src = e.target.result;
            uploadZone1688.classList.add('hidden');
            previewContainer1688.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
        }
        reader.readAsDataURL(file);
    }
    
    window.resetImageSearch1688 = function() {
        imageInput1688.value = '';
        imagePreview1688.src = '';
        previewContainer1688.classList.add('hidden');
        uploadZone1688.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
    }
    
    window.startImageSearch1688 = function() {
        const btn = document.querySelector('.start-search-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Szukanie... <i class="fa-solid fa-spinner fa-spin"></i>';
        
        // Symulacja wysyłania do API 1688 i generowania linków
        setTimeout(() => {
            btn.innerHTML = originalText;
            document.getElementById('search-results-1688').classList.remove('hidden');
            
            // W rzeczywistości tutaj podmienialibyśmy linki na podstawie API:
            document.getElementById('link-kakobuy').onclick = function() { window.open('https://www.kakobuy.com/item/details?url=' + encodeURIComponent('https://detail.1688.com/offer/123456789.html'), '_blank'); };
            document.getElementById('link-wellgobuy').onclick = function() { window.open('https://www.wellgobuy.com/item/details?url=' + encodeURIComponent('https://detail.1688.com/offer/123456789.html'), '_blank'); };
        }, 1500);
    }
});
// Old translation system removed - now using translations.js with data-i18n attributes

    // Template Import Logic Simulation
    const importRefreshBtn = document.getElementById('import-refresh-btn');
    const importStartBtn = document.getElementById('import-start-btn');
    const processingTracker = document.getElementById('processing-tracker');
    const processingBar = document.getElementById('processing-bar');
    const importUrlInput = document.getElementById('import-url');
    const productsTbody = document.getElementById('admin-products-tbody');
    
    // Returns a 2D array of rows, NOT products. Named distinctly because a
    // function declaration in a block still leaks to global scope in sloppy
    // mode, and calling this "parseCSV" silently overrode the products
    // parser from bulk-import.js, breaking CSV file import.
    function parseSheetCSVRows(str) {
        const arr = [];
        let quote = false;
        let col = 0, row = 0;
        for (let c = 0; c < str.length; c++) {
            let cc = str[c], nc = str[c+1];
            arr[row] = arr[row] || [];
            arr[row][col] = arr[row][col] || '';
            if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
            if (cc == '"') { quote = !quote; continue; }
            if (cc == ',' && !quote) { ++col; continue; }
            if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
            if (cc == '\n' && !quote) { ++row; col = 0; continue; }
            if (cc == '\r' && !quote) { ++row; col = 0; continue; }
            arr[row][col] += cc;
        }
        return arr;
    }

    async function startImportProcess(e) {
        if(e) e.preventDefault();
        const urlValue = importUrlInput.value.trim();
        if (urlValue === '') {
            alert('Wklej link do Google Sheets!');
            return;
        }
        
        if(processingTracker) processingTracker.classList.remove('hidden');
        if (processingBar) processingBar.style.width = '10%';
        
        // 1. Fetch CSV
        let productsToAdd = [];
        try {
            const sheetIdMatch = urlValue.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if(!sheetIdMatch) {
                alert('Nieprawidłowy link Google Sheets!');
                if (processingTracker) processingTracker.classList.add('hidden');
                return;
            }
            const sheetId = sheetIdMatch[1];
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            
            const response = await fetch(csvUrl);
            if(!response.ok) throw new Error('Brak dostępu. Upewnij się, że arkusz jest publiczny ("Każdy mający link").');
            
            const csvText = await response.text();
            const rows = parseSheetCSVRows(csvText);
            
            // Skip header
            for(let i=1; i<rows.length; i++) {
                const row = rows[i];
                if(!row || row.length < 1) continue;
                
                let linkColIndex = -1;
                let link = '';
                for(let j=0; j<row.length; j++) {
                    const cell = row[j] ? row[j].trim() : '';
                    const cellLower = cell.toLowerCase();
                    // Detect typical rep domains or http
                    if(cellLower.includes('http') || cellLower.includes('weidian.com') || cellLower.includes('taobao.com') || cellLower.includes('1688.com') || cellLower.includes('yupoo.com') || cellLower.includes('tmall.com') || cellLower.includes('pinduoduo.com')) {
                        linkColIndex = j;
                        link = cell;
                        if (!link.startsWith('http')) {
                            link = 'https://' + link;
                        }
                        break;
                    }
                }
                
                if(linkColIndex === -1) continue;
                
                let name = '';
                for(let j=0; j<row.length; j++) {
                    if(j !== linkColIndex && row[j] && row[j].trim() !== '') {
                        name = row[j].trim();
                        break;
                    }
                }
                
                if(!name) name = 'Produkt ' + i;
                
                if(link) {
                    productsToAdd.push({ name, link });
                }
            }
            
        } catch(error) {
            console.error(error);
            alert('Błąd pobierania danych: ' + error.message + '\n(Upewnij się, że plik ma uprawnienia: "Każdy mający link może wyświetlać")');
            if (processingTracker) processingTracker.classList.add('hidden');
            return;
        }
        
        if(productsToAdd.length === 0) {
            alert('Nie znaleziono żadnych produktów z linkami w tym arkuszu!');
            if (processingTracker) processingTracker.classList.add('hidden');
            return;
        }
        
        // Update Tracker Text
        const trackerH4 = processingTracker.querySelector('h4');
        if(trackerH4) trackerH4.innerHTML = `<i class="fa-solid fa-box-open" style="color: #d97706;"></i> Processing: 0 / ${productsToAdd.length}`;
        
        // 2. Determine Agent & Category
        let activeAgent = 'Kakobuy';
        const agentOptions = document.querySelectorAll('.settings-section .settings-option');
        agentOptions.forEach(opt => {
            if(opt.classList.contains('active')) {
                const text = opt.innerText.trim();
                if(text.includes('Kakobuy')) activeAgent = 'Kakobuy';
                if(text.includes('WellGoBuy')) activeAgent = 'WellGoBuy';
            }
        });
        
        let domain = 'kakobuy.com';
        if(activeAgent === 'WellGoBuy') domain = 'wellgobuy.com';
        
        // Get category from modal
        let selectedCategory = 'Accessories';
        const categorySelects = document.querySelectorAll('#add-product-modal select');
        if(categorySelects.length > 1) {
            selectedCategory = categorySelects[1].value;
        }
        
        // 3. Process Products iteratively to animate
        let progress = 10;
        let processedCount = 0;
        
        if (window.importInterval) clearInterval(window.importInterval);
        
        if (productsTbody) productsTbody.innerHTML = '';
        
        window.importInterval = setInterval(() => {
            if (processedCount >= productsToAdd.length) {
                clearInterval(window.importInterval);
                setTimeout(() => {
                    const modal = document.getElementById('add-product-modal');
                    if(modal) modal.classList.add('hidden');
                }, 500);
                return;
            }
            
            // Add 1 product per tick
            const p = productsToAdd[processedCount];
            let affParam = activeAgent === 'Kakobuy' ? '&affcode=truskawka' : '&promoteCode=977Pkqgka';
            const finalLink = `https://${domain}/item/details?url=${encodeURIComponent(p.link)}${affParam}`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="product-cell">
                        <div class="product-img-mock"><i class="fa-solid fa-box"></i></div>
                        <div>
                            <strong>${p.name}</strong>
                            <span class="product-id">#NEW</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-outline">${selectedCategory}</span></td>
                <td>$0.00</td>
                <td><span class="badge badge-success"><i class="fa-solid fa-check-circle"></i> In Stock</span></td>
                <td>0</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" title="Edytuj"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn" title="Kopiuj link (${activeAgent})" onclick="prompt('Affiliate Link:', '${finalLink}')"><i class="fa-solid fa-link"></i></button>
                        <button class="action-btn danger" title="Usuń" onclick="this.closest('tr').remove()"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            if (productsTbody) productsTbody.appendChild(tr);
            
            processedCount++;
            progress = 10 + (90 * (processedCount / productsToAdd.length));
            if (processingBar) processingBar.style.width = Math.min(progress, 100) + '%';
            if (trackerH4) trackerH4.innerHTML = `<i class="fa-solid fa-box-open" style="color: #d97706;"></i> Processing: ${processedCount} / ${productsToAdd.length}`;
            
        }, 100); // add one product every 100ms
    }
    
    if (importRefreshBtn) importRefreshBtn.addEventListener('click', startImportProcess);
    if (importStartBtn) importStartBtn.addEventListener('click', startImportProcess);

    // Import Modal Buttons Toggle Logic
    const methodBtns = document.querySelectorAll('.import-method-btn');
    const modeBtns = document.querySelectorAll('.import-mode-btn');

    methodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            methodBtns.forEach(b => {
                b.style.background = 'rgba(255,255,255,0.03)';
                b.style.border = '1px solid rgba(255,255,255,0.05)';
                b.classList.remove('active');
            });
            btn.style.background = 'rgba(255, 255, 255,0.15)';
            btn.style.border = '1px solid #ffffff';
            btn.classList.add('active');
        });
    });

    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modeBtns.forEach(b => {
                b.style.background = 'rgba(255,255,255,0.03)';
                b.style.border = '1px solid rgba(255,255,255,0.05)';
                b.classList.remove('active');
            });
            btn.style.background = 'rgba(255, 255, 255,0.15)';
            btn.style.border = '1px solid #ffffff';
            btn.classList.add('active');
        });
    });


// ==========================================
// ADMIN PANEL - PRODUCTS MANAGEMENT
// ==========================================

// Product Data Store (Supabase with localStorage fallback)
const PRODUCTS_LS_KEY = 'products';

// supabase-client-fixed.js may fail to load (offline, blocked CDN, 404).
// Its helpers are plain globals, so their absence must not throw a
// ReferenceError deep inside an export or a save.
function isProductDbAvailable() {
    return typeof getProductsFromDB === 'function';
}

// ---- Produkty próbne (puste domyślnie) ----
const SAMPLE_PRODUCTS = [];

function readLocalProducts() {
    try {
        const raw = localStorage.getItem(PRODUCTS_LS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const items = Array.isArray(parsed) ? parsed : [];
        return items.filter(p => !p.id || !String(p.id).startsWith('demo-'));
    } catch (error) {
        console.warn('Uszkodzona lokalna kopia produktów.', error);
        return [];
    }
}

function writeLocalProducts(products) {
    try {
        localStorage.setItem(PRODUCTS_LS_KEY, JSON.stringify(products));
    } catch (error) {
        console.warn('Nie udało się zapisać lokalnej kopii produktów.', error);
    }
}

async function getProducts() {
    if (isProductDbAvailable()) {
        try {
            const rows = await getProductsFromDB();
            if (Array.isArray(rows) && rows.length > 0) {
                // Keep a local mirror so exports still work when the DB is down.
                writeLocalProducts(rows);
                return rows;
            }
        } catch (error) {
            console.warn('Baza niedostępna, korzystam z lokalnej kopii.', error);
        }
    } else {
        console.warn('Klient Supabase nie został wczytany — korzystam z lokalnej kopii produktów.');
    }

    return readLocalProducts();
}

async function saveProducts(products) {
    // Bulk mirror only. Single-record writes go through saveProductToDB /
    // updateProductInDB so the database stays authoritative.
    writeLocalProducts(products);
}

// Admin Products Filters
const adminProductsView = document.getElementById('view-products');
if (adminProductsView) {
    const searchInput = adminProductsView.querySelector('.admin-search-bar input');
    const categorySelect = adminProductsView.querySelector('.custom-select:nth-child(2) select');
    const statusSelect = adminProductsView.querySelector('.custom-select:nth-child(3) select');
    
    let filterTimeout;
    
    const applyAdminFilters = () => {
        const filters = {
            search: searchInput?.value || '',
            category: categorySelect?.value || 'all',
            status: statusSelect?.value || 'all'
        };
        loadAdminProducts(filters);
    };
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(applyAdminFilters, 300);
        });
    }
    
    if (categorySelect) {
        categorySelect.addEventListener('change', applyAdminFilters);
    }
    
    if (statusSelect) {
        statusSelect.addEventListener('change', applyAdminFilters);
    }
}

// ---- Automatic category from the product name -------------------------
// The category select stays fully editable; once the admin picks a value
// by hand we stop overwriting it.
let productCategoryTouched = false;

function markProductCategoryManual() {
    productCategoryTouched = true;
    const badge = document.getElementById('product-category-auto');
    if (badge) {
        badge.dataset.state = 'manual';
        badge.textContent = 'ręcznie';
    }
}

function applyAutoCategory() {
    if (productCategoryTouched) return;

    const nameInput = document.getElementById('product-name');
    const select = document.getElementById('product-category');
    const badge = document.getElementById('product-category-auto');
    if (!nameInput || !select) return;

    if (typeof detectCategoryLabel !== 'function') {
        // categoryHelper.js missing — leave the select alone rather than guessing.
        return;
    }

    const label = detectCategoryLabel(nameInput.value);
    if (!label) {
        select.value = '';
        if (badge) {
            badge.dataset.state = 'idle';
            badge.textContent = 'auto';
        }
        return;
    }

    // Only assign when the label exists as an option.
    const hasOption = Array.from(select.options).some(o => o.value === label);
    if (!hasOption) return;

    select.value = label;
    if (badge) {
        badge.dataset.state = 'applied';
        badge.textContent = 'auto';
    }
}

function resetAutoCategoryState() {
    productCategoryTouched = false;
    const badge = document.getElementById('product-category-auto');
    if (badge) {
        badge.dataset.state = 'idle';
        badge.textContent = 'auto';
    }
}

// Open Add Product Modal
function openAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (!modal) {
        console.error('Brak modalu #add-product-modal w dokumencie.');
        return;
    }
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');

    resetAutoCategoryState();

    const firstField = document.getElementById('product-name');
    if (firstField) firstField.focus();
}
window.openAddProductModal = openAddProductModal;

// Close Add Product Modal
function closeAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('modal-open');

    const form = document.getElementById('add-product-form');
    if (form) form.reset();

    resetAutoCategoryState();
}
window.closeAddProductModal = closeAddProductModal;

// Wire the auto-category behaviour once the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('product-name');
    const categorySelect = document.getElementById('product-category');

    if (nameInput) nameInput.addEventListener('input', applyAutoCategory);
    if (categorySelect) categorySelect.addEventListener('change', markProductCategoryManual);
});

// Add Product
async function addProduct(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('add-product-submit');
    const price = parseFloat(document.getElementById('product-price').value);

    if (!isFinite(price) || price < 0) {
        showToast('Podaj poprawną cenę', 'error');
        return;
    }

    const newProduct = {
        id: Date.now().toString(),
        name: document.getElementById('product-name').value.trim(),
        price: price,
        // CNY is the base currency; display conversion happens in convertPrice()
        // using the currency chosen in site settings, so prices are stored raw.
        currency: 'CNY',
        image: document.getElementById('product-image').value.trim(),
        category: document.getElementById('product-category').value,
        link: document.getElementById('product-link').value.trim(),
        status: document.getElementById('product-status')?.value || 'active',
        popular: document.getElementById('product-popular')?.checked || false,
        clicks: 0
    };

    // Guard against a double submit while the request is in flight.
    if (submitBtn) submitBtn.disabled = true;

    try {
        let saved = null;

        if (typeof saveProductToDB === 'function') {
            saved = await saveProductToDB(newProduct);
        } else {
            console.warn('Klient Supabase niedostępny — zapisuję produkt lokalnie.');
        }

        // Always mirror locally so the product survives a DB outage and
        // still shows up in the table and in the CSV export.
        const local = readLocalProducts();
        local.unshift(saved || newProduct);
        writeLocalProducts(local);

        closeAddProductModal();
        await loadAdminProducts();
        if (typeof loadProductsGrid === 'function') loadProductsGrid();

        showToast(
            saved ? 'Produkt dodany pomyślnie' : 'Produkt zapisany lokalnie (baza niedostępna)',
            saved ? 'success' : 'warning'
        );
    } catch (error) {
        console.error('Add product failed:', error);
        showToast('Błąd podczas dodawania produktu: ' + error.message, 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// Admin Filter State & Handlers
let adminFilterState = {
    category: 'all',
    batch: 'all',
    status: 'all',
    sort: 'pinned',
    search: ''
};

window.setAdminFilterPill = function(type, value, element) {
    adminFilterState[type] = value;

    if (element && element.parentNode) {
        element.parentNode.querySelectorAll('.admin-pill').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
    }

    loadAdminProducts();
};

window.handleAdminFilterChange = function() {
    const searchInput = document.getElementById('admin-search-input');
    const sortSelect = document.getElementById('admin-sort-select');

    if (searchInput) adminFilterState.search = searchInput.value.trim().toLowerCase();
    if (sortSelect) adminFilterState.sort = sortSelect.value;

    loadAdminProducts();
};

// Category Synonyms Mapping for Polish/English Filtering
const CATEGORY_SYNONYMS = {
    'shoes': ['shoes', 'buty', 'sneakers', 'obuwia', 'obudowe', 'shoe', 'footwear', 'dunk', 'jordan'],
    'hoodies': ['hoodies', 'bluzy', 'bluza', 'swetry', 'sweter', 'hoodie', 'sweater', 'crewneck', 'zip', 'kaptur'],
    't-shirts': ['t-shirts', 't-shirt', 'koszulki', 'koszulka', 'tshirt', 'tee', 'polo', 'top'],
    'pants': ['pants', 'spodnie', 'jeansy', 'jeans', 'dresy', 'joggers', 'sweatpants', 'trousers', 'denim'],
    'shorts': ['shorts', 'spodenki', 'szorty'],
    'jackets': ['jackets', 'kurtki', 'kurtka', 'płaszcze', 'płaszcz', 'jacket', 'coat', 'vest', 'puffer', 'windbreaker'],
    'longsleeve': ['longsleeve', 'long sleeve', 'long-sleeve', 'ls tee'],
    'sets': ['sets', 'zestawy', 'odzież sportowa', 'dresy', 'dres', 'tracksuit', 'set', 'co-ord'],
    'electronics': ['electronics', 'elektronika', 'sprzęt', 'airpods', 'gadget', 'tech'],
    'headwear': ['headwear', 'czapki', 'czapka', 'nakrycia głowy', 'hat', 'cap', 'beanie', 'beret'],
    'bags-backpacks': ['bags-backpacks', 'torby', 'torba', 'plecaki', 'plecak', 'bag', 'backpack', 'tote', 'sack'],
    'belts': ['belts', 'paski', 'pasek', 'belt'],
    'accessories': ['accessories', 'akcesoria', 'bielizna', 'biżuteria', 'zegarki', 'okulary', 'etui', 'socks', 'skarpety', 'scarf', 'wallet', 'portfel', 'łańcuszek', 'bransoletka']
};

function categoryMatchesFilter(productCategory, filterVal) {
    if (!filterVal || filterVal === 'all') return true;
    if (!productCategory) return false;
    
    const pCatLower = String(productCategory).trim().toLowerCase();
    const filterLower = String(filterVal).trim().toLowerCase();

    if (pCatLower === filterLower) return true;

    const synonyms = CATEGORY_SYNONYMS[filterLower];
    if (synonyms) {
        return synonyms.some(syn => pCatLower.includes(syn) || syn.includes(pCatLower));
    }

    return pCatLower.includes(filterLower) || filterLower.includes(pCatLower);
}

// Load Products in Admin Table
async function loadAdminProducts() {
    let products = await getProducts();
    const tbody = document.getElementById('admin-products-tbody');
    const countNumber = document.getElementById('admin-count-number');
    
    if (!tbody) return;
    
    // Apply search filter
    if (adminFilterState.search) {
        const query = adminFilterState.search;
        products = products.filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.category && p.category.toLowerCase().includes(query)) ||
            (p.tags && Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(query)))
        );
    }
    
    // Apply category filter (with Polish synonym matching)
    if (adminFilterState.category && adminFilterState.category !== 'all') {
        products = products.filter(p => categoryMatchesFilter(p.category, adminFilterState.category));
    }
    
    // Apply batch tag filter
    if (adminFilterState.batch && adminFilterState.batch !== 'all') {
        const batchFilter = adminFilterState.batch.toLowerCase();
        products = products.filter(p => {
            const pBatch = String(p.batch || '').toLowerCase();
            const pTags = Array.isArray(p.tags) ? p.tags.map(t => String(t).toLowerCase()) : [];
            const pName = String(p.name || '').toLowerCase();

            if (batchFilter === 'popular') return p.popular || p.is_popular || pTags.includes('popular') || (p.clicks > 50);
            if (batchFilter === 'best') return pBatch === 'best' || pTags.includes('best') || pName.includes('best');
            if (batchFilter === 'budget') return pBatch === 'budget' || pTags.includes('budget') || (parseFloat(p.price) < 100);
            if (batchFilter === 'random') return pBatch === 'random' || pTags.includes('random');
            
            return pBatch === batchFilter || pTags.includes(batchFilter) || pName.includes(batchFilter);
        });
    }
    
    // Apply status filter
    if (adminFilterState.status && adminFilterState.status !== 'all') {
        if (adminFilterState.status === 'pinned') {
            products = products.filter(p => p.pinned || p.is_pinned || p.popular);
        } else if (adminFilterState.status === 'normal') {
            products = products.filter(p => !(p.pinned || p.is_pinned || p.popular));
        }
    }

    // Apply sorting
    if (adminFilterState.sort === 'price-asc') {
        products.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (adminFilterState.sort === 'price-desc') {
        products.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (adminFilterState.sort === 'clicks-desc') {
        products.sort((a, b) => (parseInt(b.clicks) || 0) - (parseInt(a.clicks) || 0));
    } else if (adminFilterState.sort === 'name-asc') {
        products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    if (countNumber) {
        countNumber.textContent = products.length;
    }
    
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">Brak produktów spełniających kryteria.</td></tr>';
        return;
    }
    
    products.forEach((product, index) => {
        const row = document.createElement('tr');
        row.draggable = true;
        row.dataset.id = product.id;
        row.dataset.index = index;

        row.innerHTML = `
            <td style="text-align: center; cursor: grab;" class="drag-handle-cell" title="Przesuń, aby zmienić kolejność">
                <i class="fa-solid fa-grip-vertical drag-handle" style="color: var(--text-muted); font-size: 1.1rem;"></i>
            </td>
            <td style="text-align: center;">
                <input type="checkbox" class="product-select-checkbox" value="${product.id}" onchange="updateProductSelectionHeader()" style="cursor: pointer; width: 16px; height: 16px; accent-color: #ffffff;">
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                    <span>${product.name}</span>
                </div>
            </td>
            <td><span class="badge">${product.category}</span></td>
            <td>${product.price} ${product.currency}</td>
            <td><span class="status-badge status-${product.status}">${product.status === 'active' ? 'In Stock' : 'Dead Link'}</span></td>
            <td>${product.clicks || 0}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="icon-btn" onclick="editProduct('${product.id}')" title="Edytuj"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn" onclick="deleteProduct('${product.id}')" title="Usuń"><i class="fa-solid fa-trash"></i></button>
                    <a href="${product.link}" target="_blank" class="icon-btn" title="Otwórz link"><i class="fa-solid fa-external-link"></i></a>
                </div>
            </td>
        `;

        // Attach drag & drop events
        row.addEventListener('dragstart', handleAdminRowDragStart);
        row.addEventListener('dragover', handleAdminRowDragOver);
        row.addEventListener('drop', handleAdminRowDrop);
        row.addEventListener('dragend', handleAdminRowDragEnd);

        tbody.appendChild(row);
    });
    
    // Reset selection header state
    if (typeof updateProductSelectionHeader === 'function') updateProductSelectionHeader();

    // Update stats
    updateDashboardStats();
}

// Multi-select Checkbox Helpers
window.toggleSelectAllProducts = function(masterCheckbox) {
    const checkboxes = document.querySelectorAll('.product-select-checkbox');
    checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
    updateProductSelectionHeader();
};

window.updateProductSelectionHeader = function() {
    const checkboxes = document.querySelectorAll('.product-select-checkbox');
    const checked = document.querySelectorAll('.product-select-checkbox:checked');
    const master = document.getElementById('select-all-products');
    const bar = document.getElementById('bulk-actions-bar');
    const countEl = document.getElementById('selected-count');

    if (master) {
        master.checked = checkboxes.length > 0 && checked.length === checkboxes.length;
        master.indeterminate = checked.length > 0 && checked.length < checkboxes.length;
    }

    if (bar && countEl) {
        if (checked.length > 0) {
            bar.style.display = 'flex';
            countEl.textContent = checked.length;
        } else {
            bar.style.display = 'none';
        }
    }
};

window.bulkDeleteSelectedProducts = async function() {
    const checked = Array.from(document.querySelectorAll('.product-select-checkbox:checked')).map(cb => cb.value);
    if (checked.length === 0) return;
    if (!confirm(`Czy na pewno chcesz usunąć ${checked.length} zaznaczonych produktów?`)) return;

    for (const id of checked) {
        if (typeof deleteProductFromDB === 'function') {
            try { await deleteProductFromDB(id); } catch(e) {}
        }
    }
    const local = readLocalProducts().filter(p => !checked.includes(String(p.id)));
    writeLocalProducts(local);

    showToast(`Usunięto ${checked.length} produktów`, 'success');
    await loadAdminProducts();
};

// Drag & Drop Reordering Logic
let adminDraggedRow = null;

function handleAdminRowDragStart(e) {
    adminDraggedRow = this;
    e.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging-row');
    this.style.opacity = '0.5';
    this.style.background = 'rgba(139, 92, 246, 0.15)';
}

function handleAdminRowDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const targetRow = this;
    if (targetRow && targetRow !== adminDraggedRow && targetRow.tagName === 'TR') {
        const tbody = targetRow.parentNode;
        const rows = Array.from(tbody.children);
        const draggedIndex = rows.indexOf(adminDraggedRow);
        const targetIndex = rows.indexOf(targetRow);

        if (draggedIndex < targetIndex) {
            tbody.insertBefore(adminDraggedRow, targetRow.nextSibling);
        } else {
            tbody.insertBefore(adminDraggedRow, targetRow);
        }
    }
    return false;
}

function handleAdminRowDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    return false;
}

async function handleAdminRowDragEnd(e) {
    this.classList.remove('dragging-row');
    this.style.opacity = '1';
    this.style.background = '';

    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    const newOrderIds = Array.from(tbody.children).map(r => r.dataset.id).filter(Boolean);
    const allProducts = await getProducts();

    const orderedProducts = [];
    newOrderIds.forEach(id => {
        const prod = allProducts.find(p => String(p.id) === String(id));
        if (prod) orderedProducts.push(prod);
    });
    allProducts.forEach(prod => {
        if (!newOrderIds.includes(String(prod.id))) orderedProducts.push(prod);
    });

    writeLocalProducts(orderedProducts);
    showToast('Zapisano nową kolejność produktów', 'info');
}


// Update Dashboard Stats
async function updateDashboardStats() {
    const products = await getProducts();
    
    // Real visit data from localStorage
    const visits = getVisitData();
    const totalVisits = Object.values(visits).reduce((sum, dayData) => {
        return sum + Object.values(dayData).reduce((s, c) => s + c, 0);
    }, 0);
    const totalUsers = Math.round(totalVisits * 0.75);
    
    // Update products count
    const productsCountEl = document.querySelector('.stat-card:nth-child(3) .stat-value');
    if (productsCountEl) {
        productsCountEl.textContent = products.length.toLocaleString();
    }
    
    // Update real visits
    const visitsCountEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
    if (visitsCountEl) {
        visitsCountEl.textContent = totalVisits.toLocaleString();
    }
    
    // Update estimated unique users
    const usersCountEl = document.querySelector('.stat-card:nth-child(2) .stat-value');
    if (usersCountEl) {
        usersCountEl.textContent = totalUsers.toLocaleString();
    }
}

// Reset all visit statistics (callable from admin UI)
window.resetVisitStats = function() {
    if (confirm('Na pewno chcesz wyzerować wszystkie statystyki wejść?')) {
        localStorage.removeItem('itemfinder_visits');
        updateDashboardStats();
        if (typeof updateChartForPeriod === 'function') updateChartForPeriod(currentPeriod || 'week');
        if (typeof showToast === 'function') showToast('Statystyki wejść zostały wyzerowane', 'success');
    }
};



// Chart Period Management
let currentPeriod = 'day';

function initChartPeriods() {
    const periodBtns = document.querySelectorAll('.period-btn');
    const customPicker = document.getElementById('custom-period-picker');
    const applyBtn = document.getElementById('apply-custom-period');
    
    if (!periodBtns.length) return;
    
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const period = btn.dataset.period;
            
            // Update active state
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide custom picker
            if (period === 'custom') {
                customPicker?.classList.remove('hidden');
            } else {
                customPicker?.classList.add('hidden');
                currentPeriod = period;
                updateChartForPeriod(period);
            }
        });
    });
    
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const startDate = document.getElementById('period-start')?.value;
            const endDate = document.getElementById('period-end')?.value;
            
            if (!startDate || !endDate) {
                showToast('Wybierz daty początkową i końcową', 'error');
                return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                showToast('Data początkowa nie może być późniejsza niż końcowa', 'error');
                return;
            }
            
            currentPeriod = 'custom';
            updateChartForPeriod('custom', startDate, endDate);
            showToast('Okres zaktualizowany', 'success');
        });
    }
}

function updateChartForPeriod(period, startDate = null, endDate = null) {
    console.log(`Chart updated for period: ${period}`, { startDate, endDate });
    
    const periodText = period === 'day' ? 'dzień' : 
                      period === 'week' ? 'tydzień' : 
                      period === 'month' ? 'miesiąc' : 
                      'własny okres';
    
    // Update chart title
    const chartHeader = document.querySelector('.chart-header h3');
    if (chartHeader) {
        chartHeader.textContent = `Wizyty strony - ${periodText}`;
    }
    
    // Generate data based on period
    let chartData;
    
    switch(period) {
        case 'day':
            // 24 hours data
            chartData = generateDayData();
            break;
        case 'week':
            // 7 days data
            chartData = generateWeekData();
            break;
        case 'month':
            // 4 weeks data
            chartData = generateMonthData();
            break;
        case 'custom':
            // Custom range data
            chartData = generateCustomData(startDate, endDate);
            break;
    }
    
    // Update the chart
    updateChartVisuals(chartData);
}

// Generate data for day view — real data from localStorage by hour
function generateDayData() {
    const visits = getVisitData();
    const today = new Date().toISOString().split('T')[0];
    const dayData = visits[today] || {};
    const hourSlots = [
        { label: '00:00', hours: [0, 1, 2] },
        { label: '03:00', hours: [3, 4, 5] },
        { label: '06:00', hours: [6, 7, 8] },
        { label: '09:00', hours: [9, 10, 11] },
        { label: '12:00', hours: [12, 13, 14] },
        { label: '15:00', hours: [15, 16, 17] },
        { label: '18:00', hours: [18, 19, 20] },
        { label: '21:00', hours: [21, 22, 23] }
    ];
    return hourSlots.map(slot => {
        const v = slot.hours.reduce((s, h) => s + (dayData[h] || 0), 0);
        return { label: slot.label, visits: v, users: Math.round(v * 0.75), products: Math.round(v * 0.4) };
    });
}

// Generate data for week view — real data from localStorage, last 7 days
function generateWeekData() {
    const visits = getVisitData();
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayData = visits[key] || {};
        const v = Object.values(dayData).reduce((s, c) => s + c, 0);
        data.push({ label: `${day}.${month}`, visits: v, users: Math.round(v * 0.75), products: Math.round(v * 0.4) });
    }
    return data;
}

// Generate data for month view — real data from localStorage, last 30 days (15 points × 2 days)
function generateMonthData() {
    const visits = getVisitData();
    const data = [];
    const today = new Date();
    for (let i = 14; i >= 0; i--) {
        const date1 = new Date(today);
        date1.setDate(date1.getDate() - (i * 2));
        const date2 = new Date(date1);
        date2.setDate(date2.getDate() + 1);
        const key1 = date1.toISOString().split('T')[0];
        const key2 = date2.toISOString().split('T')[0];
        const day = String(date1.getDate()).padStart(2, '0');
        const month = String(date1.getMonth() + 1).padStart(2, '0');
        const v1 = Object.values(visits[key1] || {}).reduce((s, c) => s + c, 0);
        const v2 = Object.values(visits[key2] || {}).reduce((s, c) => s + c, 0);
        const v = v1 + v2;
        data.push({ label: `${day}.${month}`, visits: v, users: Math.round(v * 0.75), products: Math.round(v * 0.4) });
    }
    return data;
}

// Generate data for custom period — real data from localStorage
function generateCustomData(startDate, endDate) {
    const visits = getVisitData();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    function dateKey(d) { return d.toISOString().split('T')[0]; }
    function dayVisits(d) { return Object.values(visits[dateKey(d)] || {}).reduce((s, c) => s + c, 0); }

    if (daysDiff <= 14) {
        const data = [];
        for (let i = 0; i < daysDiff; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const v = dayVisits(date);
            data.push({ label: `${day}.${month}`, visits: v, users: Math.round(v * 0.75), products: Math.round(v * 0.4) });
        }
        return data;
    } else if (daysDiff <= 90) {
        const weeks = Math.ceil(daysDiff / 7);
        const data = [];
        for (let i = 0; i < weeks; i++) {
            const weekStart = new Date(start);
            weekStart.setDate(weekStart.getDate() + (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            if (weekEnd > end) weekEnd.setTime(end.getTime());
            const startDay = String(weekStart.getDate()).padStart(2, '0');
            const startMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
            const endDay = String(weekEnd.getDate()).padStart(2, '0');
            const endMonth = String(weekEnd.getMonth() + 1).padStart(2, '0');
            let v = 0;
            for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) v += dayVisits(d);
            data.push({ label: `${startDay}.${startMonth}-${endDay}.${endMonth}`, visits: v, users: Math.round(v * 0.75), products: Math.round(v * 0.4) });
        }
        return data;
    } else {
        const months = Math.ceil(daysDiff / 30);
        const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
        const data = [];
        for (let i = 0; i < months; i++) {
            const monthStart = new Date(start);
            monthStart.setMonth(monthStart.getMonth() + i);
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            if (monthEnd > end) monthEnd.setTime(end.getTime());
            let v = 0;
            for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) v += dayVisits(d);
            data.push({ label: monthNames[monthStart.getMonth()], visits: v, users: Math.round(v * 0.75), products: Math.round(v * 0.4) });
        }
        return data;
    }
}


const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(name, attrs) {
    const el = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
}

// Round an axis maximum up to a readable step (1/2/5 x 10^n) so gridline
// labels are round numbers instead of arbitrary data values.
function niceAxisMax(value) {
    if (!isFinite(value) || value <= 0) return 10;
    const exp = Math.floor(Math.log10(value));
    const pow = Math.pow(10, exp);
    const frac = value / pow;
    const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
    return niceFrac * pow;
}

function formatCompactNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
    return String(Math.round(n));
}

// Update chart visuals with new data
function updateChartVisuals(data) {
    const svg = document.querySelector('.line-chart');
    if (!svg || !Array.isArray(data) || data.length === 0) return;

    const width = 800;
    const height = 260;
    const padding = { left: 54, right: 24, top: 24, bottom: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Headroom so the peak never touches the top edge.
    const dataMax = Math.max(...data.map(d => d.visits));
    const axisMax = niceAxisMax(dataMax * 1.15) || 10;

    const xFor = (i) => data.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (i * chartWidth) / (data.length - 1);
    const yFor = (v) => padding.top + chartHeight - (v / axisMax) * chartHeight;

    const points = data.map((d, i) => ({ x: xFor(i), y: yFor(d.visits), ...d }));

    // ---- grid + axis labels ----
    let grid = svg.querySelector('.chart-grid');
    if (!grid) {
        grid = svgEl('g', { class: 'chart-grid' });
        svg.insertBefore(grid, svg.firstChild);
    }
    grid.textContent = '';

    const TICKS = 4;
    for (let t = 0; t <= TICKS; t++) {
        const value = (axisMax / TICKS) * t;
        const y = yFor(value);

        grid.appendChild(svgEl('line', {
            x1: padding.left, y1: y,
            x2: padding.left + chartWidth, y2: y,
            stroke: t === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
            'stroke-width': 1
        }));

        const label = svgEl('text', {
            x: padding.left - 12, y: y + 4,
            'text-anchor': 'end', 'font-size': 10,
            fill: '#5a5a63', 'font-weight': 500
        });
        label.textContent = formatCompactNumber(value);
        grid.appendChild(label);
    }

    // ---- line + area ----
    const linePath = svg.querySelector('.line-path');
    const areaPath = svg.querySelector('.line-area');
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

    if (linePath) linePath.setAttribute('d', d);
    if (areaPath) {
        const baseY = padding.top + chartHeight;
        areaPath.setAttribute('d',
            `${d} L ${points[points.length - 1].x.toFixed(2)} ${baseY} L ${points[0].x.toFixed(2)} ${baseY} Z`);
    }

    // ---- rebuild dynamic layers ----
    svg.querySelectorAll('.chart-labels-group, .chart-points-group').forEach(el => el.remove());

    // Thin out X labels so they never overlap on long ranges.
    const step = Math.max(1, Math.ceil(points.length / 12));
    const labels = svgEl('g', { class: 'chart-labels-group' });
    points.forEach((p, i) => {
        if (i % step !== 0 && i !== points.length - 1) return;
        const text = svgEl('text', {
            class: 'chart-label',
            x: p.x, y: padding.top + chartHeight + 22,
            'text-anchor': 'middle', 'font-size': 10,
            fill: '#6b6b73', 'font-weight': 500
        });
        text.textContent = p.label;
        labels.appendChild(text);
    });
    svg.appendChild(labels);

    const dots = svgEl('g', { class: 'chart-points-group' });
    points.forEach(p => {
        dots.appendChild(svgEl('circle', {
            class: 'chart-dot', cx: p.x, cy: p.y, r: 2.5,
            fill: '#0f0f12', stroke: '#8b8b93', 'stroke-width': 1.5
        }));
    });
    svg.appendChild(dots);

    initInteractiveChart(points, padding, chartHeight);
}

// Initialize interactive chart with continuous hover tracking and interpolation
function initInteractiveChart(points, padding, chartHeight) {
    const svg = document.querySelector('.line-chart');
    const tooltip = document.getElementById('chart-tooltip');
    if (!svg || !tooltip) return;

    const container = svg.closest('.line-chart-container');
    if (!container) return;

    const viewBox = svg.getAttribute('viewBox').split(' ');
    const svgWidth = parseFloat(viewBox[2]);
    const chartWidth = svgWidth - padding.left - padding.right;

    // Vertical guide that follows the cursor
    let guide = svg.querySelector('.chart-guide');
    if (guide) guide.remove();
    guide = svgEl('line', {
        class: 'chart-guide',
        y1: padding.top, y2: padding.top + chartHeight,
        stroke: 'rgba(255,255,255,0.18)', 'stroke-width': 1,
        'stroke-dasharray': '3 3'
    });
    guide.style.opacity = '0';
    guide.style.pointerEvents = 'none';
    svg.appendChild(guide);

    // Single hover point that rides the line
    let hoverPoint = svg.querySelector('.chart-hover-point');
    if (hoverPoint) hoverPoint.remove();
    hoverPoint = svgEl('circle', {
        class: 'chart-hover-point', r: 4.5,
        fill: '#ffffff', stroke: '#0f0f12', 'stroke-width': 2
    });
    hoverPoint.style.opacity = '0';
    hoverPoint.style.pointerEvents = 'none';
    svg.appendChild(hoverPoint);

    // Invisible overlay covering the plot area, for mouse tracking
    let overlay = svg.querySelector('.chart-overlay');
    if (overlay) overlay.remove();
    overlay = svgEl('rect', {
        class: 'chart-overlay',
        x: padding.left, y: padding.top,
        width: chartWidth, height: chartHeight
    });
    overlay.style.fill = 'transparent';
    overlay.style.cursor = 'crosshair';
    svg.appendChild(overlay);

    // Map a client point into SVG user units. Doing this via the SVG's own
    // matrix keeps the dot glued to the cursor regardless of viewBox scaling,
    // preserveAspectRatio letterboxing or CSS transforms — the previous
    // width-ratio maths drifted as soon as any of those applied.
    const toSvgPoint = (evt) => {
        const ctm = svg.getScreenCTM();
        if (!ctm) return null;
        const pt = svg.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        return pt.matrixTransform(ctm.inverse());
    };

    overlay.addEventListener('mousemove', (e) => {
        const svgPoint = toSvgPoint(e);
        if (!svgPoint) return;
        const mouseX = svgPoint.x;
        
        // Clamp mouseX to chart bounds
        const clampedX = Math.max(padding.left, Math.min(padding.left + chartWidth, mouseX));
        
        // Find two nearest points for interpolation
        let leftIndex = 0;
        let rightIndex = 0;
        
        for (let i = 0; i < points.length - 1; i++) {
            if (clampedX >= points[i].x && clampedX <= points[i + 1].x) {
                leftIndex = i;
                rightIndex = i + 1;
                break;
            }
        }
        
        // Handle edge cases
        if (clampedX <= points[0].x) {
            leftIndex = rightIndex = 0;
        } else if (clampedX >= points[points.length - 1].x) {
            leftIndex = rightIndex = points.length - 1;
        }
        
        const leftPoint = points[leftIndex];
        const rightPoint = points[rightIndex];
        
        // Linear interpolation
        let interpolatedY, interpolatedValue, displayLabel;
        
        if (leftIndex === rightIndex) {
            // On exact point
            interpolatedY = leftPoint.y;
            interpolatedValue = leftPoint.visits;
            displayLabel = leftPoint.label;
        } else {
            // Between two points - interpolate
            const ratio = (clampedX - leftPoint.x) / (rightPoint.x - leftPoint.x);
            interpolatedY = leftPoint.y + (rightPoint.y - leftPoint.y) * ratio;
            interpolatedValue = Math.round(leftPoint.visits + (rightPoint.visits - leftPoint.visits) * ratio);
            
            // Decide which label to show based on proximity
            if (ratio < 0.5) {
                displayLabel = leftPoint.label;
            } else {
                displayLabel = rightPoint.label;
            }
        }
        
        // Marker and guide ride the line
        hoverPoint.setAttribute('cx', clampedX);
        hoverPoint.setAttribute('cy', interpolatedY);
        hoverPoint.style.opacity = '1';
        guide.setAttribute('x1', clampedX);
        guide.setAttribute('x2', clampedX);
        guide.style.opacity = '1';

        tooltip.querySelector('.tooltip-day').textContent = displayLabel;
        tooltip.querySelector('.visits-value').textContent = interpolatedValue.toLocaleString('pl-PL');
        tooltip.querySelector('.users-value').textContent = Math.round(interpolatedValue * 0.7).toLocaleString('pl-PL');
        tooltip.querySelector('.products-value').textContent = Math.round(interpolatedValue * 0.3).toLocaleString('pl-PL');

        // Position relative to the chart container, not the viewport: the
        // surrounding .glass-card uses backdrop-filter, which would make a
        // fixed-positioned tooltip resolve against the card instead.
        tooltip.classList.remove('hidden');

        const containerRect = container.getBoundingClientRect();
        const tipRect = tooltip.getBoundingClientRect();
        const GAP = 14;

        let left = e.clientX - containerRect.left + GAP;
        let top = e.clientY - containerRect.top + GAP;

        // Flip instead of overflowing the container edges.
        if (left + tipRect.width > containerRect.width) {
            left = e.clientX - containerRect.left - tipRect.width - GAP;
        }
        if (top + tipRect.height > containerRect.height) {
            top = e.clientY - containerRect.top - tipRect.height - GAP;
        }

        left = Math.max(0, Math.min(left, Math.max(0, containerRect.width - tipRect.width)));
        top = Math.max(0, top);

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.transform = 'none';
    });

    const hideHover = () => {
        hoverPoint.style.opacity = '0';
        guide.style.opacity = '0';
        tooltip.classList.add('hidden');
    };

    overlay.addEventListener('mouseleave', hideHover);
    container.addEventListener('mouseleave', hideHover);
}

// Initialize on admin panel load
document.addEventListener('DOMContentLoaded', () => {
    initChartPeriods();
    
    // Initialize chart with default period (day) on first load
    setTimeout(() => {
        updateChartForPeriod('day');
    }, 100);
});

// Delete Product
async function deleteProduct(id) {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) return;
    
    const success = await deleteProductFromDB(id);
    
    if (success) {
        await loadAdminProducts();
        showToast('Produkt usunięty', 'success');
    } else {
        showToast('Błąd podczas usuwania produktu', 'error');
    }
}

// Edit Product - opens modal with product data
async function editProduct(id) {
    const products = await getProducts();
    const product = products.find(p => p.id === id);
    
    if (!product) {
        showToast('Nie znaleziono produktu', 'error');
        return;
    }
    
    // Create and show edit modal
    showEditModal(product);
}

// Escape a value before putting it in an HTML attribute. Product names may
// contain quotes (e.g. 'Kurtka "XL"'), which would otherwise terminate the
// attribute and mangle the form.
function escapeHtmlAttr(value) {
    return String(value === null || value === undefined ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Same labels as the add form. The product's current value is appended when
// it is not one of them, so editing never silently recategorises legacy rows.
const PRODUCT_CATEGORY_LABELS = [
    'Shoes', 'Hoodies', 'T-shirts', 'Pants', 'Shorts', 'Jackets',
    'Sets', 'Accessories', 'Electronics', 'Bags & Backpacks'
];

function buildCategoryOptions(selected) {
    const labels = PRODUCT_CATEGORY_LABELS.slice();
    if (selected && !labels.includes(selected)) labels.push(selected);

    return labels.map(label => {
        const isSel = label === selected ? ' selected' : '';
        return `<option value="${escapeHtmlAttr(label)}"${isSel}>${escapeHtmlAttr(label)}</option>`;
    }).join('');
}

// Show Edit Modal
function showEditModal(product) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay hidden';
    modal.id = 'edit-product-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;">
            <div class="modal-header">
                <h3>Edytuj Produkt</h3>
                <button class="modal-close" onclick="closeEditModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <form id="edit-product-form" class="apf">
                <div class="apf-field">
                    <label class="apf-label">Nazwa produktu</label>
                    <input class="apf-input" type="text" name="name" value="${escapeHtmlAttr(product.name)}" required autocomplete="off">
                </div>

                <div class="apf-grid">
                    <div class="apf-field">
                        <label class="apf-label">Cena (¥ CNY)</label>
                        <input class="apf-input" type="number" name="price" value="${escapeHtmlAttr(product.price)}" step="0.01" min="0" required>
                    </div>
                    <div class="apf-field">
                        <label class="apf-label">Status</label>
                        <select class="apf-input apf-select" name="status" required>
                            <option value="active"${product.status === 'active' ? ' selected' : ''}>Aktywny</option>
                            <option value="dead"${product.status === 'dead' ? ' selected' : ''}>Martwy link</option>
                        </select>
                    </div>
                </div>

                <div class="apf-field">
                    <label class="apf-label">Kategoria</label>
                    <select class="apf-input apf-select" name="category" required>
                        ${buildCategoryOptions(product.category)}
                    </select>
                </div>

                <div class="apf-field">
                    <label class="apf-label">URL obrazka</label>
                    <input class="apf-input" type="url" name="image" value="${escapeHtmlAttr(product.image)}" required>
                </div>

                <div class="apf-field">
                    <label class="apf-label">Link do produktu</label>
                    <input class="apf-input" type="url" name="link" value="${escapeHtmlAttr(product.link)}" required>
                </div>

                <div class="apf-switchrow">
                    <div class="apf-switchrow__text">
                        <span class="apf-switchrow__title">Produkt polecany</span>
                        <p class="apf-hint">Wyróżniony na stronie głównej</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" name="popular" ${product.popular ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="apf-actions">
                    <button type="button" class="aset-btn aset-btn--ghost" onclick="closeEditModal()">Anuluj</button>
                    <button type="submit" class="aset-btn aset-btn--primary" id="edit-product-submit">Zapisz zmiany</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add form submit handler
    document.getElementById('edit-product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEditedProduct(product.id, e.target);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEditModal();
    });
    
    // Show modal with animation
    setTimeout(() => modal.classList.remove('hidden'), 10);
}

// Close Edit Modal
function closeEditModal() {
    const modal = document.getElementById('edit-product-modal');
    if (modal) {
        modal.classList.add('hidden');
        setTimeout(() => modal.remove(), 300);
    }
}

// Save Edited Product
async function saveEditedProduct(id, form) {
    const formData = new FormData(form);
    const submitBtn = document.getElementById('edit-product-submit');

    const price = parseFloat(formData.get('price'));
    if (!isFinite(price) || price < 0) {
        showToast('Podaj poprawną cenę', 'error');
        return;
    }

    const updates = {
        name: String(formData.get('name') || '').trim(),
        price: price,
        // CNY is the base currency; conversion happens at display time.
        currency: 'CNY',
        category: formData.get('category'),
        status: formData.get('status'),
        image: String(formData.get('image') || '').trim(),
        link: String(formData.get('link') || '').trim(),
        popular: formData.get('popular') === 'on'
    };

    if (submitBtn) submitBtn.disabled = true;

    try {
        let saved = null;

        if (typeof updateProductInDB === 'function') {
            saved = await updateProductInDB(id, updates);
        } else {
            console.warn('Klient Supabase niedostępny — zapisuję zmiany lokalnie.');
        }

        // Mirror locally so the table and the CSV export stay in sync even
        // when the database is unreachable.
        const local = readLocalProducts();
        const index = local.findIndex(p => String(p.id) === String(id));
        if (index === -1) {
            local.unshift({ id: id, clicks: 0, ...updates });
        } else {
            local[index] = { ...local[index], ...updates };
        }
        writeLocalProducts(local);

        closeEditModal();
        await loadAdminProducts();
        if (typeof loadProductsGrid === 'function') loadProductsGrid();

        showToast(
            saved ? 'Produkt zaktualizowany' : 'Zmiany zapisane lokalnie (baza niedostępna)',
            saved ? 'success' : 'warning'
        );
    } catch (error) {
        console.error('Edit product failed:', error);
        showToast('Błąd podczas zapisu: ' + error.message, 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// Toast Notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// =========================================
// INFINITY SCROLL ENGINE
// =========================================
const CARDS_PER_PAGE = 8;
let _infinityProducts = [];  // aktualnie przefiltrowane produkty
let _infinityPage     = 0;   // ile stron już załadowano
let _infinityLoading  = false;
let _infinityObserver = null;

function _getCardStartIndex() {
    return _infinityPage * CARDS_PER_PAGE;
}

/** Animuje karty które właśnie weszły do DOM */
function _animateNewCards(cards) {
    cards.forEach((card, i) => {
        // global index = już istniejące + i
        const globalIdx = _getCardStartIndex() - CARDS_PER_PAGE + i;
        card.style.setProperty('--card-i', Math.min(i, 7)); // max delay = 7*55ms = 385ms
        // reflow żeby animacja faktycznie odpalila
        void card.offsetWidth;
        card.classList.add('card-visible');
    });
}

/** Ładuje kolejną stronę kart do gridu */
function _loadNextPage() {
    if (_infinityLoading) return;
    const start = _infinityPage * CARDS_PER_PAGE;
    if (start >= _infinityProducts.length) {
        // Koniec — ukryj loader
        const loader = document.getElementById('products-loader');
        if (loader) loader.classList.add('hidden');
        return;
    }

    _infinityLoading = true;
    const loader = document.getElementById('products-loader');
    if (loader) loader.classList.remove('hidden');

    // Symulacja małego opóźnienia sieciowego (100ms) — daje efekt "ładowania"
    setTimeout(() => {
        const grid  = document.getElementById('products-grid');
        if (!grid) { _infinityLoading = false; return; }

        const slice = _infinityProducts.slice(start, start + CARDS_PER_PAGE);
        const newCards = slice.map(p => buildProductCard(p));

        newCards.forEach(c => grid.appendChild(c));
        _animateNewCards(newCards);

        _infinityPage++;
        _infinityLoading = false;

        if (loader) loader.classList.add('hidden');

        // Jeśli załadowaliśmy wszystko — odłącz observer
        if (_infinityPage * CARDS_PER_PAGE >= _infinityProducts.length) {
            if (_infinityObserver) {
                const sentinel = document.getElementById('scroll-sentinel');
                if (sentinel) _infinityObserver.unobserve(sentinel);
            }
        }
    }, 120);
}

/** Inicjalizuje infinity scroll z podaną listą produktów */
function initInfinityScroll(products) {
    _infinityProducts = Array.isArray(products) ? products : [];
    _infinityPage     = 0;
    _infinityLoading  = false;

    const grid = document.getElementById('products-grid');
    if (grid) grid.innerHTML = '';

    // Odłącz stary observer
    if (_infinityObserver) {
        _infinityObserver.disconnect();
        _infinityObserver = null;
    }

    // Demo products used to fill this space; an honest empty state is
    // better than fake items a visitor can click.
    if (_infinityProducts.length === 0) {
        renderProductsEmptyState();
        return;
    }

    // Ładuj pierwszą stronę
    _loadNextPage();

    // Ustaw IntersectionObserver na sentinel
    const sentinel = document.getElementById('scroll-sentinel');
    if (!sentinel) return;

    _infinityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) _loadNextPage();
        });
    }, { rootMargin: '200px' }); // triggeruj 200px przed końcem

    _infinityObserver.observe(sentinel);
}

// Shown when there is nothing to list — either the catalogue is empty or
// the active filters match no product.
function renderProductsEmptyState() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const search = document.getElementById('products-search');
    const filtering = Boolean(search && search.value.trim());

    grid.innerHTML = `
        <div class="products-empty">
            <div class="products-empty__icon-wrap">
                <i class="fa-regular fa-folder-open"></i>
            </div>
            <h3>${filtering ? 'Brak wyników' : 'Brak produktów'}</h3>
            <p>${filtering
                ? 'Nie znaleziono produktów dla tego zapytania. Spróbuj innej frazy lub wyczyść filtry.'
                : 'Katalog jest jeszcze pusty. Produkty pojawią się tutaj po dodaniu ich w panelu.'}</p>
        </div>
    `;
}

window.renderProductsEmptyState = renderProductsEmptyState;

// Shared card builder

// Shared card builder
function buildProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    const popularBadge = product.popular
        ? `<span class="product-card__badge-popular"><i class="fa-solid fa-fire"></i> Popular</span>` : '';
    const catBadge = product.category
        ? `<span class="product-card__badge-cat">${product.category}</span>` : '';
    const imgSrc = product.image || 'https://via.placeholder.com/400x600/0f0f0f/555?text=No+Image';
    const currency = product.currency || 'PLN';
    const priceFormatted = parseFloat(product.price).toFixed(2);
    const views = product.clicks || 0;

    // Sprzedawca produktu — pokazywany w wierszu opisowym
    const sellerName = product.agent || product.seller || 'RANDOM';

    // Agent wybrany w Ustawieniach — jego skrót trafia na biały kwadrat
    const selectedAgent = getSelectedAgentMeta();
    const agentInner = selectedAgent.logo
        ? `<img src="${selectedAgent.logo}" alt="${selectedAgent.name}">`
        : `<span class="pc-agent-text">${selectedAgent.abbr}</span>`;

    // Ocena 1-10 — z produktu, a gdy jej nie ma, wyliczona z liczby wyświetleń
    const rating = product.rating != null
        ? product.rating
        : Math.min(10, Math.max(1, Math.round(views / 40) + 5));
    const ratingClass = rating >= 8 ? 'pc-rating pc-rating--high' : 'pc-rating';

    card.innerHTML = `
        <div class="product-card__img-wrap">
            <img src="${imgSrc}" alt="${product.name}" loading="lazy">
            ${popularBadge}
            ${catBadge}
        </div>
        <div class="pc-info">
            <div class="pc-row-title">
                <span class="pc-title">${product.name}</span>
                <span class="pc-price">${priceFormatted} ${currency}</span>
            </div>
            <div class="pc-row-meta">
                <span class="pc-sub">${product.category || ''} · ${sellerName}</span>
                <span class="${ratingClass}"><i class="fa-solid fa-star"></i> ${rating}/10</span>
            </div>
        </div>
        <div class="pc-actions">
            <button class="pc-btn-details" type="button">
                <i class="fa-regular fa-eye"></i>
                <span>Zobacz szczegóły</span>
            </button>
            <button class="pc-btn-agent" type="button" data-agent-btn data-agent-raw="${product.link || ''}" title="Kup przez ${selectedAgent.name}">
                ${agentInner}
            </button>
            <button class="pc-btn-bag" type="button" title="Kopiuj link do produktu">
                <i class="fa-solid fa-share-nodes"></i>
            </button>
        </div>
    `;

    card.style.cursor = 'pointer';

    const openDetail = () => showProductDetail(product.id);

    // Klik na obrazek i sekcję informacyjną otwiera szczegóły
    card.querySelector('.product-card__img-wrap').addEventListener('click', openDetail);
    card.querySelector('.pc-info').addEventListener('click', openDetail);

    // Zobacz szczegóły
    card.querySelector('.pc-btn-details').addEventListener('click', (e) => {
        e.stopPropagation();
        openDetail();
    });

    // Agent — otwiera link przepuszczony przez agenta wybranego w Ustawieniach
    card.querySelector('.pc-btn-agent').addEventListener('click', (e) => {
        e.stopPropagation();
        const raw = product.link || '';
        if (!raw || raw === '#') return;
        const url = typeof buildAgentLink === 'function' ? buildAgentLink(raw) : raw;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });

    // Kopiuj link strony do produktu (np. itemfinder.pl/#/ralph-lauren-tshirt)
    card.querySelector('.pc-btn-bag').addEventListener('click', (e) => {
        e.stopPropagation();
        const shareUrl = getProductShareUrl(product);
        copyToClipboard(shareUrl);
    });

    return card;
}

// Filter products grid by category
function filterProductsGrid(cat) {
    applyFiltersAndSort();
}

// Load Products Grid on Main Page
async function loadProductsGrid() {
    const stored = await getProducts();
    const all = stored;
    initInfinityScroll(all);
}

// Increment Clicks
async function incrementClicks(id) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update({ clicks: supabase.raw('clicks + 1') })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.warn('Could not increment clicks for product:', id, error);
        return null;
    }
}

// Toggle Favorite (placeholder)
function toggleFavorite(id) {
    showToast('Dodano do ulubionych!', 'success');
}

// Initialize - Load products when admin panel is visible
document.addEventListener('DOMContentLoaded', () => {
    // Load products grid on page load
    loadProductsGrid();
    
    // Load admin products if admin panel is visible
    if (document.getElementById('admin-panel') && !document.getElementById('admin-panel').classList.contains('hidden')) {
        loadAdminProducts();
    }
});

// CSS Animations for Toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}
`;
document.head.appendChild(toastStyles);


// =========================================
// INTERACTIVE LINE CHART LOGIC
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const chartPoints = document.querySelectorAll('.chart-point');
    const tooltip = document.getElementById('chart-tooltip');
    
    if (!chartPoints.length || !tooltip) return;
    
    chartPoints.forEach(point => {
        point.addEventListener('mouseenter', (e) => {
            // Get data from point
            const day = point.getAttribute('data-day');
            const visits = point.getAttribute('data-visits');
            const users = point.getAttribute('data-users');
            const products = point.getAttribute('data-products');
            
            // Update tooltip content
            tooltip.querySelector('.tooltip-day').textContent = day;
            tooltip.querySelector('.visits-value').textContent = visits;
            tooltip.querySelector('.users-value').textContent = users;
            tooltip.querySelector('.products-value').textContent = products;
            
            // Position tooltip near the point
            const pointRect = e.target.getBoundingClientRect();
            const chartContainer = document.querySelector('.line-chart-container');
            const containerRect = chartContainer.getBoundingClientRect();
            
            // Calculate position relative to container
            const leftPos = pointRect.left - containerRect.left + (pointRect.width / 2);
            const topPos = pointRect.top - containerRect.top - 10;
            
            tooltip.style.left = leftPos + 'px';
            tooltip.style.top = topPos + 'px';
            tooltip.style.transform = 'translate(-50%, -100%)';
            
            // Show tooltip
            tooltip.classList.remove('hidden');
        });
        
        point.addEventListener('mouseleave', () => {
            // Hide tooltip
            tooltip.classList.add('hidden');
        });
    });
});


// =========================================
// PRODUCTS VIEW — dropdown & search
// Czyste event delegation, zero init guards
// =========================================

// ---- Category dropdown toggle ----
document.addEventListener('click', (e) => {
    console.log('Click event:', e.target);
    
    const btn = e.target.closest('#pv-cat-btn');
    if (btn) {
        console.log('Button clicked - toggling dropdown');
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-cat-dropdown');
        // Close other dropdowns
        document.querySelectorAll('.pv-filter-dropdown').forEach(dd => {
            if (dd.id !== 'pv-cat-dropdown') dd.classList.remove('open');
        });
        if (container) {
            container.classList.toggle('open');
            console.log('Dropdown open state:', container.classList.contains('open'));
        }
        return;
    }

    // ---- Price dropdown toggle ----
    const priceBtn = e.target.closest('#pv-price-btn');
    if (priceBtn) {
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-price-dropdown');
        // Close other dropdowns
        document.querySelectorAll('.pv-filter-dropdown').forEach(dd => {
            if (dd.id !== 'pv-price-dropdown') dd.classList.remove('open');
        });
        if (container) container.classList.toggle('open');
        return;
    }

    // ---- Sort dropdown toggle ----
    const sortBtn = e.target.closest('#pv-sort-btn');
    if (sortBtn) {
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-sort-dropdown');
        // Close other dropdowns
        document.querySelectorAll('.pv-filter-dropdown').forEach(dd => {
            if (dd.id !== 'pv-sort-dropdown') dd.classList.remove('open');
        });
        if (container) container.classList.toggle('open');
        return;
    }

    // ---- Category item click ----
    const item = e.target.closest('.pv-drop-item');
    if (item && item.closest('#pv-cat-menu')) {
        console.log('Category item clicked:', item.getAttribute('data-cat'));
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-cat-dropdown');
        const dd        = document.getElementById('pv-cat-menu');
        const label     = document.getElementById('pv-cat-label');
        if (dd) dd.querySelectorAll('.pv-drop-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const sp = item.querySelector('span');
        if (label && sp) label.textContent = sp.textContent.trim();
        if (container) container.classList.remove('open');
        
        // Clear pill filters when selecting category
        document.querySelectorAll('.pv-filter-pill').forEach(p => p.classList.remove('active'));
        window._activePillFilter = null;
        
        const cat = item.getAttribute('data-cat');
        console.log('Filtering by category:', cat);
        applyFiltersAndSort();
        return;
    }

    // ---- Price item click ----
    if (item && item.closest('#pv-price-menu')) {
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-price-dropdown');
        const dd        = document.getElementById('pv-price-menu');
        const label     = document.getElementById('pv-price-label');
        if (dd) dd.querySelectorAll('.pv-drop-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const sp = item.querySelector('span');
        if (label && sp) label.textContent = sp.textContent.trim();
        if (container) container.classList.remove('open');
        
        // Clear custom range
        window._customPriceRange = null;
        const minInput = document.getElementById('price-min');
        const maxInput = document.getElementById('price-max');
        if (minInput) minInput.value = '';
        if (maxInput) maxInput.value = '';
        
        const price = item.getAttribute('data-price');
        console.log('Filtering by price:', price);
        applyFiltersAndSort();
        return;
    }

    // ---- Sort item click ----
    if (item && item.closest('#pv-sort-menu')) {
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-sort-dropdown');
        const dd        = document.getElementById('pv-sort-menu');
        const label     = document.getElementById('pv-sort-label');
        if (dd) dd.querySelectorAll('.pv-drop-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const sp = item.querySelector('span');
        if (label && sp) label.textContent = sp.textContent.trim();
        if (container) container.classList.remove('open');
        const sort = item.getAttribute('data-sort');
        console.log('Sorting by:', sort);
        applyFiltersAndSort();
        return;
    }

    // ---- Pill filter ----
    const pill = e.target.closest('.pv-filter-pill');
    if (pill) {
        const filterType = pill.getAttribute('data-filter');
        console.log('Pill filter clicked:', filterType);
        
        // Toggle pill (allow deselection)
        if (pill.classList.contains('active')) {
            pill.classList.remove('active');
            window._activePillFilter = null;
        } else {
            document.querySelectorAll('.pv-filter-pill').forEach(b => b.classList.remove('active'));
            pill.classList.add('active');
            window._activePillFilter = filterType;
        }
        
        applyFiltersAndSort();
        return;
    }

    // ---- Close dropdown on outside click ----
    const ddContainer = e.target.closest('.pv-filter-dropdown');
    if (!ddContainer) {
        document.querySelectorAll('.pv-filter-dropdown').forEach(dd => dd.classList.remove('open'));
        console.log('All dropdowns closed by outside click');
    }
});

// ---- Custom price range apply ----
document.addEventListener('click', (e) => {
    if (e.target.id === 'apply-custom-price') {
        e.stopPropagation();
        const minInput = document.getElementById('price-min');
        const maxInput = document.getElementById('price-max');
        const min = parseInt(minInput.value) || 0;
        const max = parseInt(maxInput.value) || Infinity;
        
        if (min > 0 || max < Infinity) {
            // Set custom range
            const customRange = max === Infinity ? `${min}+` : `${min}-${max}`;
            
            // Update label
            const label = document.getElementById('pv-price-label');
            const currency = localStorage.getItem('pref_currency') || 'PLN';
            if (label) {
                if (max === Infinity) {
                    label.textContent = `${min}+ ${currency}`;
                } else {
                    label.textContent = `${min}-${max} ${currency}`;
                }
            }
            
            // Remove active from all preset items
            document.querySelectorAll('#pv-price-menu .pv-drop-item').forEach(i => i.classList.remove('active'));
            
            // Store custom range for filtering
            window._customPriceRange = customRange;
            
            // Close dropdown
            const container = document.getElementById('pv-price-dropdown');
            if (container) container.classList.remove('open');
            
            // Apply filter
            applyFiltersAndSort();
        }
    }
});

// Stop propagation on custom price inputs to prevent dropdown close
document.addEventListener('click', (e) => {
    if (e.target.closest('.pv-price-custom')) {
        e.stopPropagation();
    }
});

// ---- Search inside dropdown (stop propagation) ----
document.addEventListener('click', (e) => {
    if (e.target.closest('.pv-drop-search-wrap')) e.stopPropagation();
});

document.addEventListener('input', (e) => {
    if (!e.target.classList.contains('pv-drop-search')) return;
    const q  = e.target.value.toLowerCase();
    const dd = document.getElementById('pv-cat-menu');
    if (!dd) return;
    dd.querySelectorAll('.pv-drop-item').forEach(it => {
        const sp = it.querySelector('span');
        it.style.display = sp && sp.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});

// ---- Main search bar ----
document.addEventListener('input', async (e) => {
    if (e.target.id !== 'products-search') return;
    const q   = e.target.value.toLowerCase().trim();
    const stored = await getProducts();
    const all = stored;
    initInfinityScroll(q ? all.filter(p =>
        p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
    ) : all);
});

// =========================================
// PRICE FILTER & SORT LOGIC
// =========================================

function getSelectedCategory() {
    const activeItem = document.querySelector('#pv-cat-menu .pv-drop-item.active');
    return activeItem ? activeItem.getAttribute('data-cat') : 'All';
}

function getSelectedPriceRange() {
    // Check if custom range is set
    if (window._customPriceRange) {
        return window._customPriceRange;
    }
    // Otherwise get from dropdown
    const activeItem = document.querySelector('#pv-price-menu .pv-drop-item.active');
    return activeItem ? activeItem.getAttribute('data-price') : 'all';
}

function getSelectedSort() {
    const activeItem = document.querySelector('#pv-sort-menu .pv-drop-item.active');
    return activeItem ? activeItem.getAttribute('data-sort') : 'name-asc';
}

function filterByPrice(products, priceRange) {
    if (priceRange === 'all') return products;
    
    // Parse price range (these are in CNY base values from dropdown data attributes)
    const [min, max] = priceRange.includes('+') 
        ? [parseInt(priceRange), Infinity]
        : priceRange.split('-').map(v => parseInt(v));
    
    return products.filter(p => {
        // Get product price and currency
        const productPrice = parseFloat(p.price) || 0;
        const productCurrency = p.currency || 'PLN';
        
        // Convert product price to CNY for comparison
        // If product is already in CNY, use directly; otherwise convert back to CNY
        let priceInCNY;
        if (productCurrency === 'CNY') {
            priceInCNY = productPrice;
        } else {
            // Reverse conversion: divide by the rate to get back to CNY
            const rate = CURRENCY_RATES[productCurrency] || CURRENCY_RATES['PLN'];
            priceInCNY = productPrice / rate;
        }
        
        // Compare with CNY range
        return priceInCNY >= min && (max === Infinity || priceInCNY <= max);
    });
}

function sortProducts(products, sortBy) {
    const sorted = [...products];
    
    switch(sortBy) {
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'price-asc':
            return sorted.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        case 'price-desc':
            return sorted.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        case 'newest':
            return sorted.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
        default:
            return sorted;
    }
}

async function applyFiltersAndSort() {
    const stored = await getProducts();
    const all = stored;
    
    // 1. Filter by category
    const category = getSelectedCategory();
    let filtered = (!category || category === 'All')
        ? all
        : all.filter(p => p.category === category);
    
    // 2. Apply pill filter (women/recommended/newest)
    const pillFilter = window._activePillFilter;
    if (pillFilter === 'women') {
        // Filter products for women (categories like bags, accessories, certain shoes)
        const womenCategories = ['Bags & Backpacks', 'Accessories'];
        filtered = filtered.filter(p => 
            womenCategories.includes(p.category) || 
            (p.name && (p.name.toLowerCase().includes('women') || p.name.toLowerCase().includes('ladies')))
        );
    } else if (pillFilter === 'recommended') {
        // Filter only popular products
        filtered = filtered.filter(p => p.popular === true);
    } else if (pillFilter === 'newest') {
        // Sort by newest (highest ID = newest)
        filtered = [...filtered].sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    }
    
    // 3. Filter by price
    const priceRange = getSelectedPriceRange();
    filtered = filterByPrice(filtered, priceRange);
    
    // 4. Sort (only if newest pill is not active)
    if (pillFilter !== 'newest') {
        const sortBy = getSelectedSort();
        filtered = sortProducts(filtered, sortBy);
    }
    
    // 5. Display
    initInfinityScroll(filtered);
}

// ---- Update price dropdown currency display ----
const CURRENCY_RATES = {
    'CNY': 1,      // Base currency (Chinese Yuan)
    'PLN': 0.58,   // 1 CNY = ~0.58 PLN
    'EUR': 0.13,   // 1 CNY = ~0.13 EUR
    'USD': 0.14,   // 1 CNY = ~0.14 USD
    'GBP': 0.11    // 1 CNY = ~0.11 GBP
};

function convertPrice(priceInCNY, targetCurrency) {
    const rate = CURRENCY_RATES[targetCurrency] || CURRENCY_RATES['PLN'];
    return Math.round(priceInCNY * rate);
}

function updatePriceDropdownCurrency() {
    const currency = localStorage.getItem('pref_currency') || 'PLN';
    
    // Update currency symbols
    document.querySelectorAll('#pv-price-menu .price-curr').forEach(el => {
        el.textContent = currency;
    });
    
    // Update price values - converting from CNY base
    const priceRanges = [
        { selector: '[data-price="0-50"]', cnyValues: [50] },
        { selector: '[data-price="50-100"]', cnyValues: [50, 100] },
        { selector: '[data-price="100-200"]', cnyValues: [100, 200] },
        { selector: '[data-price="200-500"]', cnyValues: [200, 500] },
        { selector: '[data-price="500+"]', cnyValues: [500] }
    ];
    
    priceRanges.forEach(range => {
        const item = document.querySelector(`#pv-price-menu ${range.selector}`);
        if (!item) return;
        
        const priceVals = item.querySelectorAll('.price-val');
        range.cnyValues.forEach((cnyVal, idx) => {
            if (priceVals[idx]) {
                priceVals[idx].textContent = convertPrice(cnyVal, currency);
            }
        });
    });
}

// Update currency on page load
if (document.getElementById('pv-price-menu')) {
    updatePriceDropdownCurrency();
}

// Update currency when preference changes
window.addEventListener('storage', (e) => {
    if (e.key === 'pref_currency') {
        updatePriceDropdownCurrency();
    }
});

// Also update when preferences modal changes currency
document.addEventListener('click', (e) => {
    const prefItem = e.target.closest('[data-pref="currency"]');
    if (prefItem) {
        setTimeout(updatePriceDropdownCurrency, 100);
    }
});


// =========================================
// TOOL VIEWS — animacja wejścia
// =========================================
(function() {
    // Patch showView żeby dodawała animację do tool-view
    const _origShowView = window.showView;
    // Używamy MutationObserver lub po prostu nadpisujemy data-view listener
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-view]');
        if (!link) return;
        const viewId = link.getAttribute('data-view');
        const view = document.getElementById(viewId);
        if (view && view.classList.contains('tool-view')) {
            setTimeout(() => {
                view.classList.remove('tool-animate');
                void view.offsetWidth;
                view.classList.add('tool-animate');
            }, 10);
        }
    });

    // Animacja przy kliknięciu Eksploruj (products-view)
    // już obsługiwana w hero-explore-btn listener
})();

// =========================================
// LINK CONVERTER — logika (oparty na REUSABLE_MODULES/converter)
// =========================================

// --- Funkcje konwersji (port z converter.js) ---
function _conv_detectPlatform(url) {
    const v = String(url || '').toLowerCase();
    if (!v) return 'auto';
    if (v.includes('weidian.com'))   return 'weidian';
    if (v.includes('kakobuy.com'))   return 'kakobuy';
    if (v.includes('usfans.com'))    return 'usfans';
    if (v.includes('acbuy.com') || v.includes('allchinabuy.com')) return 'allchinabuy';
    if (v.includes('litbuy.com'))    return 'litbuy';
    if (v.includes('mulebuy.com'))   return 'mulebuy';
    if (v.includes('oopbuy.com'))    return 'oopbuy';
    if (v.includes('gtbuy.com'))     return 'gtbuy';
    if (v.includes('hipobuy.com'))   return 'hipobuy';
    if (v.includes('taobao.com') || v.includes('tmall.com')) return 'taobao';
    if (v.includes('1688.com'))      return '1688';
    return 'unknown';
}

function _conv_safeUrl(value) {
    try { return new URL(value); } catch { return null; }
}

function _conv_deepDecode(value, rounds = 4) {
    let result = String(value || '');
    for (let i = 0; i < rounds; i++) {
        try {
            const decoded = decodeURIComponent(result);
            if (decoded === result) break;
            result = decoded;
        } catch { break; }
    }
    return result;
}

function _conv_normalizeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(raw)) return `https://${raw}`;
    return raw;
}

function _conv_extractWeidianItemId(url) {
    const safe = _conv_safeUrl(url);
    if (safe) {
        const itemId = safe.searchParams.get('itemID') || safe.searchParams.get('itemId') || safe.searchParams.get('id');
        if (itemId && /^\d+$/.test(itemId)) return itemId;
    }
    const match = String(url || '').match(/itemID(?:%3D|=)(\d+)/i);
    return match ? match[1] : '';
}

function _conv_extractTaobaoItemId(url) {
    const safe = _conv_safeUrl(url);
    if (safe) {
        const id = safe.searchParams.get('id');
        if (id && /^\d+$/.test(id)) return id;
    }
    const match = String(url || '').match(/[?&]id=(\d+)/i);
    return match ? match[1] : '';
}

function _conv_extract1688ItemId(url) {
    const match = String(url || '').match(/\/offer\/(\d+)\.html/i);
    return match ? match[1] : '';
}

function _conv_extractOriginalFromAgent(inputUrl) {
    const normalized = _conv_normalizeUrl(inputUrl);
    const url = _conv_safeUrl(normalized);
    if (!url) return normalized;
    const candidateKeys = ['url', 'itemUrl', 'goodsUrl', 'link', 'target', 'redirect'];
    for (const key of candidateKeys) {
        const value = url.searchParams.get(key);
        if (!value) continue;
        const deep = _conv_deepDecode(value);
        const norm = _conv_normalizeUrl(deep);
        if (norm.startsWith('http')) return norm;
    }
    return normalized;
}

function _conv_buildWeidianUrl(itemId) {
    return `https://weidian.com/item.html?itemID=${itemId}`;
}

function _conv_analyzeInput(rawUrl) {
    const cleaned = _conv_normalizeUrl(rawUrl);
    if (!cleaned) return { platform: 'unknown', originalUrl: '', itemId: '', source: 'unknown' };

    const platform = _conv_detectPlatform(cleaned);

    if (platform === 'weidian') {
        const itemId = _conv_extractWeidianItemId(cleaned);
        return { platform, originalUrl: itemId ? _conv_buildWeidianUrl(itemId) : cleaned, itemId, source: 'weidian' };
    }
    if (platform === 'taobao') {
        const itemId = _conv_extractTaobaoItemId(cleaned);
        return { platform, originalUrl: cleaned, itemId, source: 'taobao' };
    }
    if (platform === '1688') {
        const itemId = _conv_extract1688ItemId(cleaned);
        return { platform, originalUrl: cleaned, itemId, source: '1688' };
    }
    // Agent links — wyciągnij oryginalny URL
    if (['kakobuy','usfans','allchinabuy','litbuy','mulebuy','oopbuy','gtbuy','hipobuy'].includes(platform)) {
        const original = _conv_extractOriginalFromAgent(cleaned);
        const itemId   = _conv_extractWeidianItemId(original) || _conv_extractTaobaoItemId(original);
        return { platform, originalUrl: original, itemId, source: _conv_detectPlatform(original) };
    }
    // Nieznane — traktuj jako raw URL
    return { platform: 'unknown', originalUrl: cleaned, itemId: _conv_extractWeidianItemId(cleaned), source: 'unknown' };
}

function _conv_buildResult(analysis, target) {
    const { itemId, originalUrl, source } = analysis;
    if (!originalUrl) return '';

    // Jeśli target to raw link — zwróć oryginalny URL
    if (!target || target === 'raw') return originalUrl;

    // Agents added from the admin panel resolve through their template.
    if (typeof loadCustomAgents === 'function') {
        const custom = loadCustomAgents().find(a => a.id === target && a.template);
        if (custom) return _conv_applyTemplate(custom.template, originalUrl, itemId);
    }

    // Dla weidian — użyj itemID gdzie możliwe
    if (source === 'weidian' && itemId) {
        const wdUrl = _conv_buildWeidianUrl(itemId);
        switch (target) {
            case 'litbuy':      return `https://www.litbuy.com/item/details?url=${encodeURIComponent(wdUrl)}`;
            case 'kakobuy':     return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(wdUrl)}&affcode=xfrostyy`;
            case 'usfans':      return `https://www.usfans.com/product/3/${itemId}`;
            case 'allchinabuy': return `https://www.acbuy.com/product/?id=${itemId}&source=WD`;
            case 'mulebuy':     return `https://mulebuy.com/product?id=${itemId}&platform=WEIDIAN`;
            case 'oopbuy':      return `https://oopbuy.com/product/weidian/${itemId}`;
            case 'gtbuy':       return `https://www.gtbuy.com/product/weidian/${itemId}`;
            case 'hipobuy':     return `https://hipobuy.com/product/weidian/${itemId}`;
            case 'wegobuy':     return `https://www.wegobuy.com/en/page/buy?from=search-input&url=${encodeURIComponent(wdUrl)}`;
            case 'acbuy':       return `https://www.acbuy.com/product/?id=${itemId}&source=WD`;
            default:            return `https://www.${target}.com/item/details?url=${encodeURIComponent(wdUrl)}`;
        }
    }

    // Fallback — URL-wrap dla agentów które to obsługują
    const encodedOriginal = encodeURIComponent(originalUrl);
    switch (target) {
        case 'litbuy':      return `https://www.litbuy.com/item/details?url=${encodedOriginal}`;
        case 'kakobuy':     return `https://www.kakobuy.com/item/details?url=${encodedOriginal}&affcode=xfrostyy`;
        case 'wegobuy':     return `https://www.wegobuy.com/en/page/buy?from=search-input&url=${encodedOriginal}`;
        case 'acbuy':       return `https://www.acbuy.com/item/details?url=${encodedOriginal}`;
        default:            return `https://www.${target}.com/item/details?url=${encodedOriginal}`;
    }
}

// --- Konfiguracja agentów ---
const CONVERTER_AGENTS = [
    { id: 'litbuy',      name: 'Litbuy',      abbr: 'LI' },
    { id: 'kakobuy',     name: 'Kakobuy',     abbr: 'KA' },
    { id: 'usfans',      name: 'Usfans',      abbr: 'US' },
    { id: 'acbuy',       name: 'Acbuy',       abbr: 'AC' },
    { id: 'wegobuy',     name: 'Wegobuy',     abbr: 'WG' },
    { id: 'mulebuy',     name: 'MuleBuy',     abbr: 'MU' },
    { id: 'oopbuy',      name: 'OopBuy',      abbr: 'OP' },
    { id: 'gtbuy',       name: 'GTBuy',       abbr: 'GT' },
    { id: 'hipobuy',     name: 'HipoBuy',     abbr: 'HI' },
    { id: 'allchinabuy', name: 'AllChinaBuy', abbr: 'CB' },
    { id: 'raw',         name: 'Raw Link',    abbr: 'RA' },
];

/* ---------------------------------------------------------------
   Custom agents (added from the admin panel)

   CONVERTER_AGENTS above stays the built-in baseline. Extra agents are
   stored separately and merged in, so both the Tools converter and the
   settings picker read one list instead of drifting apart.

   A custom agent carries a URL template with placeholders:
     {url}    original product URL, percent-encoded
     {rawurl} original product URL, as-is
     {id}     item id when it could be extracted
--------------------------------------------------------------- */

const CUSTOM_AGENTS_KEY = 'customAgents';

/* Wbudowanych agentów nie da się skasować z tablicy w kodzie, więc usunięcie
   zapisuje ich identyfikatory tutaj i getAllAgents() je pomija. Dzięki temu
   operacja jest odwracalna — panel pozwala przywrócić ukrytego agenta. */
const HIDDEN_AGENTS_KEY = 'hiddenBuiltinAgents';

function loadHiddenAgentIds() {
    try {
        const raw = localStorage.getItem(HIDDEN_AGENTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : [];
    } catch (error) {
        console.warn('Uszkodzona lista ukrytych agentów — pomijam.', error);
        return [];
    }
}

function saveHiddenAgentIds(ids) {
    localStorage.setItem(HIDDEN_AGENTS_KEY, JSON.stringify(ids || []));
}

function loadCustomAgents() {
    try {
        const raw = localStorage.getItem(CUSTOM_AGENTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(a => a && a.id && a.name) : [];
    } catch (error) {
        console.warn('Uszkodzona lista własnych agentów — pomijam.', error);
        return [];
    }
}

function saveCustomAgents(list) {
    localStorage.setItem(CUSTOM_AGENTS_KEY, JSON.stringify(list || []));
}

function slugifyAgentId(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .slice(0, 32);
}

// Built-ins first, custom agents next, "raw" always last.
// Agenci usunięci w panelu (ukryci) nie trafiają na żadną listę.
function getAllAgents() {
    const hidden = new Set(loadHiddenAgentIds());
    const builtins = CONVERTER_AGENTS.filter(a => a.id !== 'raw' && !hidden.has(a.id));
    const rawEntry = CONVERTER_AGENTS.filter(a => a.id === 'raw' && !hidden.has(a.id));
    const taken = new Set(builtins.map(a => a.id));
    const custom = loadCustomAgents().filter(a => !taken.has(a.id));
    return [...builtins, ...custom, ...rawEntry];
}

// Wbudowani agenci schowani przez usunięcie — panel pokazuje ich do przywrócenia.
function getHiddenBuiltinAgents() {
    const hidden = new Set(loadHiddenAgentIds());
    return CONVERTER_AGENTS.filter(a => hidden.has(a.id));
}

function findAgent(id) {
    return getAllAgents().find(a => a.id === id) || null;
}

function _conv_applyTemplate(template, originalUrl, itemId) {
    return String(template)
        .replace(/\{url\}/gi, encodeURIComponent(originalUrl))
        .replace(/\{rawurl\}/gi, originalUrl)
        .replace(/\{id\}/gi, itemId || '');
}

window.loadCustomAgents = loadCustomAgents;
window.saveCustomAgents = saveCustomAgents;
window.getAllAgents = getAllAgents;
window.slugifyAgentId = slugifyAgentId;

/* ---------------------------------------------------------------
   Agent link resolution
   Product links are stored raw (weidian/taobao/1688). Anything that
   sends a user to a shop must route through the agent picked in
   settings, using the same conversion as the Tools converter instead
   of a second, drifting implementation.
--------------------------------------------------------------- */

// Settings store the display name ("AllChinaBuy"); the converter wants an id.
function agentNameToId(name) {
    const key = String(name || '').toLowerCase().replace(/[\s_-]/g, '');
    const agents = getAllAgents();
    const match = agents.find(a => a.id === key || a.name.toLowerCase().replace(/\s/g, '') === key);
    if (match) return match.id;
    // Zapisany agent mógł zostać usunięty — bierzemy pierwszego z dostępnych.
    return agents.length > 0 ? agents[0].id : 'litbuy';
}

function getSelectedAgentId() {
    return agentNameToId(localStorage.getItem('pref_agent') || 'Litbuy');
}

// Returns an agent URL for a raw product link, falling back to the raw link
// so the button is never dead.
function buildAgentLink(rawUrl, agentId) {
    if (!rawUrl) return '';
    const target = agentId || getSelectedAgentId();

    if (typeof _conv_analyzeInput !== 'function' || typeof _conv_buildResult !== 'function') {
        console.warn('Converter unavailable — using the raw product link.');
        return rawUrl;
    }

    try {
        const converted = _conv_buildResult(_conv_analyzeInput(rawUrl), target);
        return converted || rawUrl;
    } catch (error) {
        console.warn('Agent link conversion failed — using the raw link.', error);
        return rawUrl;
    }
}

// Metadane agenta wybranego w Ustawieniach — używane przez kartę produktu,
// żeby biały kwadrat pokazywał ten sam skrót co lista w preferencjach.
function getSelectedAgentMeta() {
    const fallback = { id: 'litbuy', name: 'Litbuy', abbr: 'LI', logo: '' };
    try {
        const id = getSelectedAgentId();
        const agent = getAllAgents().find(a => a.id === id);
        if (!agent) return fallback;
        return {
            id: agent.id,
            name: agent.name || fallback.name,
            abbr: (agent.abbr || agent.name || '').slice(0, 2).toUpperCase() || fallback.abbr,
            logo: agent.logo || ''
        };
    } catch (error) {
        console.warn('Nie udało się odczytać wybranego agenta.', error);
        return fallback;
    }
}

window.getSelectedAgentMeta = getSelectedAgentMeta;

// Re-resolves every element that holds a raw link, so switching agent in
// settings updates open views without a reload.
function refreshAgentLinks() {
    document.querySelectorAll('[data-raw-link]').forEach(el => {
        const raw = el.getAttribute('data-raw-link');
        if (raw) el.href = buildAgentLink(raw);
    });

    // Przyciski agenta na kartach produktów — skrót i podpowiedź muszą
    // nadążać za wyborem z Ustawień bez przeładowania strony.
    const agent = getSelectedAgentMeta();
    document.querySelectorAll('[data-agent-btn]').forEach(btn => {
        btn.title = `Kup przez ${agent.name}`;
        const textEl = btn.querySelector('.pc-agent-text');
        if (textEl) {
            textEl.textContent = agent.abbr;
        } else if (agent.logo) {
            const img = btn.querySelector('img');
            if (img) { img.src = agent.logo; img.alt = agent.name; }
        }
    });
}

window.buildAgentLink = buildAgentLink;
window.getSelectedAgentId = getSelectedAgentId;
window.refreshAgentLinks = refreshAgentLinks;

// Settings > Agent picker. Built from getAllAgents() so admin-added agents
// show up without touching the markup.
function renderAgentPreferenceList() {
    const sub = document.getElementById('pref-agent-sub');
    if (!sub) return;

    const savedName = localStorage.getItem('pref_agent') || 'Litbuy';
    const activeId = agentNameToId(savedName);

    sub.innerHTML = '';
    getAllAgents().forEach(agent => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pref-sub-item' + (agent.id === activeId ? ' active' : '');
        btn.setAttribute('data-pref', 'agent');
        btn.setAttribute('data-val', agent.name);
        btn.setAttribute('data-abbr', agent.abbr || '');
        btn.setAttribute('data-url', agent.template || '');
        btn.innerHTML =
            `<span class="pref-sub-avatar">${escapeHtmlAttr(agent.abbr || '')}</span> ` +
            `${escapeHtmlAttr(agent.name)} <i class="fa-solid fa-check"></i>`;
        sub.appendChild(btn);
    });

    // Keep the collapsed row label in sync with what is actually selected.
    const valEl = document.getElementById('pref-agent-val');
    const avatarEl = document.getElementById('pref-agent-avatar');
    const active = findAgent(activeId);
    if (active) {
        if (valEl) valEl.textContent = active.name;
        if (avatarEl && active.abbr) avatarEl.textContent = active.abbr;
    }
}

window.renderAgentPreferenceList = renderAgentPreferenceList;

document.addEventListener('DOMContentLoaded', renderAgentPreferenceList);

/* ---------------------------------------------------------------
   Social links
   The floating sidebar used to be hardcoded with href="#".
--------------------------------------------------------------- */

const SOCIAL_LINKS_KEY = 'siteSocialLinks';

const SOCIAL_PLATFORMS = [
    { id: 'discord',   name: 'Discord',   icon: 'fa-brands fa-discord' },
    { id: 'tiktok',    name: 'TikTok',    icon: 'fa-brands fa-tiktok' },
    { id: 'instagram', name: 'Instagram', icon: 'fa-brands fa-instagram' },
    { id: 'youtube',   name: 'YouTube',   icon: 'fa-brands fa-youtube' },
    { id: 'x',         name: 'X',         icon: 'fa-brands fa-x-twitter' },
    { id: 'telegram',  name: 'Telegram',  icon: 'fa-brands fa-telegram' },
    { id: 'reddit',    name: 'Reddit',    icon: 'fa-brands fa-reddit' },
    { id: 'whatsapp',  name: 'WhatsApp',  icon: 'fa-brands fa-whatsapp' },
    { id: 'website',   name: 'Strona',    icon: 'fa-solid fa-globe' }
];

const SOCIAL_DEFAULTS = [
    { platform: 'discord', url: '', enabled: true },
    { platform: 'tiktok',  url: '', enabled: true }
];

function socialPlatform(id) {
    return SOCIAL_PLATFORMS.find(p => p.id === id) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];
}

function loadSocialLinks() {
    try {
        const raw = localStorage.getItem(SOCIAL_LINKS_KEY);
        if (!raw) return SOCIAL_DEFAULTS.map(l => ({ ...l }));
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(l => l && l.platform) : SOCIAL_DEFAULTS.map(l => ({ ...l }));
    } catch (error) {
        console.warn('Uszkodzona lista linków społecznościowych — używam domyślnych.', error);
        return SOCIAL_DEFAULTS.map(l => ({ ...l }));
    }
}

function saveSocialLinks(list) {
    localStorage.setItem(SOCIAL_LINKS_KEY, JSON.stringify(list || []));
}

// Only links that are enabled AND have a url are rendered — an empty href
// would give visitors a dead bubble.
function renderSocialSidebar() {
    const bar = document.querySelector('.social-sidebar');
    if (!bar) return;

    const links = loadSocialLinks().filter(l => l.enabled && String(l.url || '').trim());

    bar.innerHTML = '';
    if (links.length === 0) {
        bar.style.display = 'none';
        return;
    }
    bar.style.display = '';

    links.forEach(link => {
        const meta = socialPlatform(link.platform);
        const a = document.createElement('a');
        a.className = 'social-bubble';
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.title = meta.name;
        a.setAttribute('aria-label', meta.name);
        a.innerHTML = `<i class="${meta.icon}"></i>`;
        bar.appendChild(a);
    });
}

window.loadSocialLinks = loadSocialLinks;
window.saveSocialLinks = saveSocialLinks;
window.renderSocialSidebar = renderSocialSidebar;
window.SOCIAL_PLATFORMS = SOCIAL_PLATFORMS;

document.addEventListener('DOMContentLoaded', renderSocialSidebar);

document.addEventListener('DOMContentLoaded', () => {

    const agentDropdown = document.getElementById('agent-dropdown');
    const agentBtn      = document.getElementById('agent-btn');
    const agentNameEl   = document.getElementById('agent-name');
    const agentAvatarEl = document.getElementById('agent-avatar');
    const agentMenu     = document.getElementById('agent-menu');

    let selectedAgentId = 'litbuy';

    // Menu agentów — z getAllAgents(), więc agenci dodani w panelu też tu są
    window.renderConverterAgentMenu = function () {
        const menu = document.getElementById('agent-menu');
        if (!menu) return;
        menu.innerHTML = `<div class="agent-menu__label">SELECT AGENT</div>`;
        getAllAgents().forEach(agent => {
            const btn = document.createElement('button');
            btn.className = 'agent-item' + (agent.id === selectedAgentId ? ' active' : '');
            btn.setAttribute('data-agent', agent.id);
            btn.setAttribute('data-abbr', agent.abbr || '');
            btn.innerHTML = `<span class="agent-avatar">${escapeHtmlAttr(agent.abbr || '')}</span> ${escapeHtmlAttr(agent.name)} <i class="fa-solid fa-check agent-check"></i>`;
            menu.appendChild(btn);
        });
    };
    window.renderConverterAgentMenu();

    // Toggle dropdown
    if (agentBtn) {
        agentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (agentDropdown) agentDropdown.classList.toggle('open');
        });
    }

    // Wybór agenta + zamknięcie dropdowna
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.agent-item');
        if (item && agentMenu && agentMenu.contains(item)) {
            agentMenu.querySelectorAll('.agent-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            selectedAgentId = item.getAttribute('data-agent');
            const abbr = item.getAttribute('data-abbr');
            const name = item.textContent.replace(/\s*\uf00c\s*/g, '').trim();
            if (agentNameEl)   agentNameEl.textContent   = item.querySelector('.agent-avatar') ? item.querySelector('.agent-avatar').nextSibling?.textContent?.trim() || '' : name;
            if (agentAvatarEl) agentAvatarEl.textContent = abbr;
            if (agentDropdown) agentDropdown.classList.remove('open');
            return;
        }
        if (agentDropdown && !agentDropdown.contains(e.target)) {
            agentDropdown.classList.remove('open');
        }
    });

    // Convert button
    const convertBtn         = document.getElementById('convert-btn');
    const converterInput     = document.getElementById('converter-input');
    const converterResult    = document.getElementById('converter-result');
    const converterResultUrl = document.getElementById('converter-result-url');
    const converterCopyBtn   = document.getElementById('converter-copy-btn');
    const converterOpenBtn   = document.getElementById('converter-open-btn');

    function doConvert() {
        if (!converterInput) return;
        const raw = converterInput.value.trim();
        if (!raw) { converterInput.focus(); return; }

        const analysis = _conv_analyzeInput(raw);
        const finalUrl = _conv_buildResult(analysis, selectedAgentId);

        if (!finalUrl) {
            if (converterResult) {
                converterResult.classList.remove('hidden');
                if (converterResultUrl) converterResultUrl.textContent = 'Nie można przetworzyć tego linku.';
            }
            return;
        }

        if (converterResultUrl) converterResultUrl.textContent = finalUrl;
        if (converterOpenBtn)   converterOpenBtn.href = finalUrl;
        if (converterResult)    converterResult.classList.remove('hidden');
    }

    if (convertBtn)     convertBtn.addEventListener('click', doConvert);
    if (converterInput) converterInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doConvert(); });

    if (converterCopyBtn) {
        converterCopyBtn.addEventListener('click', () => {
            const url = converterResultUrl ? converterResultUrl.textContent : '';
            if (!url || url === 'Nie można przetworzyć tego linku.') return;
            navigator.clipboard.writeText(url).then(() => {
                converterCopyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(() => converterCopyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy', 2000);
            });
        });
    }

    // =========================================
    // QC FINDER — Picks.ly API
    // =========================================
    const qcBtn   = document.getElementById('qc-btn');
    const qcInput = document.getElementById('qc-input');

    function _qc_buildGallery(albums) {
        if (!albums || !albums.length) return null;

        // Zbierz wszystkie zdjęcia z wszystkich albumów
        const allImages = albums.flatMap(album => album.images || []).filter(Boolean);
        if (!allImages.length) return null;

        let currentQcIndex = 0;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'width:100%;max-width:900px;margin:0 auto;padding:0 2rem 4rem;';

        // Licznik
        const counter = document.createElement('p');
        counter.style.cssText = 'text-align:center;font-size:0.8rem;color:rgba(255,255,255,0.35);margin-bottom:1.5rem;';
        counter.textContent = `Znaleziono ${allImages.length} zdjęć QC`;
        wrapper.appendChild(counter);

        // Grid zdjęć
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.75rem;';

        allImages.forEach((imgUrl, idx) => {
            const card = document.createElement('div');
            card.style.cssText = 'aspect-ratio:1/1;overflow:hidden;border-radius:12px;background:#111;border:1px solid rgba(255,255,255,0.07);cursor:pointer;';

            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = `QC ${idx + 1}`;
            img.loading = 'lazy';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease;';
            img.onerror = () => { card.style.display = 'none'; };
            card.addEventListener('mouseenter', () => { img.style.transform = 'scale(1.05)'; });
            card.addEventListener('mouseleave', () => { img.style.transform = 'scale(1)'; });
            card.addEventListener('click', () => _qc_openLightbox(allImages, idx));

            card.appendChild(img);
            grid.appendChild(card);
        });
        wrapper.appendChild(grid);
        return wrapper;
    }

    // Lightbox
    function _qc_openLightbox(images, startIndex) {
        let idx = startIndex;
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(8px);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;';

        const close = document.createElement('button');
        close.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        close.style.cssText = 'position:absolute;top:1.5rem;right:1.5rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;width:40px;height:40px;border-radius:10px;font-size:1.1rem;cursor:pointer;';
        close.addEventListener('click', () => document.body.removeChild(overlay));
        overlay.appendChild(close);

        const imgEl = document.createElement('img');
        imgEl.style.cssText = 'max-width:90vw;max-height:80vh;object-fit:contain;border-radius:12px;user-select:none;';
        overlay.appendChild(imgEl);

        const nav = document.createElement('div');
        nav.style.cssText = 'display:flex;align-items:center;gap:1.5rem;margin-top:1.5rem;';

        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.style.cssText = 'background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;width:40px;height:40px;border-radius:10px;font-size:1rem;cursor:pointer;';

        const info = document.createElement('span');
        info.style.cssText = 'color:rgba(255,255,255,0.5);font-size:0.85rem;min-width:60px;text-align:center;';

        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.style.cssText = 'background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;width:40px;height:40px;border-radius:10px;font-size:1rem;cursor:pointer;';

        function update() {
            imgEl.src = images[idx];
            info.textContent = `${idx + 1} / ${images.length}`;
            prevBtn.style.opacity = idx === 0 ? '0.3' : '1';
            nextBtn.style.opacity = idx === images.length - 1 ? '0.3' : '1';
        }

        prevBtn.addEventListener('click', () => { if (idx > 0) { idx--; update(); } });
        nextBtn.addEventListener('click', () => { if (idx < images.length - 1) { idx++; update(); } });

        // Swipe support
        let touchStartX = 0;
        overlay.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        overlay.addEventListener('touchend', e => {
            const delta = e.changedTouches[0].clientX - touchStartX;
            if (delta > 50 && idx > 0) { idx--; update(); }
            if (delta < -50 && idx < images.length - 1) { idx++; update(); }
        });

        // Keyboard support
        const keyHandler = (e) => {
            if (e.key === 'ArrowLeft'  && idx > 0) { idx--; update(); }
            if (e.key === 'ArrowRight' && idx < images.length - 1) { idx++; update(); }
            if (e.key === 'Escape') { document.body.removeChild(overlay); document.removeEventListener('keydown', keyHandler); }
        };
        document.addEventListener('keydown', keyHandler);
        overlay.addEventListener('click', e => { if (e.target === overlay) { document.body.removeChild(overlay); document.removeEventListener('keydown', keyHandler); } });

        nav.appendChild(prevBtn);
        nav.appendChild(info);
        nav.appendChild(nextBtn);
        overlay.appendChild(nav);

        document.body.appendChild(overlay);
        update();
    }

    async function doQcSearch() {
        if (!qcInput) return;
        const url = qcInput.value.trim();
        if (!url) { qcInput.focus(); return; }

        const placeholder = document.getElementById('qc-placeholder');
        const results     = document.getElementById('qc-results');
        if (!results) return;

        // Pokaż loading
        if (placeholder) placeholder.style.display = 'none';
        results.classList.remove('hidden');
        results.innerHTML = `
            <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.4);">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;margin-bottom:1rem;display:block;"></i>
                Szukam zdjęć QC...
            </div>`;

        try {
            // Wyczyść URL z parametrów agentów (wyciągnij oryginalny link)
            const analysis = _conv_analyzeInput(url);
            const cleanUrl = analysis.originalUrl || url;

            const apiUrl = `https://partner.picks.ly/api/qc/search?url=${encodeURIComponent(cleanUrl)}`;
            const resp = await fetch(apiUrl, {
                headers: { 'Accept': 'application/json' }
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();

            if (!data.success || !data.albums || !data.albums.length) {
                results.innerHTML = `
                    <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">
                        <span style="font-size:2rem;display:block;margin-bottom:1rem;">📷</span>
                        Nie znaleziono zdjęć QC dla tego produktu.
                    </div>`;
                return;
            }

            results.innerHTML = '';
            const gallery = _qc_buildGallery(data.albums);
            if (gallery) {
                results.appendChild(gallery);
            } else {
                results.innerHTML = `<div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">Brak zdjęć w odpowiedzi API.</div>`;
            }

        } catch (err) {
            console.error('QC Search error:', err);
            results.innerHTML = `
                <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">
                    <span style="font-size:2rem;display:block;margin-bottom:1rem;">⚠️</span>
                    <strong style="color:rgba(255,255,255,0.6);">Błąd połączenia z API QC</strong><br>
                    <small style="margin-top:0.5rem;display:block;">Sprawdź czy link jest poprawny i spróbuj ponownie.</small>
                </div>`;
        }
    }

    if (qcBtn)   qcBtn.addEventListener('click', doQcSearch);
    if (qcInput) qcInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doQcSearch(); });
});


// =========================================
// SCROLL REVEAL — IntersectionObserver
// =========================================
(function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
        // fallback — pokaż wszystko natychmiast
        document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in-view'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0,
        rootMargin: '0px 0px -40px 0px' // trigger lekko przed dolną krawędzią
    });

    // Obserwuj wszystkie elementy z data-reveal
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));

    // Re-observe gdy nowe elementy wejdą do DOM (np. po zmianie widoku)
    const mutObs = new MutationObserver(() => {
        document.querySelectorAll('[data-reveal]:not(.in-view)').forEach(el => {
            observer.observe(el);
        });
    });
    mutObs.observe(document.body, { childList: true, subtree: true });
})();


// =========================================
// NAV — aktywne stany + Produkty link
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const navProductsBtn = document.getElementById('nav-products-btn');
    if (navProductsBtn) {
        navProductsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.showView('products-view');
            loadProductsGrid();
            setNavActive('products');
        });
    }

    const heroSellerBtn = document.getElementById('nav-sellers-hero-btn');
    if (heroSellerBtn) {
        heroSellerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.showView('sellers-view');
            setNavActive('sellers');
        });
    }

    const footerHome     = document.getElementById('footer-home-btn');
    const footerProducts = document.getElementById('footer-products-btn');
    const footerSellers  = document.getElementById('footer-sellers-btn');
    if (footerHome)     footerHome.addEventListener('click',     e => { e.preventDefault(); window.showView('home-view');     setNavActive('home'); });
    if (footerProducts) footerProducts.addEventListener('click', e => { e.preventDefault(); window.showView('products-view'); loadProductsGrid(); setNavActive('products'); });
    if (footerSellers)  footerSellers.addEventListener('click',  e => { e.preventDefault(); window.showView('sellers-view');  loadSellersGrid();  setNavActive('sellers'); });

    const navSellersBtn = document.getElementById('nav-sellers-btn');
    if (navSellersBtn) navSellersBtn.addEventListener('click', () => { setNavActive('sellers'); loadSellersGrid(); });


    // Privacy Policy Modal
    const privacyModal    = document.getElementById('privacy-modal');
    const closePrivacyBtn = document.getElementById('close-privacy-modal');
    function openPrivacyModal(e) {
        if (e) e.preventDefault();
        if (privacyModal) { privacyModal.classList.remove('hidden'); document.body.classList.add('modal-open'); }
    }
    function closePrivacyModal() {
        if (privacyModal) { privacyModal.classList.add('hidden'); document.body.classList.remove('modal-open'); }
    }
    const privBtn2 = document.getElementById('footer-privacy-btn2');
    if (privBtn2) privBtn2.addEventListener('click', openPrivacyModal);
    if (closePrivacyBtn) closePrivacyBtn.addEventListener('click', closePrivacyModal);
    if (privacyModal) privacyModal.addEventListener('click', e => { if (e.target === privacyModal) closePrivacyModal(); });

    // init footer visibility
    const footer = document.getElementById('site-footer');
    if (footer) footer.style.display = 'block'; // home is active on load
});


function setNavActive(view) {
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('nav-active'));
    const map = { 'home': 'nav-home-btn', 'products': 'nav-products-btn', 'sellers': 'nav-sellers-btn' };
    if (map[view]) {
        const el = document.getElementById(map[view]);
        if (el) el.classList.add('nav-active');
    }
}

// =========================================
// SELLERS — Supabase CRUD
// =========================================
async function getSellers() {
    // Try Supabase first
    const sellers = await getSellersFromDB();
    if (sellers && sellers.length > 0) {
        return sellers;
    }
    // Fallback to localStorage
    try { return JSON.parse(localStorage.getItem('custom_sellers') || '[]'); }
    catch { return []; }
}
async function saveSellers(arr) {
    localStorage.setItem('custom_sellers', JSON.stringify(arr));
    console.warn('saveSellers() is deprecated - use saveSellerToDB() instead');
}

function buildSellerCard(seller) {
    const initial = (seller.name || '?')[0].toUpperCase();
    const brandsArr = (seller.brands || '').split(',').map(b => b.trim()).filter(Boolean);
    const tagsHtml = brandsArr.slice(0,4).map(b =>
        `<span class="seller-tag-premium">${b}</span>`
    ).join('');
    const card = document.createElement('div');
    card.className = 'seller-card-premium';
    card.setAttribute('data-brands', seller.brands || '');
    card.setAttribute('data-seller-id', seller.id);
    card.innerHTML = `
        <div class="seller-header">
            <div class="seller-avatar-initial">${initial}</div>
            <div class="seller-info">
                <h3>${seller.name} <span class="top-rated-star"><i class="fa-solid fa-star"></i> Top rated</span></h3>
            </div>
        </div>
        <p class="seller-desc">${seller.desc || ''}</p>
        <div class="seller-tags-premium">${tagsHtml}</div>
        <a href="${seller.link || '#'}" target="_blank" class="seller-btn-premium">Odwiedź Sklep</a>
    `;
    return card;
}

async function loadSellersGrid() {
    const custom = await getSellers();
    if (!custom.length) return;
    const grid = document.getElementById('sellers-grid');
    if (!grid) return;
    // usuń stare custom karty
    grid.querySelectorAll('[data-seller-id]').forEach(c => c.remove());
    // dodaj nowe na początku
    custom.forEach(seller => {
        const card = buildSellerCard(seller);
        grid.insertBefore(card, grid.firstChild);
    });
}

async function adminAddSeller(e) {
    e.preventDefault();
    const name   = document.getElementById('seller-name').value.trim();
    const desc   = document.getElementById('seller-desc-input').value.trim();
    const brands = document.getElementById('seller-brands').value.trim();
    const link   = document.getElementById('seller-link').value.trim();
    if (!name) return;
    
    const newSeller = { 
        name, 
        description: desc, 
        brands: brands.split(',').map(b => b.trim()), 
        shop_url: link,
        top_rated: false
    };
    
    const saved = await saveSellerToDB(newSeller);
    
    if (saved) {
        document.getElementById('add-seller-modal').classList.add('hidden');
        document.getElementById('add-seller-form').reset();
        await loadAdminSellers();
        await loadSellersGrid();
        showToast('Sprzedawca dodany!', 'success');
    } else {
        showToast('Błąd podczas dodawania sprzedawcy', 'error');
    }
}

async function deleteAdminSeller(id) {
    if (!confirm('Usunąć tego sprzedawcę?')) return;
    
    const success = await deleteSellerFromDB(id);
    
    if (success) {
        await loadAdminSellers();
        // odświeżamy kartę w sellers-view
        document.querySelectorAll(`[data-seller-id="${id}"]`).forEach(el => el.remove());
        showToast('Sprzedawca usunięty', 'success');
    } else {
        showToast('Błąd podczas usuwania sprzedawcy', 'error');
    }
}

async function loadAdminSellers() {
    const tbody = document.getElementById('admin-sellers-tbody');
    if (!tbody) return;
    const sellers = await getSellers();
    if (!sellers.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted)">Brak dodanych sprzedawców. Kliknij "Dodaj Sprzedawcę".</td></tr>`;
        return;
    }
    tbody.innerHTML = '';
    sellers.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color:#fff">${s.name}</strong><br><small style="color:rgba(255,255,255,0.4)">${s.desc?.slice(0,50)}...</small></td>
            <td style="color:rgba(255,255,255,0.5);font-size:0.8rem">${(s.brands||'').slice(0,40)}</td>
            <td><a href="${s.link}" target="_blank" style="color:rgba(255,255,255,0.4);font-size:0.8rem;word-break:break-all">${s.link?.slice(0,30)}...</a></td>
            <td>
                <button class="action-btn delete" onclick="deleteAdminSeller(${s.id})" title="Usuń"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Admin sellers init
document.addEventListener('DOMContentLoaded', () => {
    // Open/close modal
    const openBtn  = document.getElementById('open-add-seller-btn');
    const closeBtn = document.getElementById('close-add-seller');
    if (openBtn)  openBtn.addEventListener('click', () => document.getElementById('add-seller-modal').classList.remove('hidden'));
    if (closeBtn) closeBtn.addEventListener('click', () => document.getElementById('add-seller-modal').classList.add('hidden'));

    // Admin sellers search
    const adminSearch = document.getElementById('admin-sellers-search');
    if (adminSearch) {
        adminSearch.addEventListener('input', () => {
            const q = adminSearch.value.toLowerCase();
            document.querySelectorAll('#admin-sellers-tbody tr').forEach(tr => {
                tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
    }

    // Load sellers grid on sellers-view open
    loadSellersGrid();
});

// Patch admin panel view switching to load sellers
const _origAdminLinks = document.querySelectorAll('.admin-link');


// =========================================
// PREFERENCES MODAL
// =========================================
document.addEventListener('DOMContentLoaded', () => {

    // Toggle sub-panels on row click
    ['currency', 'lang', 'agent'].forEach(key => {
        const row = document.getElementById(`pref-${key}-row`);
        const sub = document.getElementById(`pref-${key}-sub`);
        if (!row || !sub) return;
        row.addEventListener('click', () => {
            const isOpen = !sub.classList.contains('hidden');
            // close all
            document.querySelectorAll('.pref-sub').forEach(s => s.classList.add('hidden'));
            document.querySelectorAll('.pref-row').forEach(r => r.classList.remove('open'));
            if (!isOpen) {
                sub.classList.remove('hidden');
                row.classList.add('open');
            }
        });
    });

    // Sub-item selection
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.pref-sub-item');
        if (!item) return;
        const pref = item.getAttribute('data-pref');
        const val  = item.getAttribute('data-val');

        // update active
        item.closest('.pref-sub').querySelectorAll('.pref-sub-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // update row value
        const valEl = document.getElementById(`pref-${pref}-val`);
        if (valEl) valEl.textContent = val;

        // agent avatar
        if (pref === 'agent') {
            const abbr = item.getAttribute('data-abbr');
            const avatar = document.getElementById('pref-agent-avatar');
            if (avatar && abbr) avatar.textContent = abbr;
            // save globally for converter
            window._selectedAgentUrl = item.getAttribute('data-url') || '';

            // localStorage is written a few lines below, so resolve against
            // the freshly picked value rather than the stale stored one.
            if (typeof refreshAgentLinks === 'function') {
                localStorage.setItem('pref_agent', val);
                refreshAgentLinks();
            }
        }

        // language
        if (pref === 'lang') {
            const lang = item.getAttribute('data-lang');
            if (lang && typeof setLanguage === 'function') {
                setLanguage(lang);
            }
        }

        // save to localStorage
        localStorage.setItem(`pref_${pref}`, val);

        // close sub after short delay
        setTimeout(() => {
            item.closest('.pref-sub').classList.add('hidden');
            document.querySelectorAll('.pref-row').forEach(r => r.classList.remove('open'));
        }, 250);
    });

    // Load saved prefs
    ['currency', 'lang', 'agent'].forEach(key => {
        const saved = localStorage.getItem(`pref_${key}`);
        if (!saved) return;
        const valEl = document.getElementById(`pref-${key}-val`);
        if (valEl) valEl.textContent = saved;
        // mark active
        const sub = document.getElementById(`pref-${key}-sub`);
        if (sub) {
            sub.querySelectorAll('.pref-sub-item').forEach(i => {
                i.classList.toggle('active', i.getAttribute('data-val') === saved);
            });
        }
        if (key === 'agent') {
            const activeItem = document.querySelector(`#pref-agent-sub .pref-sub-item.active`);
            if (activeItem) {
                const abbr = activeItem.getAttribute('data-abbr');
                const avatar = document.getElementById('pref-agent-avatar');
                if (avatar && abbr) avatar.textContent = abbr;
                window._selectedAgentUrl = activeItem.getAttribute('data-url') || '';
            }
        }
    });
});

/* ==== FXTRK:CORE START ==== */
/*
 * Sekcja CORE modułu śledzenia — wyłącznie tabele danych i funkcje czyste.
 * Zero odwołań do drzewa strony, adresu strony i sieci. Jedyny kontakt
 * z globalnym środowiskiem to końcowe przypisanie obiektu FXTRK_CORE.
 * Sekcja jest wycinana między znacznikami i uruchamiana w izolacji przez testy.
 */
(function () {
    'use strict';

    /* ── Tabela tłumaczeń statusów przewoźnika na język polski ───────────── */
    var FXTRK_STATUS_PL = {
        'The shipment has been successfully delivered': 'Przesyłka została pomyślnie dostarczona',
        'The shipment has been successfully delivereddelivered': 'Przesyłka została pomyślnie dostarczona',
        'The shipment has been loaded onto the delivery vehicle': 'Przesyłka została załadowana na pojazd dostawczy',
        'The shipment has been loaded onto the delivery vehiclepickup': 'Przesyłka została załadowana na pojazd dostawczy',
        'The shipment is being prepared for delivery in the delivery depot': 'Przesyłka jest przygotowywana do doręczenia w magazynie dostaw',
        'The shipment is being prepared for delivery in the delivery depotpickup': 'Przesyłka jest przygotowywana do doręczenia w magazynie dostaw',
        'The shipment has been processed in the parcel center': 'Przesyłka została przetworzona w centrum dystrybucyjnym',
        'The shipment has been processed in the parcel centertransit': 'Przesyłka została przetworzona w centrum dystrybucyjnym',
        'The shipment has arrived in the destination country/destination area': 'Przesyłka dotarła do kraju docelowego',
        'The shipment arrived in the region of recipient and will be transported to the delivery base in the next step': 'Przesyłka dotarła do regionu odbiorcy i zostanie przetransportowana do bazy dostaw w następnym kroku',
        'The shipment arrived in the region of recipient and will be transported to the delivery base in the next step.transit': 'Przesyłka dotarła do regionu odbiorcy i zostanie przetransportowana do bazy dostaw w następnym kroku',
        'The international shipment has been processed in the export parcel center': 'Przesyłka międzynarodowa została przetworzona w centrum eksportu',
        'The international shipment has been processed in the export parcel centertransit': 'Przesyłka międzynarodowa została przetworzona w centrum eksportu',
        'The international shipment has been processed in the parcel center of origin': 'Przesyłka międzynarodowa została przetworzona w centrum nadania',
        'The international shipment has been processed in the parcel center of origintransit': 'Przesyłka międzynarodowa została przetworzona w centrum nadania',
        'The shipment has been processed in the destination parcel center': 'Przesyłka została przetworzona w docelowym centrum obsługi paczek',
        'Loaded to movement / tour vehicle': 'Załadowany do pojazdu transportowego',
        'Movement / tour vehicle arrived': 'Przybył pojazd transportowy',
        'Unloaded from movement / tour vehicle': 'Rozładunek z pojazdu transportowego',
        'Pick-up was successful.': 'Odbiór przebiegł pomyślnie',
        'Shipment information received': 'Otrzymane informacje o przesyłce',
        'Electronic information received': 'Otrzymano informacje o przesyłce',
        'Delivered': 'Dostarczono',
        'Delivered successfully': 'Dostarczone pomyślnie',
        'Your parcel has been delivered successfully': 'Twoja paczka została pomyślnie dostarczona',
        'Your parcel has been delivered successfully.': 'Twoja przesyłka została pomyślnie dostarczona',
        'Your parcel is out for delivery': 'Twoja paczka jest w drodze do dostawy',
        'Out for delivery': 'W drodze do dostawy',
        'At parcel delivery centre': 'W centrum dostaw',
        'At parcel delivery centre.': 'Przesyłka w centrum doręczeń',
        'In transit': 'W tranzycie',
        'Item in transit': 'Przesyłka w transporcie',
        'Your parcel is on its way': 'Twoja paczka jest w drodze',
        'Your parcel is ready to leave our hub': 'Twoja paczka jest gotowa do opuszczenia naszego centrum',
        'Your parcel is ready to be transported to our next premises': 'Twoja paczka jest gotowa do transportu do następnego centrum',
        'Your parcel arrived at our depot': 'Twoja paczka dotarła do naszego magazynu',
        'Your parcel delivery date has changed': 'Data dostawy Twojej paczki została zmieniona',
        'Your parcel is estimated to be delivered on': 'Przewidywana dostawa Twojej paczki',
        'The parcel has left the parcel delivery centre and is on its way to the consignee': 'Paczka opuściła centrum dostaw i jest w drodze do odbiorcy',
        'The parcel has left the parcel delivery centre and is on its way to the consignee.': 'Przesyłka opuściła centrum doręczeń i jest w drodze do odbiorcy',
        'The parcel is at the parcel dispatch centre': 'Paczka znajduje się w centrum dystrybucyjnym',
        'The parcel is at the parcel dispatch centre.': 'Przesyłka w centrum wysyłkowym',
        'Odprawa celna zakończona pending scanning': 'Odprawa celna zakończona, oczekuje na skanowanie',
        'Customs clearance completed pending scanning': 'Odprawa celna zakończona, oczekuje na skanowanie',
        'Customs clearance completed, waiting for extraction of Customs clearance pending scanning': 'Odprawa celna zakończona, oczekuje na skanowanie',
        'Customs clearance completed': 'Odprawa celna zakończona',
        'Customs clearance in progress': 'Trwa odprawa celna',
        'Export customs clearance completed': 'Eksportowa odprawa celna zakończona',
        'Item have been cleared': 'Przedmiot został odprawiony',
        'Item start customs clearance': 'Rozpoczęto odprawę celną przedmiotu',
        'Item arrived at destination': 'Przedmiot dotarł do celu',
        'Item departed from origin': 'Przedmiot opuścił miejsce nadania',
        'Item outbound in sorting center': 'Przedmiot wyszedł z centrum sortowniczego',
        'The goods have been shipped out': 'Towary zostały wysłane',
        'Goods have been received': 'Towary zostały odebrane',
        'Hand over service provider': 'Przekazano dostawcy usług',
        'Leaving the warehouse and shipping to the logistics provider': 'Opuszczenie magazynu i wysyłka do dostawcy logistycznego',
        'Packaging completed': 'Pakowanie zakończone',
        'Forecasted': 'Prognozowane',
        'Pre-advised': 'Otrzymano dane elektroniczne',
        'Leave the scan': 'Skanowanie wyjścia',
        'Receiving Scan': 'Skanowanie odbioru',
        'Receiving scan': 'Skan odbioru',
        'Departure scan': 'Skan wyjazdu',
        'Pending pickup': 'Oczekuje na odbiór',
        'Loaded on aircraft': 'Załadowano na samolot',
        'Dismantling the board': 'Demontaż z pokładu',
        'Arrived at destination airport': 'Przesyłka dotarła na lotnisko docelowe',
        'The flight has arrived': 'Lot dotarł',
        'Flight has arrived': 'Lot dotarł',
        'Flight has departed': 'Lot odleciał',
        'Expected flight on July 9st': 'Przewidywany lot 9 lipca',
        'The instruction data for this shipment have been provided by the sender to DHL electronically': 'Dane przesyłki zostały przesłane elektronicznie przez nadawcę do DHL',
        'The instruction data for this shipment have been provided by the sender to DHL electronicallytransit': 'Dane przesyłki zostały przesłane elektronicznie przez nadawcę do DHL',
        'The goods leave the operation center': 'Przesyłka opuściła centrum operacyjne',
        'Arrived at the operating center': 'Przesyłka dotarła do centrum operacyjnego',
        'The goods have arrived at the operation center': 'Towar dotarł do centrum operacyjnego',
        'General Office': 'Centrala',
        'Branch Office': 'Oddział',
        'Distribution Center': 'Centrum dystrybucji',
        'Transit Center': 'Centrum tranzytowe',
        'Operations Center': 'Centrum operacyjne',
        'Departed': 'Wyjechało',
        'Arrived': 'Przybyło',
        '已交仓，等待扫描提取': 'Dostarczone do magazynu, oczekuje na skanowanie i odbiór',
        '清关完成，等待交仓': 'Odprawa celna zakończona, przesyłka oczekuje na przekazanie do magazynu',
        '清关中': 'Przesyłka w trakcie odprawy celnej',
        '已落地，待清关': 'Przesyłka wylądowała, oczekuje na odprawę celną',
        '过港中，航班待定': 'Przesyłka w tranzycie, lot do potwierdzenia',
        '货物电子信息已经收到': 'Otrzymano elektroniczne informacje o przesyłce',
        '清关完成,等待提取Customs clearance completed pending scanning': 'Odprawa celna zakończona, oczekuje na skanowanie i odbiór',
        '航班已抵达Flight has arrived': 'Lot dotarł',
        '航班已起飞Flight has departed': 'Lot odleciał',
        '航班已起飞': 'Lot odleciał',
        '交货服务商': 'Dostawca usług dostawy',
        '清关完成': 'Odprawa celna zakończona',
        '航班排航中': 'Loty są w trakcie planowania',
        '货物移交航司': 'Przekazanie ładunku przewoźnikowi',
        '货物已出货': 'Wysłane towary',
        '航班已抵达': 'Lot dotarł',
        '货物已收货': 'Otrzymane towary',
        '到达【AMS】': 'Przyjazd do [AMS]',
        '出发【上海】': 'Wylot [Szanghaj]',
        '出口清关完毕': 'Zakończono odprawę celną eksportową',
        '包裹到达始发地海关【上海】，等待清关': 'Przesyłka dociera do urzędu celnego w miejscu nadania [Szanghaj] i oczekuje na odprawę celną',
        '快件到达机场': 'Ekspres przyjeżdża na lotnisko',
        '包裹发出仓库': 'Przesyłka została wysłana z magazynu',
        '货物离开操作中心': 'Towar opuszcza centrum operacyjne',
        '到达操作中心': 'Dotarłem do centrum operacyjnego',
        '已收到发货信息': 'Otrzymano informację o wysyłce',
        '目的国清关完成': 'Odprawa celna w miejscu przeznaczenia zakończona',
        '预计7-9号航班起飞': 'Przewidywany lot 9 lipca'
    };

    /* ── Odwzorowanie chińskich fraz na angielskie (bez de/es/zh) ─────────── */
    var FXTRK_CHINESE_TO_EN = {
        // Miasta i regiony
        '深圳': 'Shenzhen',
        '广州': 'Guangzhou',
        '上海': 'Shanghai',
        '北京': 'Beijing',
        '香港': 'Hong Kong',
        '杭州': 'Hangzhou',
        '义乌': 'Yiwu',
        '宁波': 'Ningbo',
        '成都': 'Chengdu',
        '武汉': 'Wuhan',
        '天津': 'Tianjin',
        '西安': 'Xian',
        '重庆': 'Chongqing',
        // Węzły i terminy firmowe
        '总公司': 'General Office',
        '分公司': 'Branch Office',
        '集散中心': 'Distribution Center',
        '转运中心': 'Transit Center',
        '操作中心': 'Operations Center',
        // Statusy — klucze zgodne z angielskimi kluczami tabeli statusów
        '已签收': 'Delivered',
        '签收': 'Delivered',
        '已揽收': 'Pick-up was successful.',
        '揽收': 'Pick-up was successful.',
        '派送中': 'Out for delivery',
        '派送': 'Out for delivery',
        '运输中': 'Item in transit',
        '在途中': 'Item in transit',
        '航班已起飞': 'Flight has departed',
        '航班已抵达': 'Flight has arrived',
        '清关完成': 'Customs clearance completed',
        '出口清关完成': 'Export customs clearance completed',
        '等待提取': 'Pending pickup',
        '离开扫描': 'Departure scan',
        '收货扫描': 'Receiving scan',
        '已预报': 'Pre-advised',
        '拆板中': 'Dismantling the board',
        '装机': 'Loaded on aircraft',
        // Pozostałe słowa (najpierw tłumaczone, potem usuwane znaki CJK)
        '预计': 'Est.',
        '号航班': ' flight',
        '到达': 'Arrived',
        '出发': 'Departed',
        '离开': 'Departed'
    };

    /* ── Kody krajów i ich nazwy wielkimi literami ────────────────────────── */
    var FXTRK_COUNTRY_MAP = {
        'PL': 'POLSKA',
        'DE': 'NIEMCY',
        'CN': 'CHINY',
        'NL': 'HOLANDIA',
        'GB': 'WIELKA BRYTANIA',
        'US': 'USA',
        'FR': 'FRANCJA',
        'ES': 'HISZPANIA',
        'IT': 'WŁOCHY',
        'BE': 'BELGIA',
        'CZ': 'CZECHY',
        'SK': 'SŁOWACJA',
        'HU': 'WĘGRY',
        'AT': 'AUSTRIA'
    };

    /* ── Reguły miast → kraj ──────────────────────────────────────────────
     * Kolejność pozycji tablicy jest kolejnością rozstrzygania konfliktu,
     * gdy tekst lokalizacji zawiera miasta z różnych krajów: CN, PL, DE, NL.
     * Nazwy miast zapisane małymi literami — porównanie na tekście
     * sprowadzonym do małych liter.
     */
    var FXTRK_CITY_RULES = [
        {
            code: 'CN',
            cities: [
                'shanghai', 'szanghaj', '上海',
                'shenzhen', '深圳',
                'putian', '莆田',
                'beijing', '北京', 'pekin'
            ]
        },
        {
            code: 'PL',
            cities: [
                'poznan', 'poznań',
                'stalowa wola',
                'warszawa',
                'stryków', 'strykow',
                'rudnik'
            ]
        },
        {
            code: 'DE',
            cities: [
                'bremen', 'brema',
                'hamburg'
            ]
        },
        {
            code: 'NL',
            cities: [
                'oirschot',
                'vijfhuizen',
                'veenendaal'
            ]
        }
    ];

    /* ── Ogólne nazwy krajów pojawiające się jako cała lokalizacja ────────── */
    var FXTRK_GENERIC_COUNTRY_LABELS = {
        'holandia': 'NL',
        'holland': 'NL',
        'netherlands': 'NL',
        'polska': 'PL',
        'poland': 'PL',
        'niemcy': 'DE',
        'germany': 'DE',
        'chiny': 'CN',
        'china': 'CN'
    };

    /* ── Kamienie milowe ─────────────────────────────────────────────────────
     * Kolejność tablicy jest znacząca: od `delivered` do `packaging`.
     * Pierwsze dopasowanie wygrywa (wymaganie 5.1).
     * Wzorce zapisane małymi literami — dopasowanie po podłańcuchu na
     * złączeniu pól Status i Lokalizacja sprowadzonym do małych liter.
     * Obok wzorców angielskich i chińskich listy zawierają polskie
     * odpowiedniki, ponieważ pola Status i Lokalizacja przychodzą
     * z Funkcji_Śledzenia już po polsku.
     */
    var FXTRK_MILESTONES = [
        {
            key: 'delivered',
            patterns: [
                'delivered successfully', 'successfully delivered', 'delivery successful',
                'delivered.', 'dostarczono', 'dostarczona', 'pomyślnie dostarczona',
                'przesyłka została pomyślnie dostarczona', 'dostarczone pomyślnie',
                'twoja paczka została pomyślnie dostarczona',
                '已签收', '签收'
            ],
            minDays: 0,
            maxDays: 0,
            labelPl: 'DOSTARCZONO',
            labelEn: 'DELIVERED'
        },
        {
            key: 'out_for_delivery',
            patterns: [
                'out for delivery', 'being delivered', 'loaded to movement',
                'loaded onto the delivery vehicle', 'on its way to the consignee',
                'załadowana na pojazd dostawczy', 'w drodze do dostawy',
                'w drodze do odbiorcy', 'przekazano do doręczenia',
                'załadowany do pojazdu transportowego'
            ],
            minDays: 0,
            maxDays: 1,
            labelPl: 'W DOSTAWIE',
            labelEn: 'OUT FOR DELIVERY'
        },
        {
            key: 'at_delivery_depot',
            patterns: [
                'at parcel delivery centre', 'parcel delivery centre',
                'being prepared for delivery in the delivery depot',
                'shipment processed at delivery depot',
                'parcel center',
                'przygotowywana do doręczenia w magazynie dostaw',
                'w centrum dostaw', 'w centrum doręczeń',
                'w centrum dystrybucyjnym', 'w centrum wysyłkowym'
            ],
            minDays: 1,
            maxDays: 2,
            labelPl: 'W CENTRUM DOSTAWY',
            labelEn: 'AT DELIVERY DEPOT'
        },
        {
            key: 'arrived_destination',
            patterns: [
                'arrived in the destination country',
                'destination country/destination area',
                'ruda slaska', 'strykow', 'stalowa wola', 'dobra', 'poznan',
                '(pl)', 'poland, the shipment',
                'dotarła do kraju docelowego', 'dotarła do regionu odbiorcy',
                'polska'
            ],
            minDays: 1,
            maxDays: 3,
            labelPl: 'W KRAJU DOCELOWYM',
            labelEn: 'IN DESTINATION COUNTRY'
        },
        {
            key: 'in_germany',
            patterns: [
                'germany, germany', 'germany, the international', 'germany, the shipment',
                'frankfurt', 'hamburg', 'duisburg', 'mörsdorf',
                'parcel center of origin', 'export parcel center',
                'przetworzona w centrum nadania', 'przetworzona w centrum eksportu',
                'brema', 'niemcy'
            ],
            minDays: 2,
            maxDays: 4,
            labelPl: 'W NIEMCZECH',
            labelEn: 'IN GERMANY'
        },
        {
            key: 'handed_to_courier',
            patterns: [
                'in transit to dhl', 'shipment is in transit to dhl', 'transit to dhl',
                'hand over service provider', 'handed to dhl', 'pick-up was successful',
                'odbiór przebiegł pomyślnie', 'przekazano dostawcy usług',
                'dostawca usług dostawy'
            ],
            minDays: 2,
            maxDays: 5,
            labelPl: 'PRZEKAZANO DO KURIERA',
            labelEn: 'HANDED TO COURIER'
        },
        {
            key: 'customs_cleared',
            patterns: [
                'customs clearance completed', 'item have been cleared',
                'cleared customs', 'customs clearance pending scanning',
                'odprawa celna zakończona', 'przedmiot został odprawiony',
                'odprawa celna w miejscu przeznaczenia zakończona',
                '清关完成'
            ],
            minDays: 3,
            maxDays: 6,
            labelPl: 'ODPRAWA CELNA ZAKOŃCZONA',
            labelEn: 'CUSTOMS CLEARED'
        },
        {
            key: 'flight_arrived',
            patterns: [
                'flight has arrived', 'the flight has arrived',
                'item arrived at destination', 'dismantling the board',
                'item start customs clearance',
                'lot dotarł', 'lot przyleciał', 'przedmiot dotarł do celu',
                'demontaż z pokładu', 'demontaż tablicy',
                'dotarła na lotnisko docelowe',
                '航班已抵达'
            ],
            minDays: 4,
            maxDays: 8,
            labelPl: 'LOT PRZYLECIAŁ (NL/AMS)',
            labelEn: 'FLIGHT ARRIVED (NL/AMS)'
        },
        {
            key: 'flight_departed',
            patterns: [
                'flight has departed', 'item departed from origin', 'flight departed',
                'lot odleciał', 'lot wyleciał', 'przedmiot opuścił miejsce nadania',
                '航班已起飞'
            ],
            minDays: 6,
            maxDays: 10,
            labelPl: 'LOT WYLECIAŁ',
            labelEn: 'FLIGHT DEPARTED'
        },
        {
            key: 'export_customs',
            patterns: [
                'export customs clearance completed', 'the goods leave the operation center',
                'item outbound in sorting center', 'leave the scan', 'outbound',
                'eksportowa odprawa celna zakończona',
                'zakończono odprawę celną eksportową',
                'opuściła centrum operacyjne', 'opuszcza centrum operacyjne',
                'wyszedł z centrum sortowniczego', 'skanowanie wyjścia',
                '出口清关完成', '出口清关完毕'
            ],
            minDays: 8,
            maxDays: 14,
            labelPl: 'ODPRAWA EKSPORTOWA CN',
            labelEn: 'EXPORT CUSTOMS CN'
        },
        {
            key: 'arrived_sorting',
            patterns: [
                'arrived at the operating center', 'goods have been received',
                'shipment information received', 'arrived at operating center',
                'dotarła do centrum operacyjnego', 'dotarł do centrum operacyjnego',
                'towary zostały odebrane', 'otrzymane informacje o przesyłce',
                'otrzymano informacje o przesyłce', 'otrzymano informację o wysyłce'
            ],
            minDays: 10,
            maxDays: 17,
            labelPl: 'CENTRUM SORTOWANIA CN',
            labelEn: 'SORTING CENTER CN'
        },
        {
            key: 'packaging',
            patterns: [
                'leaving the warehouse', 'packaging completed',
                'leaving warehouse', 'leaving the warehouse and shipping',
                'opuszczenie magazynu', 'pakowanie zakończone',
                'wysłana z magazynu', 'towary zostały wysłane'
            ],
            minDays: 11,
            maxDays: 19,
            labelPl: 'NADANA W CHINACH',
            labelEn: 'SHIPPED FROM CHINA'
        }
    ];

    /* ── Korekta kraju docelowego w dniach doliczana do bazy PL ───────────────
     * Wartość dodatnia = wolniej (dalej od węzła NL/DE albo dodatkowa odprawa),
     * wartość ujemna = szybciej (przesyłka trafia do kraju węzła).
     */
    var FXTRK_COUNTRY_DELTA = {
        // UE / Schengen, blisko węzła DE/NL
        NL: -3,
        BE: -2,
        DE: -1,
        AT: 1,
        CZ: 0,
        SK: 0,
        HU: 1,
        PL: 0,
        // Europa Zachodnia
        FR: 2,
        LU: 1,
        CH: 2,
        LI: 2,
        // Półwysep Iberyjski
        ES: 3,
        PT: 4,
        // Włochy / basen Morza Śródziemnego
        IT: 2,
        SI: 1,
        HR: 2,
        // Europa Północna
        DK: 2,
        SE: 3,
        NO: 4,
        FI: 4,
        IS: 6,
        // Europa Wschodnia
        RO: 2,
        BG: 3,
        GR: 3,
        RS: 5,
        BA: 5,
        MK: 5,
        AL: 6,
        ME: 5,
        // Kraje bałtyckie
        EE: 3,
        LV: 3,
        LT: 2,
        // Wielka Brytania (odprawa po brexicie)
        GB: 5,
        UK: 5,
        // Turcja
        TR: 6,
        // Bliski Wschód
        AE: 7,
        SA: 8,
        IL: 7,
        // USA / Kanada
        US: 10,
        CA: 12,
        // Azja i Pacyfik
        AU: 14,
        NZ: 16,
        JP: 8,
        KR: 7,
        SG: 8,
        // Pozostałe
        RU: 9,
        UA: 7
    };

    /* ── Mapa symboliczna kluczy Słownika_Tłumaczeń ───────────────────────────
     * Wartości są polskimi tekstami źródłowymi, którymi kluczowany jest
     * słownik i18n Strony_Statycznej. Zadanie 9.1 dodaje odpowiadające im
     * pary w i18n.pl i i18n.en.
     * Zero kluczy mapy 3D i zero etykiet wersji testowej (wymaganie 12.7).
     */
    var FXTRK_TRK_KEYS = {
        // 17 kluczy interfejsu śledzenia
        title:            'Śledzenie Przesyłki',
        subtitle:         'Wprowadź kod śledzenia, aby sprawdzić status swojej paczki',
        placeholder:      'Wprowadź kod śledzenia...',
        mainInfo:         'Informacje Główne',
        reference:        'Numer referencyjny',
        trackingNumber:   'Numer śledzenia',
        country:          'Kraj',
        date:             'Data',
        recipient:        'Odbiorca',
        status:           'Ostatni status',
        history:          'Historia Przesyłki',
        location:         'Lokalizacja',
        showLess:         'Pokaż mniej',
        showMore:         'Pokaż więcej',
        errorServer:      'Błąd serwera',
        errorNotFound:    'Nie znaleziono informacji o przesyłce',
        errorGeneral:     'Błąd połączenia',
        // Klucze pomocnicze — walidacja
        errorInvalidCode: 'Nieprawidłowy kod śledzenia',
        // Klucze pomocnicze — limit zapytań
        errorRateLimited: 'Zbyt wiele zapytań. Spróbuj ponownie za',
        secondsUnit:      'sekund',
        // Klucze pomocnicze — schowek
        copied:           'Skopiowano',
        errorClipboard:   'Nie udało się skopiować do schowka',
        // Klucze pomocnicze — poziomy pewności
        confidenceHigh:   'Wysoka pewność szacowania',
        confidenceMedium: 'Średnia pewność szacowania',
        confidenceLow:    'Niska pewność szacowania'
    };

    /* ── Wzorzec CJK (zakres znaków chińskich/japońskich/koreańskich i in.) ─ */
    var FXTRK_CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/g;

    /* ── Tabela lokalizacji polskich → angielskie (używana przy lang=en) ─────
     * Wartości odpowiadają znormalizowanym angielskim nazwom miejscowości
     * i krajów wyświetlanym po wybraniu języka angielskiego.
     */
    var FXTRK_LOCATION_PL_TO_EN = {
        'Polska':       'Poland',
        'POLSKA':       'Poland',
        'Niemcy':       'Germany',
        'NIEMCY':       'Germany',
        'Holandia':     'Netherlands',
        'HOLANDIA':     'Netherlands',
        'Szanghaj':     'Shanghai',
        'Pekin':        'Beijing',
        'Kanton':       'Guangzhou',
        // Polskie znormalizowane nazwy centrów
        'Centrum dystrybucji':   'Distribution Center',
        'Centrum tranzytowe':    'Transit Center',
        'Centrum operacyjne':    'Operations Center',
        'Centrum sortowania':    'Sorting Center',
        'Centrum dystrybucyjne': 'Distribution Center',
        'Centrum dostaw':        'Delivery Center',
        'Centrum doręczeń':      'Delivery Center',
        'Centrum wysyłkowe':     'Dispatch Center',
        'Centrala':              'General Office',
        'Oddział':               'Branch Office'
    };

    /* ── Pomocnicze funkcje obsługi CJK i oczyszczania łańcuchów ─────────── */

    /** Redukcja wielokrotnych spacji do jednej, usunięcie spacji z brzegów. */
    function fxtrkCleanSpaces(s) {
        return s.replace(/\s{2,}/g, ' ').trim();
    }

    /**
     * Usuwa znaki CJK ze łańcucha, zachowując tekst natywny.
     * @param {string} text
     * @returns {string}
     */
    function fxtrkStripChineseOnly(text) {
        if (!text) return text;
        return fxtrkCleanSpaces(text.replace(FXTRK_CJK_REGEX, ''));
    }

    /**
     * Tłumaczy chińskie frazy przez FXTRK_CHINESE_TO_EN, następnie usuwa
     * pozostałe znaki CJK.
     * @param {string} text
     * @returns {string}
     */
    function fxtrkStripChineseToEn(text) {
        if (!text) return text;
        var result = text;
        var entries = Object.keys(FXTRK_CHINESE_TO_EN);
        for (var i = 0; i < entries.length; i++) {
            var zh = entries[i];
            var en = FXTRK_CHINESE_TO_EN[zh];
            result = result.split(zh).join(en);
        }
        return fxtrkCleanSpaces(result.replace(FXTRK_CJK_REGEX, ''));
    }

    /**
     * Normalizacja tekstu dla języków innych niż angielski:
     * - jeśli po usunięciu CJK pozostaje znaczący tekst natywny → zwraca go
     *   (typ B: „航班已起飞Lot odleciał" → „Lot odleciał")
     * - jeśli tekst jest wyłącznie CJK → tłumaczy przez CHINESE_TO_EN
     *   (typ A: „收货扫描" → „Receiving scan")
     * @param {string} text
     * @returns {string}
     */
    function fxtrkNormalize(text) {
        var stripped = fxtrkStripChineseOnly(text);
        // Znaczący = co najmniej 2 znaki inne niż cyfry i znaki interpunkcyjne
        var meaningful = stripped.replace(/[\d\s\-\/:.,()\[\]]/g, '').length >= 2;
        return meaningful ? stripped : fxtrkStripChineseToEn(text);
    }

    /* ── validateCode ─────────────────────────────────────────────────────────
     * Identyczna reguła z lib/validateCode.js (wymaganie 1.11, 2.14).
     * Wejście: string (lub cokolwiek).
     * Wyjście: { ok: boolean, normalized: string }
     *   ok = true  gdy po trim() długość 6–40 i wyłącznie litery, cyfry, łącznik
     *   ok = false gdy wejście puste/białe/za krótkie/za długie/niedozwolony znak
     * normalized — po trim() i toUpperCase() (tylko gdy ok = true; gdy ok = false
     *   to trim() wejścia, ale bez uToUpperCase, bo znak niedozwolony mógłby zmylić)
     */
    function validateCode(raw) {
        if (typeof raw !== 'string') {
            return { ok: false, normalized: '' };
        }
        var trimmed = raw.trim();
        if (trimmed.length < 6 || trimmed.length > 40) {
            return { ok: false, normalized: trimmed };
        }
        if (!/^[A-Za-z\u00C0-\u024F\d-]+$/.test(trimmed)) {
            return { ok: false, normalized: trimmed };
        }
        return { ok: true, normalized: trimmed.toUpperCase() };
    }

    /* ── translateStatusForLang ───────────────────────────────────────────────
     * Wybiera odpowiedni tekst statusu dla języka wyświetlania (wymaganie 10.3,
     * 10.8, 2.1).
     *
     * @param {object} event  Zdarzenie_Śledzenia z polami Status i OriginalStatus
     * @param {string} lang   'pl' | 'en' (lub inny, traktowany jak 'pl')
     * @returns {string}
     *
     * Dla pl (i każdego kodu innego niż 'en'):
     *   Zwraca event.Status bez zmian (przetworzone przez serwer, po polsku).
     *
     * Dla en:
     *   1. Pobiera event.OriginalStatus (surowy tekst z upstream).
     *   2. Przepuszcza przez fxtrkStripChineseToEn (CHINESE_TO_EN + usunięcie CJK).
     *   3. Zwraca wynik.
     */
    function translateStatusForLang(event, lang) {
        if (!event) return '';
        if (lang === 'en') {
            var orig = event.OriginalStatus || '';
            return fxtrkStripChineseToEn(orig);
        }
        // pl i wszystkie inne języki → przetworzone po polsku z serwera
        return event.Status || '';
    }

    /* ── translateLocationForLang ─────────────────────────────────────────────
     * Wybiera odpowiedni tekst lokalizacji dla języka wyświetlania (wymaganie
     * 10.3, 10.8, 2.14).
     *
     * @param {object} event  Zdarzenie_Śledzenia z polami Lokalizacja i OriginalLocation
     * @param {string} lang   'pl' | 'en' (lub inny, traktowany jak 'pl')
     * @returns {string}
     *
     * Dla pl (i każdego kodu innego niż 'en'):
     *   Zwraca event.Lokalizacja bez zmian.
     *
     * Dla en:
     *   1. Pobiera event.OriginalLocation (surowy tekst z upstream).
     *   2. Przepuszcza przez fxtrkStripChineseToEn (CHINESE_TO_EN + usunięcie CJK).
     *   3. Stosuje tabelę FXTRK_LOCATION_PL_TO_EN (zamienia polskie nazwy na angielskie).
     *   4. Zwraca wynik po fxtrkCleanSpaces.
     */
    function translateLocationForLang(event, lang) {
        if (!event) return '';
        if (lang === 'en') {
            var orig = event.OriginalLocation || '';
            // Krok 1: transliteracja chińskiego + usunięcie CJK
            var result = fxtrkStripChineseToEn(orig);
            // Krok 2: zamiana polskich nazw lokalizacji na angielskie
            var keys = Object.keys(FXTRK_LOCATION_PL_TO_EN);
            for (var i = 0; i < keys.length; i++) {
                var pl = keys[i];
                var en = FXTRK_LOCATION_PL_TO_EN[pl];
                if (result.indexOf(pl) !== -1) {
                    result = result.split(pl).join(en);
                }
            }
            return fxtrkCleanSpaces(result);
        }
        // pl i wszystkie inne języki → przetworzone po polsku z serwera
        return event.Lokalizacja || '';
    }

    /* ── getCountryInfo ───────────────────────────────────────────────────────
     * Określa kraj zdarzenia na podstawie 6 reguł (w tej kolejności).
     * Pierwsze dopasowanie kończy przeszukiwanie; żadna reguła nie modyfikuje
     * obiektu wejściowego (wymagania 4.1–4.5, 4.11–4.13).
     *
     * Reguły (kolejność):
     *   1. Wyświetlana lokalizacja jest ogólną nazwą Holandii → CN (błędna klasyfikacja)
     *   2. originalLocation lub originalStatus zawiera znane miasto CN/PL/DE/NL
     *      (pierwszeństwo wg kolejności w FXTRK_CITY_RULES: CN, PL, DE, NL)
     *   3. Reguły oparte na treści originalStatus (loty, odprawy, statusy DHL…)
     *   4. Dokładne kody krajów w originalLocation ('pl', 'de', 'nl', 'germany',
     *      'netherlands')
     *   5. Jakikolwiek znak CJK w originalStatus lub originalLocation → CN
     *   6. Domyślnie → CN (CHINY)
     *
     * @param {object} item  Zdarzenie_Śledzenia
     * @returns {{ code: 'CN'|'NL'|'DE'|'PL', name: 'CHINY'|'HOLANDIA'|'NIEMCY'|'POLSKA' }}
     */
    function getCountryInfo(item) {
        var location         = (item.Lokalizacja       || '').toLowerCase();
        var originalLocation = (item.OriginalLocation  || '').toLowerCase();
        var originalStatus   = (item.OriginalStatus    || '').toLowerCase();

        /* Reguła 1: wyświetlana lokalizacja to ogólna nazwa Holandii → CN */
        if (location === 'holandia' || location === 'holland' || location === 'netherlands') {
            return { code: 'CN', name: 'CHINY' };
        }

        /* Reguła 2: znane nazwy miast (FXTRK_CITY_RULES) — priorytet CN>PL>DE>NL */
        for (var ci = 0; ci < FXTRK_CITY_RULES.length; ci++) {
            var rule = FXTRK_CITY_RULES[ci];
            for (var ki = 0; ki < rule.cities.length; ki++) {
                var city = rule.cities[ki];
                if (originalLocation.indexOf(city) !== -1 ||
                    originalStatus.indexOf(city) !== -1) {
                    return { code: rule.code, name: FXTRK_COUNTRY_MAP[rule.code] };
                }
            }
        }

        /* Reguła 3: reguły statusowe */

        // Polska — odprawa wejściowa
        if (originalStatus.indexOf('poland, the international shipment has been processed in the parcel center of origin') !== -1) {
            return { code: 'PL', name: 'POLSKA' };
        }
        // Niemcy — centrum tranzytowe
        if (originalStatus.indexOf('germany, the international shipment has been processed') !== -1) {
            return { code: 'DE', name: 'NIEMCY' };
        }
        // Dostarczone = Polska
        if (originalStatus.indexOf('successfully delivered') !== -1 ||
            originalStatus.indexOf('pomyślnie dostarczona') !== -1 ||
            originalStatus.indexOf('delivered successfully') !== -1 ||
            originalStatus.indexOf('签收') !== -1) {
            return { code: 'PL', name: 'POLSKA' };
        }
        // Operacje DHL na terenie Polski
        if (originalStatus.indexOf('poland, the shipment has been loaded onto the delivery vehicle') !== -1 ||
            originalStatus.indexOf('poland, the shipment is being prepared for delivery') !== -1 ||
            originalStatus.indexOf('poland, the shipment has been processed in the parcel center') !== -1 ||
            originalStatus.indexOf('poland, the shipment has arrived in the destination country') !== -1 ||
            originalStatus.indexOf('loaded onto the delivery vehicle') !== -1 ||
            originalStatus.indexOf('prepared for delivery in the delivery depot') !== -1) {
            return { code: 'PL', name: 'POLSKA' };
        }
        // Dotarła do kraju docelowego
        if (originalStatus.indexOf('the shipment has arrived in the destination country') !== -1) {
            return { code: 'PL', name: 'POLSKA' };
        }
        // Przetworzona w docelowym centrum
        if (originalStatus.indexOf('processed in the destination parcel center') !== -1 ||
            originalStatus.indexOf('unloaded from movement') !== -1 ||
            originalStatus.indexOf('przesyłka została przetworzona w docelowym centrum obsługi paczek') !== -1 ||
            originalStatus.indexOf('rozładunek z pojazdu transportowego') !== -1 ||
            originalStatus.indexOf('przybył pojazd transportowy') !== -1) {
            if (originalLocation.indexOf('poznan') !== -1 || originalLocation.indexOf('poznań') !== -1 ||
                originalLocation.indexOf('stalowa') !== -1 || originalLocation.indexOf('rudnik') !== -1 ||
                originalLocation.indexOf('polska') !== -1 || originalLocation === 'pl') {
                return { code: 'PL', name: 'POLSKA' };
            }
        }
        // Przetworzona w centrum nadania
        if (originalStatus.indexOf('processed in the parcel center of origin') !== -1 ||
            originalStatus.indexOf('przetworzona w centrum dystrybucyjnym of origin') !== -1) {
            if (originalLocation.indexOf('poznan') !== -1 || originalLocation.indexOf('poznań') !== -1 ||
                originalLocation.indexOf('stalowa') !== -1 || originalLocation.indexOf('rudnik') !== -1 ||
                originalLocation.indexOf('polska') !== -1) {
                return { code: 'PL', name: 'POLSKA' };
            }
            if (originalLocation.indexOf('bremen') !== -1 || originalLocation.indexOf('brema') !== -1) {
                return { code: 'DE', name: 'NIEMCY' };
            }
        }
        // Lot wyleciał → CN
        if (originalStatus.indexOf('flight has departed') !== -1 ||
            originalStatus.indexOf('航班已起飞') !== -1) {
            return { code: 'CN', name: 'CHINY' };
        }
        // Lot przyleciał → NL
        if (originalStatus.indexOf('flight has arrived') !== -1 ||
            originalStatus.indexOf('航班已抵达') !== -1) {
            return { code: 'NL', name: 'HOLANDIA' };
        }
        // Odprawa eksportowa → CN
        if (originalStatus.indexOf('export customs clearance completed') !== -1 ||
            originalStatus.indexOf('出口清关完成') !== -1 ||
            originalStatus.indexOf('export customs') !== -1 ||
            originalStatus.indexOf('odprawa celna eksportowa') !== -1 ||
            originalStatus.indexOf('expected flight') !== -1 ||
            originalStatus.indexOf('预计') !== -1) {
            return { code: 'CN', name: 'CHINY' };
        }
        // Import: specyficzne statusy → NL
        if (originalStatus.indexOf('customs clearance completed pending scanning') !== -1 ||
            originalStatus.indexOf('清关完成,等待提取') !== -1 ||
            originalStatus.indexOf('dismantling the board') !== -1 ||
            originalStatus.indexOf('拆板中') !== -1) {
            return { code: 'NL', name: 'HOLANDIA' };
        }
        // Odprawa celna zakończona (bez 'export') — kontekst
        if ((originalStatus.indexOf('odprawa celna zakończona') !== -1 ||
             originalStatus.indexOf('customs clearance completed') !== -1 ||
             originalStatus.indexOf('清关完成') !== -1) &&
            originalStatus.indexOf('export') === -1 &&
            originalStatus.indexOf('eksportowa') === -1 &&
            originalStatus.indexOf('出口') === -1) {
            if (originalStatus.indexOf('抵达【ams】') !== -1) {
                return { code: 'NL', name: 'HOLANDIA' };
            }
            if (originalLocation.indexOf('amsterdam') !== -1 ||
                originalLocation.indexOf('rotterdam') !== -1 ||
                originalLocation.indexOf('eindhoven') !== -1 ||
                originalLocation.indexOf('oirschot') !== -1 ||
                originalLocation.indexOf('vijfhuizen') !== -1) {
                return { code: 'NL', name: 'HOLANDIA' };
            }
            if (originalLocation.indexOf('holandia') !== -1 ||
                originalLocation.indexOf('holland') !== -1 ||
                originalLocation.indexOf('netherlands') !== -1) {
                return { code: 'CN', name: 'CHINY' };
            }
            return { code: 'NL', name: 'HOLANDIA' };
        }
        // Krótki kod "ams" bez kontekstu przyjazdu → CN
        if (originalStatus.trim() === 'ams' &&
            originalStatus.indexOf('抵达') === -1 &&
            originalStatus.indexOf('arrived') === -1) {
            return { code: 'CN', name: 'CHINY' };
        }
        // Chińskie operacje magazynowe → CN
        if (originalStatus.indexOf('货物离开操作中心') !== -1 ||
            originalStatus.indexOf('到达操作中心') !== -1 ||
            originalStatus.indexOf('快件到达机场') !== -1 ||
            originalStatus.indexOf('快件已出库') !== -1 ||
            originalStatus.indexOf('启运') !== -1 ||
            originalStatus.indexOf('快件到达始发地海关') !== -1) {
            return { code: 'CN', name: 'CHINY' };
        }
        // Dotarł do AMS → NL
        if (originalStatus.indexOf('抵达【ams】') !== -1) {
            return { code: 'NL', name: 'HOLANDIA' };
        }
        if (originalStatus.indexOf('目的地清关完成') !== -1) {
            return { code: 'NL', name: 'HOLANDIA' };
        }
        // Informacje wstępne → CN
        if (originalStatus.indexOf('shipment information received') !== -1 ||
            originalStatus.indexOf('货物电子信息已经收到') !== -1 ||
            originalStatus.indexOf('instruction data') !== -1 ||
            originalStatus.indexOf('已预报') !== -1) {
            return { code: 'CN', name: 'CHINY' };
        }
        // Odbiór przez kuriera → DE
        if (originalStatus.indexOf('pick-up was successful') !== -1 ||
            originalStatus.indexOf('odbiór przebiegł pomyślnie') !== -1) {
            return { code: 'DE', name: 'NIEMCY' };
        }
        // Załadowany do pojazdu — rozróżnienie PL/DE
        if (originalStatus.indexOf('loaded to movement') !== -1 ||
            originalStatus.indexOf('załadowany do pojazdu') !== -1) {
            /* Serwer_Upstream podaje Polskę jako dwuliterowe `PL`, nie jako
             * pełną nazwę — bez tego warunku zdarzenie spadało do gałęzi DE. */
            if (originalStatus.indexOf('polska') !== -1 ||
                originalLocation === 'pl' ||
                originalLocation.indexOf('polska') !== -1 ||
                originalLocation.indexOf('poland') !== -1) {
                return { code: 'PL', name: 'POLSKA' };
            }
            if (originalLocation.indexOf('poznan') !== -1 || originalLocation.indexOf('poznań') !== -1 ||
                originalLocation.indexOf('stalowa') !== -1 || originalLocation.indexOf('rudnik') !== -1 ||
                originalLocation.indexOf('warszawa') !== -1) {
                return { code: 'PL', name: 'POLSKA' };
            }
            return { code: 'DE', name: 'NIEMCY' };
        }

        /* Reguła 4: dokładne kody krajów w originalLocation */
        if (originalLocation === 'pl') {
            return { code: 'PL', name: 'POLSKA' };
        }
        if (originalLocation === 'de' || originalLocation === 'germany') {
            return { code: 'DE', name: 'NIEMCY' };
        }
        if (originalLocation === 'nl' || originalLocation === 'netherlands') {
            return { code: 'NL', name: 'HOLANDIA' };
        }

        /* Reguła 5: jakikolwiek znak CJK → CN */
        if (/[\u4e00-\u9fa5]/.test(originalStatus) || /[\u4e00-\u9fa5]/.test(originalLocation)) {
            return { code: 'CN', name: 'CHINY' };
        }

        /* Reguła 6: domyślnie → CN */
        return { code: 'CN', name: 'CHINY' };
    }

    /* ── groupByCountry ───────────────────────────────────────────────────────
     * Grupuje zdarzenia po kraju, a następnie scala sąsiadujące grupy
     * z identycznym kodem kraju (wymagania 4.2, 4.3, 4.4, 4.5, 4.12, 4.13).
     *
     * Algorytm:
     *   1. Iteruje zdarzenia w kolejności wejściowej.
     *   2. Gdy kod kraju różni się od poprzedniego → otwiera nową grupę.
     *   3. Po zebraniu surowych grup scala sąsiednie o tym samym kodzie.
     *
     * Niezmiennik: każde dwie sąsiednie grupy w wyniku mają różny `code`.
     * Suma items.length = liczba zdarzeń wejściowych.
     *
     * @param {object[]} events  Zdarzenie_Śledzenia[]
     * @returns {{ code: string, name: string, items: object[] }[]}
     */
    function groupByCountry(events) {
        if (!Array.isArray(events) || events.length === 0) {
            return [];
        }

        /* Krok 1: budowa surowych grup (zmiana kodu = nowa grupa) */
        var rawGroups = [];
        var currentGroup = null;

        for (var i = 0; i < events.length; i++) {
            var item    = events[i];
            var country = getCountryInfo(item);
            if (!currentGroup || currentGroup.code !== country.code) {
                currentGroup = { code: country.code, name: country.name, items: [] };
                rawGroups.push(currentGroup);
            }
            currentGroup.items.push(item);
        }

        /* Krok 2: scalanie sąsiadujących grup z identycznym kodem */
        var groups = [];
        for (var j = 0; j < rawGroups.length; j++) {
            var group = rawGroups[j];
            var prev  = groups[groups.length - 1];
            if (prev && prev.code === group.code) {
                prev.items = prev.items.concat(group.items);
            } else {
                groups.push({ code: group.code, name: group.name, items: group.items.slice() });
            }
        }

        return groups;
    }

    /* ── resolveDisplayLocation ───────────────────────────────────────────────
     * Gdy pole Lokalizacja zawiera wyłącznie ogólną nazwę kraju (klucz w
     * FXTRK_GENERIC_COUNTRY_LABELS) INNEGO niż kraj grupy (groupCode), zwraca
     * polską nazwę kraju grupy z FXTRK_COUNTRY_MAP, zachowując datę i status
     * bez zmian. W każdym innym przypadku zwraca rawLocation bez modyfikacji.
     * (wymagania 4.8)
     *
     * @param {string} rawLocation  Wartość pola Lokalizacja zdarzenia
     * @param {string} groupCode    Kod kraju grupy ('CN'|'NL'|'DE'|'PL')
     * @returns {string}
     */
    function resolveDisplayLocation(rawLocation, groupCode) {
        var trimmed = (rawLocation || '').trim();
        var lower   = trimmed.toLowerCase();

        /* Sprawdź czy to ogólna nazwa kraju */
        if (!Object.prototype.hasOwnProperty.call(FXTRK_GENERIC_COUNTRY_LABELS, lower)) {
            return rawLocation;
        }

        var labelCountryCode = FXTRK_GENERIC_COUNTRY_LABELS[lower];

        /* Jeśli kod z etykiety zgadza się z kodem grupy — pozostaw bez zmian */
        if (labelCountryCode === groupCode) {
            return rawLocation;
        }

        /* Ogólna nazwa różni się od kodu grupy → zastąp nazwą kraju grupy */
        return FXTRK_COUNTRY_MAP[groupCode] || rawLocation;
    }

    /* ── detectMilestone ─────────────────────────────────────────────────────
     * Skanuje zdarzenia od najnowszego (index 0), szukając pierwszego pasującego
     * Kamienia_Milowego. Dla każdego zdarzenia kolejno sprawdza milestones
     * w kolejności tablicy FXTRK_MILESTONES (od 'delivered' do 'packaging').
     * Dopasowanie po podłańcuchu na złączeniu (Status + ' ' + Lokalizacja)
     * sprowadzonym do małych liter.
     * (wymagania 5.1)
     *
     * @param {object[]} events  Zdarzenie_Śledzenia[] — posortowane od najnowszego
     * @returns {{ milestone: string, milestoneDate: Date|null }|null}
     */
    function detectMilestone(events) {
        if (!Array.isArray(events) || events.length === 0) {
            return null;
        }

        for (var ei = 0; ei < events.length; ei++) {
            var event = events[ei];
            var text  = ((event.Status || '') + ' ' + (event.Lokalizacja || '')).toLowerCase();

            for (var mi = 0; mi < FXTRK_MILESTONES.length; mi++) {
                var milestone = FXTRK_MILESTONES[mi];
                var patterns  = milestone.patterns;

                for (var pi = 0; pi < patterns.length; pi++) {
                    if (text.indexOf(patterns[pi]) !== -1) {
                        /* Dopasowanie znalezione — wyznacz datę */
                        var rawDate = event.OriginalDate;
                        var parsed  = rawDate ? new Date(rawDate) : null;
                        var milestoneDate = (parsed && !isNaN(parsed.getTime())) ? parsed : null;

                        return {
                            milestone:     milestone.key,
                            milestoneDate: milestoneDate
                        };
                    }
                }
            }
        }

        return null;
    }

    /* ── formatDateRange ─────────────────────────────────────────────────────
     * Formatuje przedział dat do postaci "12 lis – 18 lis" (pl) lub
     * "12 Nov – 18 Nov" (en). Dla języków nieobsługiwanych przez środowisko
     * wraca do 'pl-PL'.
     * (wymagania 5.10, 5.11)
     *
     * @param {Date} earliest
     * @param {Date} latest
     * @param {string} lang 'pl' | 'en'
     * @returns {string}
     */
    function formatDateRange(earliest, latest, lang) {
        var locale = (lang === 'en') ? 'en-GB' : 'pl-PL';
        var opts   = { day: 'numeric', month: 'short' };

        var fmtEarliest, fmtLatest;
        try {
            fmtEarliest = earliest.toLocaleDateString(locale, opts);
            fmtLatest   = latest.toLocaleDateString(locale, opts);
        } catch (e) {
            fmtEarliest = earliest.toLocaleDateString('pl-PL', opts);
            fmtLatest   = latest.toLocaleDateString('pl-PL', opts);
        }

        return fmtEarliest + ' \u2013 ' + fmtLatest;
    }

    /* ── confidenceLabel ─────────────────────────────────────────────────────
     * Zwraca etykietę tekstową poziomu pewności. Używa mapy FXTRK_TRK_KEYS
     * bezpośrednio (funkcja trkT jest definiowana w zadaniu 9.1).
     * (wymaganie 5.12)
     *
     * @param {'high'|'medium'|'low'} confidence
     * @param {string} lang 'pl' | 'en'
     * @returns {string}
     */
    function confidenceLabel(confidence, lang) {
        var keyMap = {
            high:   'confidenceHigh',
            medium: 'confidenceMedium',
            low:    'confidenceLow'
        };
        var trkKey = keyMap[confidence] || 'confidenceLow';
        var plText = FXTRK_TRK_KEYS[trkKey] || trkKey;

        /* Gdy trkT będzie dostępna (zadanie 9.1) można ją tu podstawić.
         * Na razie bezpośredni odczyt ze słownika i18n z fallbackiem. */
        if (lang === 'en') {
            try {
                if (typeof i18n !== 'undefined' && i18n.en && i18n.en[plText]) {
                    return i18n.en[plText];
                }
            } catch (e) { /* i18n może nie być dostępne w piaskownicy testu */ }
        }
        return plText;
    }

    /* ── getCountryDeltaNote ─────────────────────────────────────────────────
     * Zwraca adnotację o korekcie krajowej, np. "+2 dni (ES)" lub null gdy
     * delta === 0.
     * (wymaganie 5.7)
     *
     * @param {string} countryCode znormalizowany kod 2-literowy
     * @param {number} delta
     * @param {string} lang 'pl' | 'en'
     * @returns {string|null}
     */
    function getCountryDeltaNote(countryCode, delta, lang) {
        if (!delta) return null;
        var sign = (delta > 0) ? '+' : '';
        var unit = (lang === 'en') ? 'days' : 'dni';
        return sign + delta + ' ' + unit + ' (' + countryCode + ')';
    }

    /* ── estimateDelivery ────────────────────────────────────────────────────
     * Estymuje przedział dat dostawy na podstawie tablicy zdarzeń.
     *
     * Reguły (wymagania 5.2–5.7, 5.10–5.12):
     *  • Brak dopasowania → label="brak danych", dateRange=null, key=null, low
     *  • delivered → label, dateRange=null, isDelivered=true, delta=0, high
     *  • Inne → lower=max(0, minDays+delta) od daty zdarzenia (lub now),
     *           podnieś do now jeśli w przeszłości;
     *           upper=max(lower+1, maxDays+delta),
     *           ustaw na now+2 jeśli upper w przeszłości.
     *  • Pewność wg tabeli; jeśli delta>4 i high → medium.
     *  • Brak / krótki / nieznany kod kraju → delta=0.
     *
     * @param {object[]} events        Zdarzenie_Śledzenia[] posortowane od najnowszego
     * @param {string}   lang          'pl' | 'en'
     * @param {string}   destinationCountry  2-literowy kod ISO (domyślnie 'PL')
     * @param {function} nowFn         () => number (ms timestamp), wstrzykiwane dla testowalności
     * @returns {object} Wynik_Estymatora
     */
    function estimateDelivery(events, lang, destinationCountry, nowFn) {
        /* ── normalizacja języka ── */
        var effectiveLang = (lang === 'en') ? 'en' : 'pl';

        /* ── normalizacja kodu kraju i wyznaczenie delty ── */
        var rawCode = (typeof destinationCountry === 'string') ? destinationCountry.trim().toUpperCase() : '';
        var normalizedCode = (rawCode.length >= 2) ? rawCode : 'PL';
        var delta = (FXTRK_COUNTRY_DELTA.hasOwnProperty(normalizedCode))
            ? FXTRK_COUNTRY_DELTA[normalizedCode]
            : 0;

        /* ── "teraz" pochodzi wyłącznie z wstrzykniętego nowFn ── */
        var nowMs = (typeof nowFn === 'function') ? nowFn() : Date.now();
        var now   = new Date(nowMs);

        /* ── wykrycie Kamienia_Milowego ── */
        var detected = detectMilestone(events);

        /* ── brak dopasowania ── */
        if (!detected) {
            var noDataLabel = (effectiveLang === 'en') ? 'NO DATA' : 'BRAK DANYCH';
            return {
                label:              noDataLabel,
                dateRange:          null,
                milestoneKey:       null,
                confidence:         'low',
                isDelivered:        false,
                countryDelta:       delta,
                destinationCountry: normalizedCode
            };
        }

        /* ── odnaleziony Kamień_Milowy ── */
        var matchedKey  = detected.milestone;
        var msDef       = null;
        /* Znajdź obiekt definicji milestone */
        for (var mi = 0; mi < FXTRK_MILESTONES.length; mi++) {
            if (FXTRK_MILESTONES[mi].key === matchedKey) {
                msDef = FXTRK_MILESTONES[mi];
                break;
            }
        }

        /* Na wypadek niespójności danych (defensywnie) */
        if (!msDef) {
            return {
                label:              (effectiveLang === 'en') ? 'NO DATA' : 'BRAK DANYCH',
                dateRange:          null,
                milestoneKey:       null,
                confidence:         'low',
                isDelivered:        false,
                countryDelta:       delta,
                destinationCountry: normalizedCode
            };
        }

        var milestoneLabel = (effectiveLang === 'en') ? msDef.labelEn : msDef.labelPl;

        /* ── przypadek: dostarczono ── */
        if (matchedKey === 'delivered') {
            return {
                label:              milestoneLabel,
                dateRange:          null,
                milestoneKey:       matchedKey,
                confidence:         'high',
                isDelivered:        true,
                countryDelta:       0,
                destinationCountry: normalizedCode
            };
        }

        /* ── data bazowa: data dopasowanego zdarzenia lub now ── */
        var baseDate = detected.milestoneDate instanceof Date && !isNaN(detected.milestoneDate.getTime())
            ? detected.milestoneDate
            : now;

        /* ── obliczenie granic przedziału ── */
        var minDays = Math.max(0, msDef.minDays + delta);
        var maxDays = Math.max(minDays + 1, msDef.maxDays + delta);

        /* lower bound */
        var earliest = new Date(baseDate.getTime() + minDays * 86400000);
        if (earliest < now) earliest = now;

        /* upper bound */
        var latest   = new Date(baseDate.getTime() + maxDays * 86400000);
        if (latest < now) latest = new Date(nowMs + 2 * 86400000);

        /* ── pewność ── */
        var highKeys   = ['out_for_delivery', 'at_delivery_depot', 'arrived_destination', 'in_germany'];
        var mediumKeys = ['customs_cleared', 'flight_arrived', 'handed_to_courier'];
        var rawConf;
        if (highKeys.indexOf(matchedKey) !== -1) {
            rawConf = 'high';
        } else if (mediumKeys.indexOf(matchedKey) !== -1) {
            rawConf = 'medium';
        } else {
            rawConf = 'low';
        }
        var finalConf = (delta > 4 && rawConf === 'high') ? 'medium' : rawConf;

        return {
            label:              milestoneLabel,
            dateRange:          formatDateRange(earliest, latest, effectiveLang),
            milestoneKey:       matchedKey,
            confidence:         finalConf,
            isDelivered:        false,
            countryDelta:       delta,
            destinationCountry: normalizedCode
        };
    }

    /* ── Eksport — jedyny kontakt sekcji z globalnym środowiskiem ─────────── */
    window.FXTRK_CORE = {
        STATUS_PL: FXTRK_STATUS_PL,
        CHINESE_TO_EN: FXTRK_CHINESE_TO_EN,
        COUNTRY_MAP: FXTRK_COUNTRY_MAP,
        CITY_RULES: FXTRK_CITY_RULES,
        GENERIC_COUNTRY_LABELS: FXTRK_GENERIC_COUNTRY_LABELS,
        MILESTONES: FXTRK_MILESTONES,
        COUNTRY_DELTA: FXTRK_COUNTRY_DELTA,
        TRK_KEYS: FXTRK_TRK_KEYS,
        CJK_REGEX: FXTRK_CJK_REGEX,
        LOCATION_PL_TO_EN: FXTRK_LOCATION_PL_TO_EN,
        cleanSpaces: fxtrkCleanSpaces,
        stripChineseOnly: fxtrkStripChineseOnly,
        stripChineseToEn: fxtrkStripChineseToEn,
        normalize: fxtrkNormalize,
        validateCode: validateCode,
        translateStatusForLang: translateStatusForLang,
        translateLocationForLang: translateLocationForLang,
        getCountryInfo: getCountryInfo,
        groupByCountry: groupByCountry,
        resolveDisplayLocation: resolveDisplayLocation,
        detectMilestone: detectMilestone,
        estimateDelivery: estimateDelivery,
        getCountryDeltaNote: getCountryDeltaNote,
        formatDateRange: formatDateRange,
        confidenceLabel: confidenceLabel
    };
})();
/* ==== FXTRK:CORE END ==== */

/**
 * trkT(key) — Tłumaczenie klucza symbolicznego modułu śledzenia.
 *
 * Zasady (wymagania 10.1, 10.6, 10.7, 10.8, 10.9, 10.10):
 *  - Nieznany klucz symboliczny → zwraca samą nazwę klucza (10.10)
 *  - Brak odwzorowania w wybranym języku → polski tekst źródłowy (10.6)
 *  - Każdy język inny niż 'en' jest traktowany jak 'pl' (10.8)
 *  - Jedynym źródłem języka jest currentLang strony (10.7)
 */
function trkT(key) {
    var pl = (window.FXTRK_CORE && window.FXTRK_CORE.TRK_KEYS)
        ? window.FXTRK_CORE.TRK_KEYS[key]
        : null;
    if (!pl) return key;
    var lang = (currentLang === 'en') ? 'en' : 'pl';
    var dict = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : null;
    return (dict && dict[pl]) ? dict[pl] : pl;
}

/* ==== FXTRK:UI START ==== */
/*
 * Sekcja UI modułu śledzenia — stan, renderowanie, zdarzenia i żądanie sieciowe.
 *
 * Zasady obowiązujące w całej sekcji:
 *  • Struktura wyłącznie przez document.createElement, wartości wyłącznie przez
 *    textContent. Zero innerHTML z danymi, zero eval / new Function /
 *    setTimeout z łańcuchem znaków (wymaganie 6.5).
 *  • Zero elementów otwierających mapę 3D i zero etykiet wersji testowej
 *    w każdym stanie widoku (wymagania 12.1, 12.3).
 *  • Sekcja jest uśpiona do chwili, gdy Widok_Śledzenia otrzyma atrybut
 *    data-fxtrk-nolocale — dopiero wtedy wireTracking() podłącza nasłuchy.
 */
(function () {
    'use strict';

    /* ── Adres Funkcji_Śledzenia ──────────────────────────────────────────────
     * UWAGA WDROŻENIOWA: poniższą wartość NALEŻY ZAMIENIĆ na adres wdrożonej
     * funkcji serverless (zadanie 7.3), np. 'https://tracking-api.vercel.app'
     * albo domenę własną 'https://api.fxlsereps.pl'. To jedyne miejsce plików
     * statycznych powiązane z backendem. Adres Serwera_Upstream nie występuje
     * w plikach statycznych ani razu (wymagania 9.4, 9.12).
     */
    var FXTRK_API_BASE = 'http://localhost:3001';

    /* ── Stałe ────────────────────────────────────────────────────────────── */
    var FXTRK_NO_DATA        = 'Brak danych';
    var FXTRK_ABORT_MS       = 10000;   /* AbortController (wymaganie 1.10) */
    var FXTRK_SAFETY_MS      = 15000;   /* zabezpieczenie nadrzędne (6.7)   */
    var FXTRK_COPIED_MS      = 2000;    /* potwierdzenie kopiowania (11.7)  */
    var FXTRK_VISIBLE_LIMIT  = 15;      /* próg zwinięcia listy (4.9)       */
    var FXTRK_RETRY_FALLBACK = 60;      /* sekundy przy braku Retry-After   */
    /* Zamknięty zbiór akcji delegacji zdarzeń */
    var FXTRK_ACTIONS        = ['copy', 'toggle-all', 'use-last'];

    /* ── Dostawcy czasu i timerów (wstrzykiwalni w testach) ───────────────── */
    var fxtrkNow = function () { return Date.now(); };
    var fxtrkSetTimeout = function (fn, ms) { return window.setTimeout(fn, ms); };
    var fxtrkClearTimeout = function (id) { return window.clearTimeout(id); };

    /* ── Stan — jedno źródło prawdy ───────────────────────────────────────── */
    var fxtrkState = {
        code:         '',      /* zawartość pola wejściowego                  */
        status:       'idle',  /* 'idle'|'loading'|'success'|'empty'|'error'  */
        data:         null,    /* ostatnia udana Odpowiedź_Śledzenia          */
        searchedCode: null,    /* kod, dla którego uzyskano wynik/błąd        */
        errorKey:     null,    /* klucz Słownika_Tłumaczeń                    */
        errorParams:  null,    /* np. { seconds: 42 }                         */
        showAll:      false,   /* rozwinięcie listy poza 15 zdarzeń           */
        copiedField:  null,    /* 'reference' | 'tracking' | null             */
        copiedTimer:  null,    /* uchwyt timera 2000 ms                       */
        controller:   null,    /* AbortController żądania w toku              */
        safetyTimer:  null     /* uchwyt zabezpieczenia 15000 ms              */
    };

    /* Komunikat schowka — trzymany osobno, aby nie czyścić wyniku (11.8) */
    var fxtrkClipboardErrorKey = null;

    /* ── Pomocniki ────────────────────────────────────────────────────────── */

    function core() {
        return window.FXTRK_CORE || null;
    }

    /** Aktywny język: jedynym źródłem jest currentLang Strony_Statycznej (10.7, 10.8). */
    function fxtrkLang() {
        try {
            return (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en' : 'pl';
        } catch (e) {
            return 'pl';
        }
    }

    /** Tekst ze Słownika_Tłumaczeń; w piaskownicy testu spada do tekstu polskiego. */
    function fxtrkT(key) {
        if (typeof trkT === 'function') {
            try { return trkT(key); } catch (e) { /* spadek do mapy CORE */ }
        }
        var keys = (core() && core().TRK_KEYS) ? core().TRK_KEYS : null;
        return (keys && keys[key]) ? keys[key] : key;
    }

    function fxtrkEl(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (typeof text === 'string') node.textContent = text;
        return node;
    }

    function fxtrkIcon(className) {
        var node = document.createElement('i');
        node.className = className;
        return node;
    }

    function fxtrkClear(node) {
        if (!node) return;
        while (node.firstChild) node.removeChild(node.firstChild);
    }

    function fxtrkText(value) {
        var text = (value === null || value === undefined) ? '' : String(value);
        return (text.trim().length === 0) ? FXTRK_NO_DATA : text;
    }

    function fxtrkView() {
        return document.getElementById('tracking-view');
    }

    function fxtrkContainer() {
        return document.getElementById('YQContainer');
    }

    function fxtrkInput() {
        return document.getElementById('YQNum');
    }

    function fxtrkButton() {
        var view = fxtrkView();
        if (!view) return document.getElementById('YQBtn');
        return view.querySelector('#YQBtn')
            || view.querySelector('.tool-btn')
            || view.querySelector('button');
    }

    /** Blokada/odblokowanie elementów interaktywnych (wymagania 2.4, 2.13, 6.13). */
    function fxtrkSetBusy(busy) {
        var button = fxtrkButton();
        var input = fxtrkInput();
        if (button) button.disabled = !!busy;
        if (input) input.disabled = !!busy;
    }

    function fxtrkEvents() {
        var data = fxtrkState.data;
        var list = data ? data['Szczegóły_przesyłki'] : null;
        return Array.isArray(list) ? list : [];
    }

    /* ── renderTracking — funkcja totalna ─────────────────────────────────────
     * Dla każdego stanu buduje pełną zawartość #YQContainer od nowa. Dzięki temu
     * komunikat błędu automatycznie usuwa poprzedni wynik, a przełączenie języka
     * jest zwykłym wywołaniem tej funkcji (wymagania 6.8, 6.9, 10.5).
     */
    function renderTracking() {
        var container = fxtrkContainer();
        if (!container) return null;

        fxtrkClear(container);

        var root = fxtrkEl('div', 'fxtrk-root');
        var main = fxtrkEl('div', 'fxtrk-main');
        root.appendChild(main);
        container.appendChild(root);

        switch (fxtrkState.status) {
            case 'loading':
                main.appendChild(renderLoading());
                break;
            case 'error':
                main.appendChild(renderError());
                break;
            case 'empty':
                main.appendChild(renderEmpty());
                break;
            case 'success':
                renderResult(main);
                break;
            default:
                /* 'idle' — sam skrót ostatniego wyszukiwania */
                break;
        }

        if (fxtrkState.status !== 'loading') {
            var shortcut = renderLastSearched();
            if (shortcut) main.appendChild(shortcut);
        }

        return main;
    }

    /** Wskaźnik ładowania (wymaganie 2.4). */
    function renderLoading() {
        var box = fxtrkEl('div', 'fxtrk-loading');
        box.appendChild(fxtrkEl('span', 'fxtrk-spinner'));
        return box;
    }

    /* ── renderError — dokładnie jeden komunikat błędu ────────────────────────
     * Kod_Śledzenia wstawiany jako tekst, nigdy jako znaczniki (wymaganie 6.5).
     */
    function renderError() {
        var box = fxtrkEl('div', 'fxtrk-status-msg');
        box.setAttribute('data-fxtrk-role', 'error');

        var key = fxtrkState.errorKey || 'errorGeneral';
        var params = fxtrkState.errorParams || {};

        if (key === 'errorRateLimited') {
            var seconds = (typeof params.seconds === 'number') ? params.seconds : FXTRK_RETRY_FALLBACK;
            box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__text', fxtrkT('errorRateLimited')));
            box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__value', ' ' + seconds + ' ' + fxtrkT('secondsUnit')));
            return box;
        }

        box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__text', fxtrkT(key)));
        if (key === 'errorNotFound' && typeof fxtrkState.searchedCode === 'string' && fxtrkState.searchedCode.length > 0) {
            box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__value', ' ' + fxtrkState.searchedCode));
        }
        return box;
    }

    /* Pusta lista Szczegóły_przesyłki przy success:true — zero osi czasu i grup (6.12). */
    function renderEmpty() {
        var box = fxtrkEl('div', 'fxtrk-status-msg');
        box.setAttribute('data-fxtrk-role', 'empty');
        box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__text', fxtrkT('errorNotFound')));
        if (typeof fxtrkState.searchedCode === 'string' && fxtrkState.searchedCode.length > 0) {
            box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__value', ' ' + fxtrkState.searchedCode));
        }
        return box;
    }

    /** Ustawia stan błędu: czyści wynik i pokazuje dokładnie jeden komunikat. */
    function showError(key, params) {
        fxtrkState.status = 'error';
        fxtrkState.errorKey = key || 'errorGeneral';
        fxtrkState.errorParams = params || null;
        fxtrkState.data = null;
        fxtrkState.showAll = false;
        fxtrkState.copiedField = null;
        fxtrkClipboardErrorKey = null;
        fxtrkSetBusy(false);
        return renderTracking();
    }

    /* ── renderResult — karta estymaty + informacje główne + oś czasu ───────── */
    function renderResult(parent) {
        var c = core();
        var data = fxtrkState.data || {};
        var events = fxtrkEvents();
        var lang = fxtrkLang();
        var mainInfo = data['Informacje_główne'] || {};

        if (c) {
            var estimate = c.estimateDelivery(events, lang, mainInfo['Kraj'], fxtrkNow);
            parent.appendChild(renderEstimateCard(estimate));
        }

        parent.appendChild(renderMainInfo(mainInfo));

        var total = events.length;
        var visible = fxtrkState.showAll ? events : events.slice(0, FXTRK_VISIBLE_LIMIT);
        var groups = c ? c.groupByCountry(visible) : [];
        parent.appendChild(renderTimeline(groups));

        var toggle = renderShowMoreButton(total);
        if (toggle) parent.appendChild(toggle);

        if (fxtrkClipboardErrorKey) {
            var msg = fxtrkEl('div', 'fxtrk-status-msg');
            msg.setAttribute('data-fxtrk-role', 'clipboard');
            msg.appendChild(fxtrkEl('span', 'fxtrk-status-msg__text', fxtrkT(fxtrkClipboardErrorKey)));
            parent.appendChild(msg);
        }

        return parent;
    }

    /* ── renderEstimateCard ──────────────────────────────────────────────────
     * Etykieta Kamienia_Milowego, przedział dat tylko gdy niepusty, dokładnie
     * jeden wskaźnik pewności, adnotacja korekty kraju tylko gdy delta ≠ 0.
     * Zero elementów mapy 3D i zero etykiet wersji testowej (5.8, 5.9, 5.13, 12.3, 12.5).
     */
    function renderEstimateCard(estimate) {
        var est = estimate || {};
        var lang = fxtrkLang();
        var confidence = (est.confidence === 'high' || est.confidence === 'medium') ? est.confidence : 'low';

        var card = fxtrkEl('section', 'fxtrk-estimate fxtrk-estimate--' + confidence);

        card.appendChild(fxtrkEl('div', 'fxtrk-estimate__label', String(est.label || '')));

        if (typeof est.dateRange === 'string' && est.dateRange.length > 0) {
            card.appendChild(fxtrkEl('div', 'fxtrk-estimate__range', est.dateRange));
        }

        var confRow = fxtrkEl('div', 'fxtrk-estimate__confidence');
        confRow.appendChild(fxtrkEl('span', 'fxtrk-dot fxtrk-dot--' + confidence));
        var confKey = (confidence === 'high') ? 'confidenceHigh'
            : (confidence === 'medium') ? 'confidenceMedium' : 'confidenceLow';
        confRow.appendChild(fxtrkEl('span', 'fxtrk-estimate__confidence-text', fxtrkT(confKey)));
        card.appendChild(confRow);

        var delta = (typeof est.countryDelta === 'number') ? est.countryDelta : 0;
        if (delta !== 0 && core()) {
            var note = core().getCountryDeltaNote(est.destinationCountry, delta, lang);
            if (note) card.appendChild(fxtrkEl('div', 'fxtrk-estimate__delta', note));
        }

        return card;
    }

    /* ── renderMainInfo ──────────────────────────────────────────────────────
     * Sześć pól nagłówkowych zawsze rozwiniętych, zero przycisków przełączających
     * ich widoczność (wymaganie 11.3), dwa przyciski kopiowania (11.5).
     * Pole `Aktualna lokalizacja` wyznaczane po stronie klienta z najnowszego
     * Zdarzenia_Śledzenia.
     */
    function renderMainInfo(mainInfo) {
        var info = mainInfo || {};
        var section = fxtrkEl('section', 'fxtrk-info');
        section.appendChild(fxtrkEl('h3', 'fxtrk-info__title', fxtrkT('mainInfo')));

        var grid = fxtrkEl('div', 'fxtrk-info-grid');
        section.appendChild(grid);

        grid.appendChild(fxtrkInfoItem('reference', fxtrkT('reference'), info['Numer referencyjny'], true));
        grid.appendChild(fxtrkInfoItem('tracking', fxtrkT('trackingNumber'), info['Numer śledzenia'], true));
        grid.appendChild(fxtrkInfoItem('country', fxtrkT('country'), info['Kraj'], false));
        grid.appendChild(fxtrkInfoItem('date', fxtrkT('date'), info['Data'], false));
        grid.appendChild(fxtrkInfoItem('recipient', fxtrkT('recipient'), info['Odbiorca'], false));
        grid.appendChild(fxtrkInfoItem('status', fxtrkT('status'), info['Ostatni status'], false));

        var current = fxtrkCurrentLocation();
        if (current !== null) {
            grid.appendChild(fxtrkInfoItem('location', fxtrkT('location'), current, false));
        }

        return section;
    }

    /** Aktualna lokalizacja z najnowszego Zdarzenia_Śledzenia. */
    function fxtrkCurrentLocation() {
        var c = core();
        var events = fxtrkEvents();
        if (!c || events.length === 0) return null;

        var newest = events[0];
        var lang = fxtrkLang();
        var location = c.translateLocationForLang(newest, lang);
        var group = c.getCountryInfo(newest);
        return c.resolveDisplayLocation(location, group ? group.code : '');
    }

    function fxtrkInfoItem(field, label, value, copyable) {
        var item = fxtrkEl('div', 'fxtrk-info-item');
        item.setAttribute('data-fxtrk-field', field);

        item.appendChild(fxtrkEl('span', 'fxtrk-info-item__label', String(label)));
        item.appendChild(fxtrkEl('span', 'fxtrk-info-item__value', fxtrkText(value)));

        if (copyable) {
            var copied = (fxtrkState.copiedField === field);
            var button = fxtrkEl('button', 'fxtrk-copy-btn' + (copied ? ' fxtrk-copy-btn--copied' : ''));
            button.type = 'button';
            button.setAttribute('data-fxtrk-action', 'copy');
            button.setAttribute('data-fxtrk-field', field);
            if (copied) {
                button.appendChild(fxtrkIcon('fa-solid fa-check'));
                button.appendChild(fxtrkEl('span', 'fxtrk-copy-btn__text', fxtrkT('copied')));
            } else {
                button.appendChild(fxtrkIcon('fa-regular fa-copy'));
            }
            item.appendChild(button);
        }

        return item;
    }

    /* ── renderTimeline ──────────────────────────────────────────────────────
     * Nagłówek grupy z dwuliterowym kodem i nazwą kraju wielkimi literami
     * dokładnie raz na grupę; na każde zdarzenie trzy niepuste pola
     * (wymagania 4.6, 4.7, 4.8).
     */
    function renderTimeline(groups) {
        var c = core();
        var lang = fxtrkLang();
        var list = Array.isArray(groups) ? groups : [];

        var section = fxtrkEl('section', 'fxtrk-timeline');
        section.appendChild(fxtrkEl('h3', 'fxtrk-timeline__title', fxtrkT('history')));

        for (var gi = 0; gi < list.length; gi++) {
            var group = list[gi] || {};
            var groupEl = fxtrkEl('div', 'fxtrk-timeline__group');
            groupEl.setAttribute('data-fxtrk-country', String(group.code || ''));

            var groupCode = String(group.code || '').trim();
            var groupName = String(group.name || '').trim().toUpperCase();

            /* Nagłówek tylko gdy grupa ma rozpoznany kraj — puste pigułki
             * zaśmiecały widok (kod i nazwa zlewały się w "PLPOLSKA"). */
            if (groupCode || groupName) {
                var header = fxtrkEl('div', 'fxtrk-timeline__group-header');
                if (groupCode) {
                    header.appendChild(fxtrkEl('span', 'fxtrk-timeline__group-code', groupCode));
                }
                if (groupName) {
                    header.appendChild(fxtrkEl('span', 'fxtrk-timeline__group-name', groupName));
                }
                groupEl.appendChild(header);
            }

            var items = Array.isArray(group.items) ? group.items : [];
            for (var ii = 0; ii < items.length; ii++) {
                var event = items[ii] || {};

                var status = c ? c.translateStatusForLang(event, lang) : (event.Status || '');
                var location = c ? c.translateLocationForLang(event, lang) : (event.Lokalizacja || '');
                if (c) location = c.resolveDisplayLocation(location, group.code);
                var date = event.Data || event.OriginalDate || '';

                var itemEl = fxtrkEl('div', 'fxtrk-timeline__item');
                if (gi === 0 && ii === 0) {
                    itemEl.className += ' fxtrk-timeline__item--latest';
                }

                itemEl.appendChild(fxtrkEl('span', 'fxtrk-timeline__dot'));

                var body = fxtrkEl('div', 'fxtrk-timeline__body');
                body.appendChild(fxtrkEl('div', 'fxtrk-timeline__date', fxtrkText(date)));
                body.appendChild(fxtrkEl('div', 'fxtrk-timeline__status', fxtrkText(status)));

                var locationEl = fxtrkEl('div', 'fxtrk-timeline__location');
                locationEl.appendChild(fxtrkIcon('fa-solid fa-location-dot'));
                locationEl.appendChild(fxtrkEl('span', 'fxtrk-timeline__location-text', fxtrkText(location)));
                body.appendChild(locationEl);

                itemEl.appendChild(body);
                groupEl.appendChild(itemEl);
            }

            section.appendChild(groupEl);
        }

        return section;
    }

    /* ── renderShowMoreButton ────────────────────────────────────────────────
     * Przy ≥ 16 zdarzeniach dokładnie jeden przycisk; przy 1–15 zero przycisków
     * (wymagania 4.9, 4.10).
     */
    function renderShowMoreButton(total) {
        var count = (typeof total === 'number') ? total : 0;
        if (count <= FXTRK_VISIBLE_LIMIT) return null;

        var button = fxtrkEl('button', 'fxtrk-show-more');
        button.type = 'button';
        button.setAttribute('data-fxtrk-action', 'toggle-all');
        button.appendChild(fxtrkEl(
            'span',
            'fxtrk-show-more__text',
            fxtrkState.showAll ? fxtrkT('showLess') : fxtrkT('showMore')
        ));
        return button;
    }

    /* ── renderLastSearched ──────────────────────────────────────────────────
     * Skrót wyświetlany wyłącznie gdy wartość last_tracking_code przejdzie tę
     * samą walidację co kod wpisany przez użytkownika. localStorage jest
     * wejściem niezaufanym (wymaganie 2.12).
     */
    function renderLastSearched() {
        var c = core();
        if (!c) return null;

        var raw = null;
        try {
            raw = window.localStorage ? window.localStorage.getItem('last_tracking_code') : null;
        } catch (e) {
            return null;
        }
        if (typeof raw !== 'string') return null;

        var verdict = c.validateCode(raw);
        if (!verdict || !verdict.ok) return null;

        var code = raw.trim();
        var button = fxtrkEl('button', 'fxtrk-last-searched');
        button.type = 'button';
        button.setAttribute('data-fxtrk-action', 'use-last');
        button.setAttribute('data-fxtrk-code', code);
        button.appendChild(fxtrkIcon('fa-solid fa-rotate-left'));
        button.appendChild(fxtrkEl('strong', 'fxtrk-last-searched__code', code));
        return button;
    }

    /* ── Kopiowanie do schowka (wymagania 11.5–11.8) ──────────────────────── */

    function handleCopy(button) {
        if (!button) return;
        var field = button.getAttribute('data-fxtrk-field') || '';

        /* Dokładnie wyświetlana wartość, bez etykiety pola, po trim() */
        var host = button.parentNode;
        var valueEl = host && host.querySelector ? host.querySelector('.fxtrk-info-item__value') : null;
        var value = valueEl ? String(valueEl.textContent).trim() : '';

        var clipboard = (window.navigator && window.navigator.clipboard) ? window.navigator.clipboard : null;
        if (!clipboard || typeof clipboard.writeText !== 'function') {
            fxtrkClipboardFailed();
            return;
        }

        var promise;
        try {
            promise = clipboard.writeText(value);
        } catch (e) {
            fxtrkClipboardFailed();
            return;
        }
        if (!promise || typeof promise.then !== 'function') {
            fxtrkClipboardFailed();
            return;
        }

        promise.then(function () {
            fxtrkClipboardErrorKey = null;
            if (fxtrkState.copiedTimer !== null) {
                fxtrkClearTimeout(fxtrkState.copiedTimer);
                fxtrkState.copiedTimer = null;
            }
            fxtrkState.copiedField = field;
            renderTracking();
            fxtrkState.copiedTimer = fxtrkSetTimeout(function () {
                fxtrkState.copiedField = null;
                fxtrkState.copiedTimer = null;
                renderTracking();
            }, FXTRK_COPIED_MS);
        }, function () {
            fxtrkClipboardFailed();
        });
    }

    /** Wartość pola pozostaje niezmieniona, brak potwierdzenia, komunikat ze słownika. */
    function fxtrkClipboardFailed() {
        fxtrkState.copiedField = null;
        if (fxtrkState.copiedTimer !== null) {
            fxtrkClearTimeout(fxtrkState.copiedTimer);
            fxtrkState.copiedTimer = null;
        }
        fxtrkClipboardErrorKey = 'errorClipboard';
        renderTracking();
    }

    /* ── Żądanie do Funkcji_Śledzenia ─────────────────────────────────────── */

    function fxtrkRetryAfterSeconds(response) {
        var raw = null;
        try {
            raw = (response && response.headers && typeof response.headers.get === 'function')
                ? response.headers.get('Retry-After')
                : null;
        } catch (e) {
            raw = null;
        }
        if (typeof raw !== 'string' || !/^\s*\d+\s*$/.test(raw)) return FXTRK_RETRY_FALLBACK;
        var seconds = parseInt(raw, 10);
        return (isFinite(seconds) && seconds > 0) ? seconds : FXTRK_RETRY_FALLBACK;
    }

    /**
     * submitTracking — jedna ścieżka dla przycisku, klawisza Enter i skrótu.
     * Maksymalnie jedno żądanie równolegle (2.4); walidacja przed wysłaniem
     * (2.3, 2.14); każde zakończenie przywraca stan interaktywny (2.13, 6.13).
     */
    function submitTracking() {
        if (fxtrkState.status === 'loading') return null;

        var c = core();
        var input = fxtrkInput();
        var raw = input ? String(input.value) : String(fxtrkState.code || '');
        fxtrkState.code = raw;

        var verdict = c ? c.validateCode(raw) : { ok: false, normalized: '' };
        if (!verdict.ok) {
            /* Zero żądań, kod zachowany, fokus na polu, komunikat walidacyjny */
            showError('errorInvalidCode', null);
            if (input) {
                input.value = raw;
                try { input.focus(); } catch (e) { /* fokus nie jest krytyczny */ }
            }
            return null;
        }

        fxtrkState.status = 'loading';
        fxtrkState.data = null;
        fxtrkState.errorKey = null;
        fxtrkState.errorParams = null;
        fxtrkState.showAll = false;
        fxtrkState.copiedField = null;
        fxtrkState.searchedCode = verdict.normalized;
        fxtrkClipboardErrorKey = null;
        fxtrkSetBusy(true);
        renderTracking();

        var settled = false;
        var controller = (typeof AbortController === 'function') ? new AbortController() : null;
        fxtrkState.controller = controller;

        /* Poziom 2: przerwanie żądania po 10000 ms (wymaganie 1.10) */
        var abortTimer = fxtrkSetTimeout(function () {
            if (controller) {
                try { controller.abort(); } catch (e) { /* przerwanie best-effort */ }
            }
            if (!settled) terminate('errorGeneral', null);
        }, FXTRK_ABORT_MS);

        /* Poziom 3: zabezpieczenie nadrzędne po 15000 ms (wymaganie 6.7) */
        var safetyTimer = fxtrkSetTimeout(function () {
            if (!settled) terminate('errorGeneral', null);
        }, FXTRK_SAFETY_MS);
        fxtrkState.safetyTimer = safetyTimer;

        function clearTimers() {
            fxtrkClearTimeout(abortTimer);
            fxtrkClearTimeout(safetyTimer);
            fxtrkState.safetyTimer = null;
            fxtrkState.controller = null;
        }

        /** Zakończenie błędem — jedno miejsce przywracania stanu interaktywnego. */
        function terminate(key, params) {
            if (settled) return;
            settled = true;
            clearTimers();
            fxtrkSetBusy(false);
            showError(key, params);
        }

        /** Zakończenie powodzeniem. */
        function succeed(body) {
            if (settled) return;
            settled = true;
            clearTimers();
            fxtrkSetBusy(false);

            var events = body ? body['Szczegóły_przesyłki'] : null;
            fxtrkState.data = body;
            fxtrkState.errorKey = null;
            fxtrkState.errorParams = null;
            fxtrkState.status = (Array.isArray(events) && events.length > 0) ? 'success' : 'empty';

            /* Zapis ostatniego kodu; błąd zapisu pomija skrót, wynik zostaje (2.11, 2.15) */
            try {
                if (window.localStorage) {
                    window.localStorage.setItem('last_tracking_code', verdict.normalized.slice(0, 40));
                }
            } catch (e) { /* skrót pominięty */ }

            renderTracking();
        }

        function onResponse(response) {
            if (settled) return null;
            if (!response) { terminate('errorGeneral', null); return null; }

            var status = response.status;

            if (status === 429) {
                terminate('errorRateLimited', { seconds: fxtrkRetryAfterSeconds(response) });
                return null;
            }
            if (status === 404) { terminate('errorNotFound', null); return null; }
            if (status === 400) { terminate('errorInvalidCode', null); return null; }
            if (!(status >= 200 && status <= 299)) { terminate('errorServer', null); return null; }

            /* Treść nieparsowalna jako JSON → błąd serwera (wymaganie 6.11) */
            return response.json().then(function (body) {
                if (settled) return;
                if (!body || body.success !== true) {
                    terminate('errorNotFound', null);
                    return;
                }
                succeed(body);
            }, function () {
                terminate('errorServer', null);
            });
        }

        var url = FXTRK_API_BASE + '/api/tracking/' + encodeURIComponent(verdict.normalized);
        var init = controller ? { signal: controller.signal } : {};

        var request;
        try {
            request = window.fetch(url, init);
        } catch (err) {
            request = Promise.reject(err);
        }
        if (!request || typeof request.then !== 'function') {
            request = Promise.reject(new Error('fetch niedostępny'));
        }

        var chain = request.then(onResponse, function () {
            /* Odrzucenie fetch, w tym przerwanie po 10000 ms → błąd połączenia */
            terminate('errorGeneral', null);
        });

        /* Oba timery czyszczone w jednym bloku finally */
        if (typeof chain['finally'] === 'function') {
            chain['finally'](clearTimers);
        } else {
            chain.then(clearTimers, clearTimers);
        }

        return chain;
    }

    /* ── Delegacja zdarzeń kontenera ──────────────────────────────────────────
     * Jeden nasłuch `click` na #YQContainer, akcje ze zbioru zamkniętego
     * rozpoznawane po atrybucie data-fxtrk-action. Pełne przerysowanie
     * kontenera nie gubi nasłuchu.
     */
    function onContainerClick(event) {
        var target = event && event.target ? event.target : null;
        var actionEl = null;

        if (target && typeof target.closest === 'function') {
            actionEl = target.closest('[data-fxtrk-action]');
        } else {
            while (target) {
                if (target.getAttribute && target.getAttribute('data-fxtrk-action')) { actionEl = target; break; }
                target = target.parentNode;
            }
        }
        if (!actionEl) return;

        var action = actionEl.getAttribute('data-fxtrk-action');
        if (FXTRK_ACTIONS.indexOf(action) === -1) return;

        if (event.preventDefault) event.preventDefault();

        if (action === 'copy') {
            handleCopy(actionEl);
            return;
        }
        if (action === 'toggle-all') {
            fxtrkState.showAll = !fxtrkState.showAll;
            renderTracking();
            return;
        }
        if (action === 'use-last') {
            var code = actionEl.getAttribute('data-fxtrk-code') || '';
            var input = fxtrkInput();
            if (input) input.value = code;
            fxtrkState.code = code;
            submitTracking();
        }
    }

    /* ── wireTracking ─────────────────────────────────────────────────────────
     * Uruchamia się wyłącznie wtedy, gdy Widok_Śledzenia nosi atrybut
     * data-fxtrk-nolocale (na sobie albo na elemencie wewnątrz). Do czasu
     * aktualizacji index.html sekcja pozostaje uśpiona.
     */
    var fxtrkWired = false;

    function wireTracking() {
        if (fxtrkWired) return true;

        var view = fxtrkView();
        if (!view) return false;

        var armed = (view.hasAttribute && view.hasAttribute('data-fxtrk-nolocale'))
            || !!view.querySelector('[data-fxtrk-nolocale]');
        if (!armed) return false;

        var input = fxtrkInput();
        var button = fxtrkButton();
        var container = fxtrkContainer();

        if (button) {
            button.addEventListener('click', function (event) {
                if (event && event.preventDefault) event.preventDefault();
                submitTracking();
            });
        }

        if (input) {
            input.addEventListener('keydown', function (event) {
                if (!event) return;
                if (event.key === 'Enter' || event.keyCode === 13) {
                    if (event.preventDefault) event.preventDefault();
                    submitTracking();
                }
            });
            /* Zero ponownych wczytań strony przy zatwierdzeniu formularza (2.2) */
            if (input.form) {
                input.form.addEventListener('submit', function (event) {
                    if (event && event.preventDefault) event.preventDefault();
                    submitTracking();
                });
            }
        }

        if (container) container.addEventListener('click', onContainerClick);

        /* Zmiana języka: przerysowanie z pamięci, zero wywołań fetch (10.4, 10.5) */
        document.addEventListener('fxtrk:langchange', function () {
            renderTracking();
        });

        fxtrkWired = true;
        renderTracking();
        return true;
    }

    /* Próba natychmiastowa (skrypt na końcu dokumentu) z zapasowym nasłuchem
     * DOMContentLoaded. wireTracking() jest idempotentne. */
    if (!wireTracking()) {
        document.addEventListener('DOMContentLoaded', function () { wireTracking(); });
    }

    /* ── Eksport — punkt dostępu dla testów i reszty strony ───────────────── */
    window.FXTRK_UI = {
        API_BASE:            FXTRK_API_BASE,
        ACTIONS:             FXTRK_ACTIONS,
        state:               fxtrkState,
        renderTracking:      renderTracking,
        renderLoading:       renderLoading,
        renderError:         renderError,
        renderEmpty:         renderEmpty,
        renderResult:        renderResult,
        renderEstimateCard:  renderEstimateCard,
        renderMainInfo:      renderMainInfo,
        renderTimeline:      renderTimeline,
        renderShowMoreButton: renderShowMoreButton,
        renderLastSearched:  renderLastSearched,
        showError:           showError,
        submitTracking:      submitTracking,
        handleCopy:          handleCopy,
        wireTracking:        wireTracking,
        isWired:             function () { return fxtrkWired; },
        trkT:                fxtrkT,
        lang:                fxtrkLang,
        /* Wstrzykiwanie dostawców czasu — testy nie czekają na prawdziwy zegar */
        setNow:              function (fn) { if (typeof fn === 'function') fxtrkNow = fn; },
        setTimers:           function (setFn, clearFn) {
            if (typeof setFn === 'function') fxtrkSetTimeout = setFn;
            if (typeof clearFn === 'function') fxtrkClearTimeout = clearFn;
        }
    };
})();
/* ==== FXTRK:UI END ==== */


// =========================================
// PRODUCT DETAIL VIEW SYSTEM
// =========================================

/**
 * Product Detail View State
 * Tracks the current product being viewed and navigation state
 */
const ProductDetailView = {
    currentProduct: null,           // Currently displayed product object
    previousView: 'products-view',  // Previous view ID (for back navigation)
    previousScrollPosition: 0,      // Scroll position before entering detail view
    relatedProducts: []             // Array of related products from same category
};

/**
 * Show product detail view
 * Main entry point function that displays detailed information for a specific product
 * @param {string|number} productId - Product ID to display
 */
/**
 * Reset the detail view to its loading state.
 * Without this a second visit kept whatever state the previous product
 * left behind.
 */
function resetProductDetailState() {
    const loading = document.getElementById('pdv-loading');
    const error = document.getElementById('pdv-error');
    const content = document.getElementById('pdv-content');

    if (loading) loading.classList.remove('hidden');
    if (error) error.classList.add('hidden');
    if (content) content.classList.add('hidden');
}

function getProductSlug(product) {
    if (!product) return '';
    const nameSlug = (product.name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return nameSlug || `item-${product.id}`;
}

function getProductShareUrl(product) {
    if (!product) return window.location.href;
    const slug = getProductSlug(product);
    // Buduje link np. https://itemfinder.pl/#/ralph-lauren-tshirt lub #/nazwa-produktu
    const base = window.location.origin + window.location.pathname;
    return `${base}#/${slug}`;
}

async function findProductBySlugOrId(identifier) {
    const stored = await getProducts();
    const allProducts = stored || [];
    if (!identifier) return null;
    
    const decoded = decodeURIComponent(identifier).trim().toLowerCase();
    
    // 1. Sprawdź dokładny ID
    let found = allProducts.find(p => String(p.id) === decoded);
    if (found) return found;

    // 2. Sprawdź dokładny slug z nazwy
    found = allProducts.find(p => getProductSlug(p) === decoded);
    if (found) return found;

    // 3. Sprawdź czy slug zawiera ID na końcu (np. item-123)
    const idMatch = decoded.match(/item-(\d+)$/);
    if (idMatch) {
        found = allProducts.find(p => String(p.id) === idMatch[1]);
        if (found) return found;
    }

    return null;
}

async function showProductDetail(productIdOrSlug) {
    // Store previous view state (view ID and scroll position)
    const activeView = document.querySelector('.main-view.active');
    if (activeView && activeView.id !== 'product-detail-view') {
        ProductDetailView.previousView = activeView.id;
        ProductDetailView.previousScrollPosition = window.scrollY;
    }

    // Show the view with its spinner before the lookup, so the error state
    // (if any) is rendered somewhere visible.
    resetProductDetailState();
    showView('product-detail-view');

    // Fetch and find product by ID or Slug
    const product = await findProductBySlugOrId(productIdOrSlug);

    // Handle product not found by calling showProductDetailError()
    if (!product) {
        showProductDetailError();
        return;
    }

    // Store current product in ProductDetailView.currentProduct
    ProductDetailView.currentProduct = product;

    // Call renderProductDetail(product) to populate the view
    renderProductDetail(product);

    // Call loadRelatedProducts(product)
    loadRelatedProducts(product);

    // Update URL with updateProductUrl(product)
    updateProductUrl(product);

    // Increment view count with incrementClicks(productId)
    incrementClicks(productId);

    // Initialize event listeners with initProductDetailListeners()
    initProductDetailListeners();
}

/**
 * Render product detail information
 * Populates the product detail view with product data
 * @param {Object} product - Product object containing all product information
 */
function renderProductDetail(product) {
    // Get state elements
    const loading = document.getElementById('pdv-loading');
    const error = document.getElementById('pdv-error');
    const content = document.getElementById('pdv-content');

    // Hide loading/error states, show content
    if (loading) {
        loading.classList.add('hidden');
    }
    if (error) {
        error.classList.add('hidden');
    }
    if (content) {
        content.classList.remove('hidden');
    }

    // Set product image (with placeholder if missing)
    const image = document.getElementById('pdv-image');
    if (image) {
        image.src = product.image || 'https://via.placeholder.com/800x800/0f0f0f/555?text=No+Image';
        image.alt = product.name || 'Product Image';
    }

    // Set product title
    const title = document.getElementById('pdv-title');
    if (title) {
        title.textContent = product.name || '';
    }

    // Set product ID/SKU
    const idValue = document.getElementById('pdv-id-value');
    if (idValue) {
        idValue.textContent = product.id || '';
    }

    // Set style (if available) or hide section
    const styleSection = document.getElementById('pdv-product-style');
    const styleValue = document.getElementById('pdv-style-value');
    if (product.style && styleValue) {
        styleValue.textContent = product.style;
        if (styleSection) {
            styleSection.classList.remove('hidden');
        }
    } else {
        if (styleSection) {
            styleSection.classList.add('hidden');
        }
    }

    // Set price and currency
    const price = document.getElementById('pdv-price');
    const currency = document.getElementById('pdv-currency');
    if (price) {
        price.textContent = parseFloat(product.price || 0).toFixed(2);
    }
    if (currency) {
        currency.textContent = product.currency || 'PLN';
    }

    // Route the View button through the agent selected in settings.
    // The raw link is kept on the element so refreshAgentLinks() can
    // re-resolve it when the preference changes.
    const viewBtn = document.getElementById('pdv-view-btn');
    if (viewBtn) {
        const rawLink = product.link || '';
        if (rawLink) {
            viewBtn.setAttribute('data-raw-link', rawLink);
            viewBtn.href = buildAgentLink(rawLink);
        } else {
            viewBtn.removeAttribute('data-raw-link');
            viewBtn.href = '#';
        }
    }

    // Populate description (hide section if empty)
    const descSection = document.getElementById('pdv-description-section');
    const descText = document.getElementById('pdv-description-text');
    if (product.description && descText) {
        descText.textContent = product.description;
        if (descSection) {
            descSection.classList.remove('hidden');
        }
    } else {
        if (descSection) {
            descSection.classList.add('hidden');
        }
    }

    // Display view and like counts
    const views = document.getElementById('pdv-views');
    const likes = document.getElementById('pdv-likes');
    if (views) {
        views.textContent = product.clicks || 0;
    }
    if (likes) {
        likes.textContent = product.likes || 0;
    }
}

/**
 * Show error state when product not found
 * Displays error message and hides loading/content sections
 */
function showProductDetailError() {
    // Get state elements
    const loading = document.getElementById('pdv-loading');
    const error = document.getElementById('pdv-error');
    const content = document.getElementById('pdv-content');

    // Hide loading state if visible
    if (loading) {
        loading.classList.add('hidden');
    }

    // Hide content section
    if (content) {
        content.classList.add('hidden');
    }

    // Show error state
    if (error) {
        error.classList.remove('hidden');
    }

    // Switch to product-detail-view
    showView('product-detail-view');
}

/**
 * Load and display related products from the same category
 * Filters products by matching category, excludes current product, and populates the related products section
 * @param {Object} product - Current product object
 */
async function loadRelatedProducts(product) {
    // Get relatedSection, relatedScroll, and categoryName elements
    const relatedSection = document.getElementById('pdv-related-section');
    const relatedScroll = document.getElementById('pdv-related-scroll');
    const categoryName = document.getElementById('pdv-related-category-name');

    // Return early (hide section) if no product.category or missing elements
    if (!product.category || !relatedSection || !relatedScroll) {
        if (relatedSection) {
            relatedSection.classList.add('hidden');
        }
        return;
    }

    // Filter products by matching category, exclude current product
    const storedProducts = await getProducts();
    const allProducts = storedProducts;
    const related = allProducts.filter(p => 
        p.category === product.category && p.id !== product.id
    );

    // Hide section if no related products found
    if (related.length === 0) {
        relatedSection.classList.add('hidden');
        return;
    }

    // Store related products in ProductDetailView.relatedProducts
    ProductDetailView.relatedProducts = related;

    // Update category name display
    if (categoryName) {
        categoryName.textContent = product.category;
    }

    // Clear and populate relatedScroll with standard product cards (up to 5 items)
    relatedScroll.innerHTML = '';
    related.slice(0, 5).forEach(p => {
        const card = buildProductCard(p);
        relatedScroll.appendChild(card);
    });

    // Show section
    relatedSection.classList.remove('hidden');

    // Setup "View all" link with navigateToCategory() handler
    const viewAllLink = document.getElementById('pdv-related-view-all');
    if (viewAllLink) {
        viewAllLink.onclick = (e) => {
            e.preventDefault();
            navigateToCategory(product.category);
        };
    }
}

/**
 * Build a related product card
 * Creates an HTML element for a product card in the related products section
 * @param {Object} product - Product object
 * @returns {HTMLElement} - Product card element
 */
function buildRelatedProductCard(product) {
    const card = document.createElement('div');
    card.className = 'pdv-related-card';
    
    const imgSrc = product.image || 'https://via.placeholder.com/300x300/0f0f0f/555?text=No+Image';
    const priceFormatted = parseFloat(product.price || 0).toFixed(2);
    const currency = product.currency || 'PLN';
    const views = product.clicks || 0;
    const likes = product.likes || 0;
    
    card.innerHTML = `
        <div class="pdv-related-card__img-wrap">
            <img src="${imgSrc}" alt="${product.name}" loading="lazy">
        </div>
        <div class="pdv-related-card__body">
            <div class="pdv-related-card__cat">${product.category || ''}</div>
            <div class="pdv-related-card__name">${product.name}</div>
            <div class="pdv-related-card__bottom">
                <div class="pdv-related-card__price">${priceFormatted} ${currency}</div>
                <div class="pdv-related-card__meta">
                    <span><i class="fa-regular fa-eye"></i> ${views}</span>
                    <span><i class="fa-regular fa-heart"></i> ${likes}</span>
                </div>
            </div>
        </div>
    `;
    
    // Add click handler to navigate to this product
    card.onclick = () => {
        showProductDetail(product.id);
    };
    
    return card;
}

/**
 * Navigate to products view filtered by category
 * Switches to products view and applies the specified category filter
 * @param {string} category - Category name
 */
function navigateToCategory(category) {
    // Switch to products-view
    showView('products-view');
    
    // Apply category filter using filterProductsGrid()
    filterProductsGrid(category);
    
    // Update category dropdown label if exists
    const catLabel = document.getElementById('pv-cat-label');
    if (catLabel) {
        catLabel.textContent = category;
    }
    
    // Update active state in dropdown
    document.querySelectorAll('.pv-drop-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-cat') === category) {
            item.classList.add('active');
        }
    });
}

/**
 * Update URL with product ID or Slug
 * Updates the browser URL to reflect the current product being viewed
 * Uses history.pushState for better browser history management with fallback to hash-based routing
 * @param {Object|string|number} productOrId - Product object or Product ID
 */
function updateProductUrl(productOrId) {
    let slug = '';
    if (typeof productOrId === 'object' && productOrId !== null) {
        slug = getProductSlug(productOrId);
    } else if (ProductDetailView.currentProduct && ProductDetailView.currentProduct.id == productOrId) {
        slug = getProductSlug(ProductDetailView.currentProduct);
    } else {
        slug = String(productOrId);
    }
    const newUrl = `#/${slug}`;
    
    // Use history.pushState for better browser history management
    if (window.history && window.history.pushState) {
        window.history.pushState(
            { view: 'product-detail', productId: slug },
            '',
            newUrl
        );
    } else {
        // Fallback to hash-based routing for older browsers
        window.location.hash = newUrl;
    }
}

/**
 * Handle URL routing for product detail view
 * Parses window.location.hash and displays product detail if URL matches #/{slug} or #product/{id} pattern
 */
function handleProductRouting() {
    // Read window.location.hash
    const hash = window.location.hash;
    if (!hash || hash === '#' || hash === '#/') return;
    
    // Check if hash matches pattern: #/{slug} or #product/{id}
    let productMatch = hash.match(/^#\/(.+)$/);
    if (!productMatch) {
        productMatch = hash.match(/^#product\/(.+)$/);
    }
    
    // Extract product ID/slug and call showProductDetail if match found
    if (productMatch) {
        const productIdentifier = productMatch[1];
        showProductDetail(productIdentifier);
    }
}

/**
 * Open image in lightbox/fullscreen mode
 * Displays the product image in a fullscreen lightbox overlay
 * @param {string} imageSrc - Image source URL
 */
function openImageLightbox(imageSrc) {
    const lightbox = document.getElementById('pdv-lightbox');
    const lightboxImage = document.getElementById('pdv-lightbox-image');
    
    if (lightbox && lightboxImage) {
        lightboxImage.src = imageSrc;
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close image lightbox
 * Hides the lightbox overlay and restores body scroll
 */
function closeImageLightbox() {
    const lightbox = document.getElementById('pdv-lightbox');
    
    if (lightbox) {
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

/**
 * Initialize product detail view routing on page load
 * Sets up routing, lightbox event listeners, and keyboard shortcuts
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check URL on initial load to handle direct navigation to product URLs
    handleProductRouting();
    
    // Initialize lightbox close button event listener
    const lightboxClose = document.getElementById('pdv-lightbox-close');
    if (lightboxClose) {
        lightboxClose.onclick = closeImageLightbox;
    }
    
    // Add lightbox overlay click handler (close on overlay click, not on image click)
    const lightbox = document.getElementById('pdv-lightbox');
    if (lightbox) {
        lightbox.onclick = (e) => {
            if (e.target === lightbox) {
                closeImageLightbox();
            }
        };
    }
    
    // Add Escape key handler to close lightbox
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageLightbox();
        }
    });
});

/**
 * Handle browser back/forward navigation
 * Listens to popstate events and navigates to the appropriate view based on history state
 */
window.addEventListener('popstate', (event) => {
    // Check if event.state exists and view is 'product-detail'
    if (event.state && event.state.view === 'product-detail') {
        // Call showProductDetail with event.state.productId
        showProductDetail(event.state.productId);
    } else {
        // Otherwise call handleProductRouting() to check hash
        handleProductRouting();
    }
});

/**
 * Navigate back from product detail view
 * Restores previous view state, scroll position, and updates browser history
 */
function navigateBackFromDetail() {
    // Get previous view from ProductDetailView.previousView (default 'products-view')
    const previousView = ProductDetailView.previousView || 'products-view';
    
    // Call showView() with previous view
    showView(previousView);
    
    // Restore scroll position using ProductDetailView.previousScrollPosition (with setTimeout for timing)
    setTimeout(() => {
        window.scrollTo(0, ProductDetailView.previousScrollPosition);
    }, 0);
    
    // Update URL by calling history.back() if URL starts with #/ or #product/
    if (window.location.hash.startsWith('#/') || window.location.hash.startsWith('#product/')) {
        history.back();
    }
}

/**
 * Save product to user's saved items
 * Adds product to localStorage savedProducts array, updates button state, and shows toast notification
 * @param {string|number} productId - Product ID to save
 */
function saveProduct(productId) {
    // Get saved products from localStorage('savedProducts')
    let savedProducts = localStorage.getItem('savedProducts');
    
    // Parse JSON or initialize empty array if null
    savedProducts = savedProducts ? JSON.parse(savedProducts) : [];
    
    // Check if product already saved (return early with "already saved" toast if so)
    if (savedProducts.includes(productId)) {
        showToast('Produkt jest już zapisany', 'info');
        return;
    }
    
    // Add productId to saved array
    savedProducts.push(productId);
    
    // Save back to localStorage
    localStorage.setItem('savedProducts', JSON.stringify(savedProducts));
    
    // Update save button state (change icon to fa-solid, text to "Zapisano", disable button)
    const saveBtn = document.getElementById('pdv-save-btn');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> <span data-i18n="pdv.saved">Zapisano</span>';
        saveBtn.disabled = true;
    }
    
    // Show success toast
    showToast('Dodano do zapisanych!', 'success');
}

/**
 * Share product (copy URL to clipboard or use native share)
 * Creates product URL and attempts to share using native share API first (mobile),
 * then falls back to copying to clipboard. Shows success toast on completion.
 * @param {string|number} productId - Product ID to share
 */
function shareProduct(productId) {
    const product = ProductDetailView.currentProduct;
    // Create product URL with clean slug format: https://itemfinder.pl/#/nazwa-produktu
    const productUrl = getProductShareUrl(product);
    
    // Get product title and description for share data
    const title = product ? product.name : 'Produkt';
    const description = product ? (product.description || `Sprawdź ten produkt: ${product.name}`) : 'Sprawdź ten produkt';
    
    // Try native share API first (navigator.share) if available
    if (navigator.share) {
        navigator.share({
            title: title,
            text: description,
            url: productUrl
        }).then(() => {
            // Show success toast if share succeeds
            showToast('Udostępniono!', 'success');
        }).catch((err) => {
            // Fallback to copyToClipboard if share fails or is cancelled
            if (err.name !== 'AbortError') {
                // Only fallback if not user cancellation
                copyToClipboard(productUrl);
            }
        });
    } else {
        // Fallback to copyToClipboard(productUrl) if share not available
        copyToClipboard(productUrl);
    }
}

/**
 * Copy text to clipboard
 * Copies the provided text to the user's clipboard using modern or fallback methods
 * Displays success or error toast notification based on result
 * @param {string} text - Text to copy to clipboard
 */
function copyToClipboard(text) {
    // Try modern Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            // Success - show success toast
            showToast('Link skopiowany do schowka!', 'success');
        }).catch((err) => {
            // Failed - show error toast
            console.error('Clipboard API failed:', err);
            showToast('Nie udało się skopiować linku', 'error');
        });
    } else {
        // Fallback for older browsers using execCommand
        // Create temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        
        // Select the text
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        
        try {
            // Execute copy command
            const successful = document.execCommand('copy');
            if (successful) {
                showToast('Link skopiowany do schowka!', 'success');
            } else {
                showToast('Nie udało się skopiować linku', 'error');
            }
        } catch (err) {
            console.error('execCommand failed:', err);
            showToast('Nie udało się skopiować linku', 'error');
        } finally {
            // Remove textarea element
            document.body.removeChild(textarea);
        }
    }
}

/**
 * Toggle description expand/collapse
 * Toggles the visibility of the product description content section
 * Rotates the chevron icon to indicate expanded/collapsed state
 */
function toggleDescription() {
    // Get description content element (pdv-description-content)
    const content = document.getElementById('pdv-description-content');
    
    // Get description icon element (.pdv-description-icon)
    const icon = document.querySelector('.pdv-description-icon');
    
    // Toggle 'hidden' class on content
    if (content) {
        content.classList.toggle('hidden');
    }
    
    // Rotate icon based on state: 0deg when hidden, 180deg when visible
    if (icon) {
        const isHidden = content && content.classList.contains('hidden');
        icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    }
}

/**
 * Report problem with product link
 * Handles problem reporting for the current product
 * Currently logs to console and shows confirmation toast (placeholder for future implementation)
 * @param {string|number} productId - Product ID to report
 */
function reportProblem(productId) {
    // Log problem report to console (placeholder for future implementation)
    console.log('Report problem for product:', productId);
    
    // Show confirmation toast notification
    showToast('Zgłoszenie zostało wysłane', 'success');
    
    // TODO: Future implementation could:
    // - Open a modal with a problem report form
    // - Redirect to a contact form page
    // - Send data to a backend API endpoint
}

/**
 * Initialize event listeners for product detail view
 * Sets up click handlers for all interactive elements in the product detail view
 * Should be called after rendering product details
 */
function initProductDetailListeners() {
    // Back button (pdv-back-btn) → navigateBackFromDetail()
    const backBtn = document.getElementById('pdv-back-btn');
    if (backBtn) {
        backBtn.onclick = navigateBackFromDetail;
    }

    // Save button (pdv-save-btn) → saveProduct(currentProduct.id)
    const saveBtn = document.getElementById('pdv-save-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            if (ProductDetailView.currentProduct) {
                saveProduct(ProductDetailView.currentProduct.id);
            }
        };
    }

    // Share button (pdv-share-btn) → shareProduct(currentProduct.id)
    const shareBtn = document.getElementById('pdv-share-btn');
    if (shareBtn) {
        shareBtn.onclick = () => {
            if (ProductDetailView.currentProduct) {
                shareProduct(ProductDetailView.currentProduct.id);
            }
        };
    }

    // Expand image button (pdv-expand-btn) → openImageLightbox(currentProduct.image)
    const expandBtn = document.getElementById('pdv-expand-btn');
    if (expandBtn) {
        expandBtn.onclick = () => {
            if (ProductDetailView.currentProduct) {
                openImageLightbox(ProductDetailView.currentProduct.image);
            }
        };
    }

    // Fullscreen button (pdv-fullscreen-btn) → openImageLightbox(currentProduct.image)
    const fullscreenBtn = document.getElementById('pdv-fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.onclick = () => {
            if (ProductDetailView.currentProduct) {
                openImageLightbox(ProductDetailView.currentProduct.image);
            }
        };
    }

    // Description toggle (pdv-description-toggle) → toggleDescription()
    const descToggle = document.getElementById('pdv-description-toggle');
    if (descToggle) {
        descToggle.onclick = toggleDescription;
    }

    // Report link (pdv-report-link) → reportProblem(currentProduct.id)
    const reportLink = document.getElementById('pdv-report-link');
    if (reportLink) {
        reportLink.onclick = (e) => {
            e.preventDefault();
            if (ProductDetailView.currentProduct) {
                reportProblem(ProductDetailView.currentProduct.id);
            }
        };
    }
}


/* =========================================================
   PROMO POPUP SYSTEM
   Single source of truth. Settings are applied to the DOM as
   CSS custom properties on the overlay, so styling stays in
   style.css instead of being scattered as inline styles.
========================================================= */

const PROMO_STORAGE_KEY = 'promoPopupSettings';
const PROMO_SCHEMA_VERSION = '3';

const PROMO_DEFAULTS = {
    // behaviour
    enabled: true,
    showDelay: 3,
    closeDelay: 3,
    oncePerSession: true,
    triggerHome: true,
    triggerProducts: true,
    triggerTools: false,
    position: 'center',

    // content
    badgeVisible: true,
    badgeText: 'SPECJALNA OFERTA',
    title: 'Obecnie -50% na wysyłkę w OssBuy!',
    description: 'Zarejestruj się teraz i skorzystaj z tej wyjątkowej okazji przed jej wygaśnięciem.',
    buttonText: 'Zarejestruj się w OssBuy',
    link: 'https://ossbuy.com',

    // shape
    modalWidth: 440,
    modalRadius: 16,
    modalPadding: 44,
    badgeRadius: 100,
    buttonRadius: 10,
    buttonFullWidth: true,
    textAlign: 'center',
    titleSize: 1.9,

    // colours
    titleColor: '#ffffff',
    descColor: '#8b8b93',
    badgeBg: '#17171c',
    badgeTextColor: '#d4d4d8',
    badgeBorderColor: '#2a2a32',
    buttonColor: '#ffffff',
    buttonTextColor: 'auto',
    modalBg: '#0f0f12',
    modalBorderColor: '#1e1e24',
    overlayColor: '#000000',
    overlayOpacity: 0.85,
    overlayBlur: 12
};

const PROMO_NUMERIC_KEYS = [
    'showDelay', 'closeDelay', 'modalWidth', 'modalRadius', 'modalPadding',
    'badgeRadius', 'buttonRadius', 'titleSize', 'overlayOpacity', 'overlayBlur'
];

const PROMO_LIMITS = {
    showDelay: [0, 120],
    closeDelay: [0, 120],
    modalWidth: [280, 900],
    modalRadius: [0, 40],
    modalPadding: [16, 80],
    badgeRadius: [0, 100],
    buttonRadius: [0, 40],
    titleSize: [1, 3.5],
    overlayOpacity: [0, 1],
    overlayBlur: [0, 30]
};

function clampPromoValue(key, value) {
    const range = PROMO_LIMITS[key];
    const num = parseFloat(value);
    if (!isFinite(num)) return PROMO_DEFAULTS[key];
    if (!range) return num;
    return Math.min(Math.max(num, range[0]), range[1]);
}

/* ---------- storage ---------- */

function loadPromoPopupSettings() {
    // Drop settings written by an older schema so new keys get real defaults.
    if (localStorage.getItem('promoPopupSchema') !== PROMO_SCHEMA_VERSION) {
        localStorage.removeItem(PROMO_STORAGE_KEY);
        localStorage.setItem('promoPopupSchema', PROMO_SCHEMA_VERSION);
    }

    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem(PROMO_STORAGE_KEY)) || {};
    } catch (err) {
        console.warn('Promo popup: nie udało się odczytać ustawień, używam domyślnych.', err);
        saved = {};
    }

    const merged = { ...PROMO_DEFAULTS, ...saved };
    PROMO_NUMERIC_KEYS.forEach(key => { merged[key] = clampPromoValue(key, merged[key]); });
    return merged;
}

function savePromoPopupSettingsToStorage(settings) {
    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(settings));
}

/* ---------- helpers ---------- */

function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex).trim());
    if (!m) return null;
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function getBrightness(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return 128;
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function resolveButtonTextColor(settings) {
    if (settings.buttonTextColor && settings.buttonTextColor !== 'auto') {
        return settings.buttonTextColor;
    }
    return getBrightness(settings.buttonColor) > 165 ? '#000000' : '#ffffff';
}

/* ---------- apply to DOM ---------- */

// Everything visual travels as custom properties, so the same settings
// object can drive the live popup and the admin preview.
function buildPromoVars(settings) {
    return {
        '--promo-overlay-bg': hexToRgba(settings.overlayColor, settings.overlayOpacity),
        '--promo-overlay-blur': `${settings.overlayBlur}px`,
        '--promo-modal-bg': settings.modalBg,
        '--promo-modal-border': settings.modalBorderColor,
        '--promo-modal-radius': `${settings.modalRadius}px`,
        '--promo-modal-width': `${settings.modalWidth}px`,
        '--promo-modal-padding': `${settings.modalPadding}px`,
        '--promo-title-color': settings.titleColor,
        '--promo-title-size': `${settings.titleSize}rem`,
        '--promo-desc-color': settings.descColor,
        '--promo-badge-bg': settings.badgeBg,
        '--promo-badge-color': settings.badgeTextColor,
        '--promo-badge-border': settings.badgeBorderColor,
        '--promo-badge-radius': `${settings.badgeRadius}px`,
        '--promo-btn-bg': settings.buttonColor,
        '--promo-btn-color': resolveButtonTextColor(settings),
        '--promo-btn-radius': `${settings.buttonRadius}px`,
        '--promo-btn-width': settings.buttonFullWidth ? '100%' : 'auto'
    };
}

// root: any .promo-surface element (live overlay or preview surface)
function applyPromoSurface(root, settings, ids) {
    if (!root) return;

    const badge = document.getElementById(ids.badge);
    const badgeText = document.getElementById(ids.badgeText);
    const title = document.getElementById(ids.title);
    const description = document.getElementById(ids.description);
    const buttonText = document.getElementById(ids.buttonText);

    if (badgeText) badgeText.textContent = settings.badgeText;
    if (title) title.textContent = settings.title;
    if (description) description.textContent = settings.description;
    if (buttonText) buttonText.textContent = settings.buttonText;
    if (badge) badge.classList.toggle('hidden', !settings.badgeVisible);

    root.dataset.position = settings.position;
    root.dataset.align = settings.textAlign;

    const vars = buildPromoVars(settings);
    Object.keys(vars).forEach(key => root.style.setProperty(key, vars[key]));
}

function applyPromoPopupSettings(settings) {
    const overlay = document.getElementById('promo-popup-overlay');
    if (!overlay) return;

    applyPromoSurface(overlay, settings, {
        badge: 'promo-badge',
        badgeText: 'promo-badge-text',
        title: 'promo-title',
        description: 'promo-description',
        buttonText: 'promo-button-text'
    });

    const button = document.getElementById('promo-cta-button');
    if (button) button.href = settings.link;
}

/* ---------- admin live preview ---------- */

// A 900px modal must still fit a ~420px panel, so the preview is scaled
// down proportionally rather than clipped.
function updatePromoPreviewScale(settings) {
    const stage = document.getElementById('promo-preview-stage');
    const scaler = document.getElementById('promo-preview-scaler');
    if (!stage || !scaler) return;

    // Hidden admin views report zero width; skip until they are shown.
    const available = stage.clientWidth - 28;
    if (available <= 0) return;

    const scale = Math.min(1, available / settings.modalWidth);
    scaler.style.setProperty('--promo-preview-scale', scale.toFixed(3));
}

function renderPromoPreview(settings) {
    const surface = document.getElementById('promo-preview-surface');
    if (!surface) return;

    const data = settings || loadPromoPopupSettings();

    applyPromoSurface(surface, data, {
        badge: 'promo-preview-badge',
        badgeText: 'promo-preview-badge-text',
        title: 'promo-preview-title',
        description: 'promo-preview-description',
        buttonText: 'promo-preview-button-text'
    });

    updatePromoPreviewScale(data);

    const state = document.getElementById('promo-preview-state');
    if (state) {
        state.textContent = data.enabled ? 'Włączony' : 'Wyłączony';
        state.dataset.off = String(!data.enabled);
    }
}

// Reads the form when it exists, falls back to stored settings otherwise.
function refreshPromoPreview() {
    const form = document.getElementById('promo-popup-settings-form');
    const settings = form ? readPromoSettingsFromForm() : loadPromoPopupSettings();
    renderPromoPreview(settings);

    // Keep an already-open popup in sync too.
    const overlay = document.getElementById('promo-popup-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
        applyPromoPopupSettings(settings);
    }
}

/* ---------- show / close ---------- */

let promoCloseTimer = null;
let promoShowTimer = null;

function openPromoPopup(settings) {
    const overlay = document.getElementById('promo-popup-overlay');
    const closeBtn = document.getElementById('promo-popup-close');
    if (!overlay) return;

    applyPromoPopupSettings(settings);
    overlay.classList.remove('hidden');

    if (closeBtn) {
        closeBtn.classList.add('hidden');
        clearTimeout(promoCloseTimer);
        promoCloseTimer = setTimeout(() => {
            closeBtn.classList.remove('hidden');
        }, settings.closeDelay * 1000);
    }
}

function showPromoPopup() {
    const settings = loadPromoPopupSettings();
    if (!settings.enabled) return;
    if (settings.oncePerSession && sessionStorage.getItem('promoPopupShown')) return;

    clearTimeout(promoShowTimer);
    promoShowTimer = setTimeout(() => {
        openPromoPopup(settings);
        if (settings.oncePerSession) sessionStorage.setItem('promoPopupShown', '1');
    }, settings.showDelay * 1000);
}

function closePromoPopup() {
    const overlay = document.getElementById('promo-popup-overlay');
    if (!overlay) return;
    clearTimeout(promoCloseTimer);
    overlay.classList.add('hidden');
}

/* ---------- admin form ---------- */

// id -> settings key. Type is derived from the input itself.
const PROMO_FIELD_MAP = {
    'promo-popup-enabled': 'enabled',
    'promo-once-per-session': 'oncePerSession',
    'promo-trigger-home': 'triggerHome',
    'promo-trigger-products': 'triggerProducts',
    'promo-trigger-tools': 'triggerTools',
    'promo-show-delay': 'showDelay',
    'promo-close-delay': 'closeDelay',
    'promo-position': 'position',
    'promo-badge-visible': 'badgeVisible',
    'promo-badge-text-input': 'badgeText',
    'promo-title-input': 'title',
    'promo-description-input': 'description',
    'promo-button-text-input': 'buttonText',
    'promo-link-input': 'link',
    'promo-modal-width': 'modalWidth',
    'promo-modal-radius': 'modalRadius',
    'promo-modal-padding': 'modalPadding',
    'promo-badge-radius': 'badgeRadius',
    'promo-button-radius': 'buttonRadius',
    'promo-button-fullwidth': 'buttonFullWidth',
    'promo-text-align': 'textAlign',
    'promo-title-size': 'titleSize',
    'promo-title-color': 'titleColor',
    'promo-desc-color': 'descColor',
    'promo-badge-bg': 'badgeBg',
    'promo-badge-text-color': 'badgeTextColor',
    'promo-badge-border-color': 'badgeBorderColor',
    'promo-button-color': 'buttonColor',
    'promo-modal-bg': 'modalBg',
    'promo-modal-border-color': 'modalBorderColor',
    'promo-overlay-bg': 'overlayColor',
    'promo-overlay-opacity': 'overlayOpacity',
    'promo-overlay-blur': 'overlayBlur'
};

function readPromoSettingsFromForm() {
    const settings = { ...PROMO_DEFAULTS };

    Object.keys(PROMO_FIELD_MAP).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const key = PROMO_FIELD_MAP[id];

        if (el.type === 'checkbox') {
            settings[key] = el.checked;
        } else if (PROMO_NUMERIC_KEYS.indexOf(key) !== -1) {
            settings[key] = clampPromoValue(key, el.value);
        } else {
            settings[key] = el.value;
        }
    });

    return settings;
}

const PROMO_COLOR_PAIRS = [
    ['promo-title-color', 'promo-title-color-text'],
    ['promo-desc-color', 'promo-desc-color-text'],
    ['promo-badge-bg', 'promo-badge-bg-text'],
    ['promo-badge-text-color', 'promo-badge-text-color-text'],
    ['promo-badge-border-color', 'promo-badge-border-color-text'],
    ['promo-button-color', 'promo-button-color-text'],
    ['promo-modal-bg', 'promo-modal-bg-text'],
    ['promo-modal-border-color', 'promo-modal-border-color-text'],
    ['promo-overlay-bg', 'promo-overlay-bg-text']
];

function loadPromoSettingsForm() {
    if (!document.getElementById('promo-popup-settings-form')) return;
    const settings = loadPromoPopupSettings();

    Object.keys(PROMO_FIELD_MAP).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const value = settings[PROMO_FIELD_MAP[id]];

        if (el.type === 'checkbox') {
            el.checked = Boolean(value);
        } else {
            el.value = value;
        }
    });

    // mirror colour pickers into their hex text inputs
    PROMO_COLOR_PAIRS.forEach(([pickerId, textId]) => {
        const picker = document.getElementById(pickerId);
        const text = document.getElementById(textId);
        if (picker && text) text.value = picker.value;
    });

    updatePromoRangeLabels();
}

function setupColorSync(pickerId, textId) {
    const picker = document.getElementById(pickerId);
    const text = document.getElementById(textId);
    if (!picker || !text) return;

    picker.addEventListener('input', () => { text.value = picker.value; });

    text.addEventListener('input', () => {
        const value = text.value.trim();
        if (/^#[0-9a-f]{6}$/i.test(value)) {
            picker.value = value;
            text.classList.remove('aset-input--invalid');
        } else {
            text.classList.add('aset-input--invalid');
        }
    });

    text.addEventListener('blur', () => {
        if (!/^#[0-9a-f]{6}$/i.test(text.value.trim())) {
            text.value = picker.value;
            text.classList.remove('aset-input--invalid');
        }
    });
}

// Range inputs show their current value next to the label.
const PROMO_RANGE_LABELS = {
    'promo-modal-width': ['promo-modal-width-val', 'px'],
    'promo-modal-radius': ['promo-modal-radius-val', 'px'],
    'promo-modal-padding': ['promo-modal-padding-val', 'px'],
    'promo-badge-radius': ['promo-badge-radius-val', 'px'],
    'promo-button-radius': ['promo-button-radius-val', 'px'],
    'promo-title-size': ['promo-title-size-val', 'rem'],
    'promo-overlay-opacity': ['promo-overlay-opacity-val', ''],
    'promo-overlay-blur': ['promo-overlay-blur-val', 'px']
};

function updatePromoRangeLabels() {
    Object.keys(PROMO_RANGE_LABELS).forEach(id => {
        const input = document.getElementById(id);
        const [labelId, unit] = PROMO_RANGE_LABELS[id];
        const label = document.getElementById(labelId);
        if (input && label) label.textContent = `${input.value}${unit}`;
    });
}

function savePromoPopupSettings(event) {
    if (event) event.preventDefault();
    const settings = readPromoSettingsFromForm();
    savePromoPopupSettingsToStorage(settings);
    applyPromoPopupSettings(settings);
    renderPromoPreview(settings);

    if (typeof showToast === 'function') {
        showToast('Ustawienia pop-upu zapisane', 'success');
    }
}

function resetPromoPopupSettings() {
    savePromoPopupSettingsToStorage({ ...PROMO_DEFAULTS });
    loadPromoSettingsForm();
    refreshPromoPreview();

    if (typeof showToast === 'function') {
        showToast('Przywrócono domyślne ustawienia', 'success');
    }
}

// Shows the real popup over the whole page, ignoring the session lock
// and the show delay.
function previewPromoPopup() {
    const settings = readPromoSettingsFromForm();
    openPromoPopup({ ...settings, closeDelay: 0 });
}

/* ---------- wiring ---------- */

document.addEventListener('DOMContentLoaded', () => {
    PROMO_COLOR_PAIRS.forEach(([pickerId, textId]) => setupColorSync(pickerId, textId));

    const form = document.getElementById('promo-popup-settings-form');
    if (form) {
        // 'input' covers typing and slider dragging; 'change' catches the
        // selects and checkboxes in browsers that only fire change there.
        const onEdit = () => {
            updatePromoRangeLabels();
            refreshPromoPreview();
        };
        form.addEventListener('input', onEdit);
        form.addEventListener('change', onEdit);

        loadPromoSettingsForm();
        refreshPromoPreview();
    }

    // The master switch sits outside the form, so it needs its own hook.
    const enabledToggle = document.getElementById('promo-popup-enabled');
    if (enabledToggle) enabledToggle.addEventListener('change', refreshPromoPreview);

    const closeBtn = document.getElementById('promo-popup-close');
    if (closeBtn) closeBtn.addEventListener('click', closePromoPopup);

    const overlay = document.getElementById('promo-popup-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closePromoPopup();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePromoPopup();
    });

    // The settings view has zero width while hidden, so the preview scale
    // can only be measured once it is actually on screen.
    const settingsLink = document.querySelector('[data-target="settings"]');
    if (settingsLink) {
        settingsLink.addEventListener('click', () => {
            setTimeout(() => {
                loadPromoSettingsForm();
                refreshPromoPreview();
            }, 100);
        });
    }

    // Panel width changes when the sidebar collapses.
    window.addEventListener('resize', () => {
        const surface = document.getElementById('promo-preview-surface');
        if (surface) updatePromoPreviewScale(readPromoSettingsFromForm());
    });

    // showPromoPopup(); // Moved to showView('products-view')
});

window.savePromoPopupSettings = savePromoPopupSettings;
window.resetPromoPopupSettings = resetPromoPopupSettings;
window.previewPromoPopup = previewPromoPopup;
window.closePromoPopup = closePromoPopup;
window.refreshPromoPreview = refreshPromoPreview;


/* =========================================================
   ADMIN: AGENTS + SOCIAL LINKS MANAGEMENT
========================================================= */

const AGENT_PREVIEW_SAMPLE = 'https://weidian.com/item.html?itemID=7834112554';

function renderAdminAgentsList() {
    const host = document.getElementById('agents-list');
    if (!host) return;

    const custom = loadCustomAgents();
    const builtinIds = new Set(CONVERTER_AGENTS.map(a => a.id));

    host.innerHTML = '';

    getAllAgents().forEach(agent => {
        const isBuiltin = builtinIds.has(agent.id);

        const row = document.createElement('div');
        row.className = 'aset-row';

        const target = isBuiltin
            ? 'wbudowany'
            : (agent.template || 'brak szablonu');

        row.innerHTML = `
            <span class="aset-row__badge">${escapeHtmlAttr(agent.abbr || '--')}</span>
            <div class="aset-row__text">
                <span class="aset-row__title">${escapeHtmlAttr(agent.name)}</span>
                <span class="aset-row__sub">${escapeHtmlAttr(target)}</span>
            </div>
        `;

        const actions = document.createElement('div');
        actions.className = 'aset-row__actions';

        if (isBuiltin) {
            const tag = document.createElement('span');
            tag.className = 'aset-tag';
            tag.textContent = 'wbudowany';
            actions.appendChild(tag);
        }

        // Usuwać można każdego agenta — wbudowany zostaje ukryty, więc da się go przywrócić.
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'aset-iconbtn';
        del.title = 'Usuń agenta';
        del.innerHTML = '<i class="fa-solid fa-trash"></i>';
        del.addEventListener('click', () => removeAgent(agent.id));
        actions.appendChild(del);

        row.appendChild(actions);
        host.appendChild(row);
    });

    if (custom.length === 0) {
        const note = document.createElement('p');
        note.className = 'aset-empty';
        note.textContent = 'Brak własnych agentów — poniżej możesz dodać pierwszego.';
        host.appendChild(note);
    }

    // Sekcja przywracania usuniętych wbudowanych agentów
    const hidden = getHiddenBuiltinAgents();
    if (hidden.length > 0) {
        const head = document.createElement('p');
        head.className = 'aset-section__title';
        head.textContent = 'Usunięci wbudowani agenci';
        host.appendChild(head);

        hidden.forEach(agent => {
            const row = document.createElement('div');
            row.className = 'aset-row';
            row.innerHTML = `
                <span class="aset-row__badge">${escapeHtmlAttr(agent.abbr || '--')}</span>
                <div class="aset-row__text">
                    <span class="aset-row__title">${escapeHtmlAttr(agent.name)}</span>
                    <span class="aset-row__sub">usunięty — nie pojawia się na stronie</span>
                </div>
            `;

            const actions = document.createElement('div');
            actions.className = 'aset-row__actions';

            const restore = document.createElement('button');
            restore.type = 'button';
            restore.className = 'aset-iconbtn';
            restore.title = 'Przywróć agenta';
            restore.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
            restore.addEventListener('click', () => restoreBuiltinAgent(agent.id));
            actions.appendChild(restore);

            row.appendChild(actions);
            host.appendChild(row);
        });
    }
}

function updateAgentTemplatePreview() {
    const out = document.getElementById('agent-new-preview');
    const tpl = document.getElementById('agent-new-template');
    if (!out || !tpl) return;

    const template = tpl.value.trim();
    if (!template) { out.textContent = '—'; return; }

    try {
        const analysis = _conv_analyzeInput(AGENT_PREVIEW_SAMPLE);
        out.textContent = _conv_applyTemplate(template, analysis.originalUrl, analysis.itemId);
    } catch (error) {
        out.textContent = 'Nie udało się zbudować podglądu.';
    }
}

function addCustomAgent() {
    const nameEl = document.getElementById('agent-new-name');
    const abbrEl = document.getElementById('agent-new-abbr');
    const idEl = document.getElementById('agent-new-id');
    const tplEl = document.getElementById('agent-new-template');
    if (!nameEl || !tplEl) return;

    const name = nameEl.value.trim();
    const template = tplEl.value.trim();
    const id = slugifyAgentId(idEl && idEl.value.trim() ? idEl.value : name);
    const abbr = (abbrEl ? abbrEl.value.trim() : '').toUpperCase()
        || name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();

    if (!name) { showToast('Podaj nazwę agenta', 'error'); return; }
    if (!id) { showToast('Nazwa musi zawierać litery lub cyfry', 'error'); return; }
    if (!template) { showToast('Podaj szablon linku', 'error'); return; }
    if (!/^https?:\/\//i.test(template)) { showToast('Szablon musi zaczynać się od http(s)://', 'error'); return; }
    if (!/\{(url|rawurl|id)\}/i.test(template)) {
        showToast('Szablon musi zawierać {url}, {rawurl} lub {id}', 'error');
        return;
    }
    if (getAllAgents().some(a => a.id === id)) {
        showToast('Agent o tym identyfikatorze już istnieje', 'error');
        return;
    }

    const list = loadCustomAgents();
    list.push({ id, name, abbr, template, custom: true });
    saveCustomAgents(list);

    nameEl.value = '';
    if (abbrEl) abbrEl.value = '';
    if (idEl) idEl.value = '';
    tplEl.value = '';
    updateAgentTemplatePreview();

    refreshAgentSurfaces();
    showToast(`Dodano agenta ${name}`, 'success');
}

// Usuwa agenta niezależnie od tego, czy jest własny, czy wbudowany.
// Własny znika z listy, wbudowany zostaje ukryty (operacja odwracalna).
function removeAgent(id) {
    const agent = findAgent(id);
    if (!agent) return;

    // Lista nie może zostać pusta — konwerter i karty potrzebują choć jednego agenta.
    if (getAllAgents().length <= 1) {
        showToast('Musi zostać co najmniej jeden agent', 'error');
        return;
    }

    if (!confirm(`Usunąć agenta ${agent.name}?`)) return;

    const custom = loadCustomAgents();
    if (custom.some(a => a.id === id)) {
        saveCustomAgents(custom.filter(a => a.id !== id));
    } else {
        const hidden = loadHiddenAgentIds();
        if (!hidden.includes(id)) saveHiddenAgentIds([...hidden, id]);
    }

    // Jeśli usunięty agent był wybrany, przestaw na pierwszego dostępnego.
    if (agentNameToId(localStorage.getItem('pref_agent')) === id) {
        const next = getAllAgents()[0];
        if (next) localStorage.setItem('pref_agent', next.name);
    }

    refreshAgentSurfaces();
    showToast(`Usunięto agenta ${agent.name}`, 'success');
}

// Przywraca wbudowanego agenta zdjętego wcześniej z listy.
function restoreBuiltinAgent(id) {
    const hidden = loadHiddenAgentIds();
    if (!hidden.includes(id)) return;

    saveHiddenAgentIds(hidden.filter(x => x !== id));

    const agent = CONVERTER_AGENTS.find(a => a.id === id);
    refreshAgentSurfaces();
    showToast(`Przywrócono agenta ${agent ? agent.name : id}`, 'success');
}

// Zgodność wstecz — stara nazwa używana w innych miejscach kodu.
function removeCustomAgent(id) {
    removeAgent(id);
}

// Re-render everything that lists agents or links to them.
function refreshAgentSurfaces() {
    renderAdminAgentsList();
    if (typeof renderAgentPreferenceList === 'function') renderAgentPreferenceList();
    if (typeof window.renderConverterAgentMenu === 'function') window.renderConverterAgentMenu();
    if (typeof refreshAgentLinks === 'function') refreshAgentLinks();
}

/* ---------- social links ---------- */

function renderAdminSocialList() {
    const host = document.getElementById('social-list');
    if (!host) return;

    const links = loadSocialLinks();
    host.innerHTML = '';

    if (links.length === 0) {
        const note = document.createElement('p');
        note.className = 'aset-empty';
        note.textContent = 'Brak linków — dodaj pierwszy poniżej.';
        host.appendChild(note);
        return;
    }

    links.forEach((link, index) => {
        const meta = socialPlatform(link.platform);

        const row = document.createElement('div');
        row.className = 'aset-row';
        row.innerHTML = `
            <span class="aset-row__badge"><i class="${meta.icon}"></i></span>
            <div class="aset-row__text">
                <span class="aset-row__title">${escapeHtmlAttr(meta.name)}</span>
            </div>
        `;

        const urlInput = document.createElement('input');
        urlInput.className = 'aset-input aset-row__input';
        urlInput.type = 'url';
        urlInput.value = link.url || '';
        urlInput.placeholder = 'https://...';
        urlInput.addEventListener('change', () => {
            const list = loadSocialLinks();
            list[index].url = urlInput.value.trim();
            saveSocialLinks(list);
            renderSocialSidebar();
        });
        row.appendChild(urlInput);

        const actions = document.createElement('div');
        actions.className = 'aset-row__actions';

        const toggle = document.createElement('label');
        toggle.className = 'toggle-switch';
        toggle.title = 'Pokaż lub ukryj';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = Boolean(link.enabled);
        cb.addEventListener('change', () => {
            const list = loadSocialLinks();
            list[index].enabled = cb.checked;
            saveSocialLinks(list);
            renderSocialSidebar();
        });
        const slider = document.createElement('span');
        slider.className = 'toggle-slider';
        toggle.appendChild(cb);
        toggle.appendChild(slider);
        actions.appendChild(toggle);

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'aset-iconbtn';
        del.title = 'Usuń link';
        del.innerHTML = '<i class="fa-solid fa-trash"></i>';
        del.addEventListener('click', () => {
            const list = loadSocialLinks();
            list.splice(index, 1);
            saveSocialLinks(list);
            renderAdminSocialList();
            renderSocialSidebar();
        });
        actions.appendChild(del);

        row.appendChild(actions);
        host.appendChild(row);
    });
}

function fillSocialPlatformSelect() {
    const select = document.getElementById('social-new-platform');
    if (!select || select.options.length > 0) return;
    SOCIAL_PLATFORMS.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
    });
}

function addSocialLink() {
    const select = document.getElementById('social-new-platform');
    const urlEl = document.getElementById('social-new-url');
    if (!select || !urlEl) return;

    const url = urlEl.value.trim();
    if (!url) { showToast('Podaj adres linku', 'error'); return; }
    if (!/^https?:\/\//i.test(url)) { showToast('Adres musi zaczynać się od http(s)://', 'error'); return; }

    const list = loadSocialLinks();
    list.push({ platform: select.value, url, enabled: true });
    saveSocialLinks(list);

    urlEl.value = '';
    renderAdminSocialList();
    renderSocialSidebar();
    showToast('Link dodany', 'success');
}

/* ---------- wiring ---------- */

document.addEventListener('DOMContentLoaded', () => {
    fillSocialPlatformSelect();
    renderAdminAgentsList();
    renderAdminSocialList();

    const addAgentBtn = document.getElementById('agent-add-btn');
    if (addAgentBtn) addAgentBtn.addEventListener('click', addCustomAgent);

    const tplInput = document.getElementById('agent-new-template');
    if (tplInput) tplInput.addEventListener('input', updateAgentTemplatePreview);

    const addSocialBtn = document.getElementById('social-add-btn');
    if (addSocialBtn) addSocialBtn.addEventListener('click', addSocialLink);

    // Refresh both lists when the admin opens the settings view.
    const settingsLink = document.querySelector('[data-target="settings"]');
    if (settingsLink) {
        settingsLink.addEventListener('click', () => setTimeout(() => {
            renderAdminAgentsList();
            renderAdminSocialList();
        }, 100));
    }
});

window.renderAdminAgentsList = renderAdminAgentsList;
window.renderAdminSocialList = renderAdminSocialList;
window.addCustomAgent = addCustomAgent;
window.removeCustomAgent = removeCustomAgent;
window.addSocialLink = addSocialLink;


/* =========================================================
   ADMIN SETTINGS — section navigation
========================================================= */

const ASET_PANE_KEY = 'adminSettingsPane';
const ASET_PANES = ['popup', 'agents', 'social'];

function showSettingsPane(name) {
    const pane = ASET_PANES.includes(name) ? name : ASET_PANES[0];

    document.querySelectorAll('.aset-nav__tab').forEach(tab => {
        const active = tab.getAttribute('data-pane') === pane;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
    });

    document.querySelectorAll('.aset-pane').forEach(el => {
        el.classList.toggle('active', el.id === `aset-pane-${pane}`);
    });

    localStorage.setItem(ASET_PANE_KEY, pane);

    // Panes are display:none while inactive, so anything that measures
    // layout has to run after the pane becomes visible.
    if (pane === 'popup' && typeof refreshPromoPreview === 'function') {
        refreshPromoPreview();
    }
    if (pane === 'agents' && typeof renderAdminAgentsList === 'function') {
        renderAdminAgentsList();
    }
    if (pane === 'social' && typeof renderAdminSocialList === 'function') {
        renderAdminSocialList();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.aset-nav');
    if (!nav) return;

    nav.addEventListener('click', (e) => {
        const tab = e.target.closest('.aset-nav__tab');
        if (!tab) return;
        showSettingsPane(tab.getAttribute('data-pane'));
    });

    // Arrow-key navigation between tabs
    nav.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const tabs = Array.from(nav.querySelectorAll('.aset-nav__tab'));
        const current = tabs.findIndex(t => t.classList.contains('active'));
        if (current === -1) return;
        const next = e.key === 'ArrowRight'
            ? (current + 1) % tabs.length
            : (current - 1 + tabs.length) % tabs.length;
        showSettingsPane(tabs[next].getAttribute('data-pane'));
        tabs[next].focus();
        e.preventDefault();
    });

    showSettingsPane(localStorage.getItem(ASET_PANE_KEY) || 'popup');

    // Restore the remembered pane when the admin re-enters Settings.
    const settingsLink = document.querySelector('[data-target="settings"]');
    if (settingsLink) {
        settingsLink.addEventListener('click', () => setTimeout(() => {
            showSettingsPane(localStorage.getItem(ASET_PANE_KEY) || 'popup');
        }, 100));
    }
});

window.showSettingsPane = showSettingsPane;
