// Supabase Configuration
const SUPABASE_URL = 'https://qgzmpjbdwwlmhtsrnbaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnem1wamJkd3dsbWh0c3JuYmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MDA1NjMsImV4cCI6MjEwNTk3NjU2M30.v87uKHb7zYlTyPfw7jBpgwiF4vUgRiwSxpgkI7f4uGU';

// Initialize Supabase client
const { createClient } = window.supabase || {};
const supabase = createClient ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

if (supabase) {
    console.log('Supabase client initialized successfully');
} else {
    console.error('Supabase library not loaded. Make sure the CDN script is included.');
}

// =========================================
// PRODUCTS DATABASE FUNCTIONS
// =========================================

// Get all products from Supabase
async function getProductsFromDB() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Save product to Supabase
async function saveProductToDB(product) {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([{
                id: product.id,
                name: product.name,
                price: product.price,
                currency: product.currency,
                image: product.image,
                category: product.category,
                link: product.link,
                status: product.status,
                clicks: product.clicks || 0,
                popular: product.popular || false
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error saving product:', error);
        return null;
    }
}

// Update product in Supabase
async function updateProductInDB(id, updates) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error updating product:', error);
        return null;
    }
}

// Delete product from Supabase
async function deleteProductFromDB(id) {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting product:', error);
        return false;
    }
}

// =========================================
// SELLERS DATABASE FUNCTIONS
// =========================================

// Get all sellers from Supabase
async function getSellersFromDB() {
    try {
        const { data, error } = await supabase
            .from('sellers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching sellers:', error);
        return [];
    }
}

// Save seller to Supabase
async function saveSellerToDB(seller) {
    try {
        const { data, error } = await supabase
            .from('sellers')
            .insert([{
                name: seller.name,
                brands: seller.brands,
                description: seller.description,
                shop_url: seller.shop_url,
                top_rated: seller.top_rated || false
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error saving seller:', error);
        return null;
    }
}

// Delete seller from Supabase
async function deleteSellerFromDB(id) {
    try {
        const { error } = await supabase
            .from('sellers')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting seller:', error);
        return false;
    }
}

// =========================================
// ANALYTICS DATABASE FUNCTIONS
// =========================================

// Save analytics event (visit, click, etc.)
async function saveAnalyticsEvent(eventType, metadata = {}) {
    try {
        const { data, error } = await supabase
            .from('analytics')
            .insert([{
                event_type: eventType,
                metadata: metadata,
                timestamp: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error saving analytics:', error);
        return null;
    }
}

// Get analytics data for dashboard
async function getAnalyticsData(startDate, endDate) {
    try {
        const { data, error } = await supabase
            .from('analytics')
            .select('*')
            .gte('timestamp', startDate)
            .lte('timestamp', endDate)
            .order('timestamp', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return [];
    }
}

// Get analytics counts (visits, unique users, products)
async function getAnalyticsCounts(period = 'day') {
    try {
        let startDate = new Date();
        
        switch(period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(startDate.getDate() - 30);
                break;
        }
        
        const { data, error } = await supabase
            .from('analytics')
            .select('event_type')
            .gte('timestamp', startDate.toISOString());
        
        if (error) throw error;
        
        const visits = data.filter(e => e.event_type === 'visit').length;
        const uniqueUsers = new Set(data.filter(e => e.event_type === 'visit').map(e => e.metadata?.userId)).size;
        
        return { visits, uniqueUsers };
    } catch (error) {
        console.error('Error fetching analytics counts:', error);
        return { visits: 0, uniqueUsers: 0 };
    }
}

// =========================================
// AUTHENTICATION FUNCTIONS
// =========================================

// Sign in with email and password
window.signInWithEmail = async function(email, password) {
    if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        console.log('User signed in successfully:', data.user.email);
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        console.error('Error signing in:', error.message);
        return { success: false, error: error.message };
    }
};

// Sign out
window.signOut = async function() {
    if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        console.log('User signed out successfully');
        return { success: true };
    } catch (error) {
        console.error('Error signing out:', error.message);
        return { success: false, error: error.message };
    }
};

// Get current user session
window.getCurrentSession = async function() {
    if (!supabase) return null;
    
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        return data.session;
    } catch (error) {
        console.error('Error getting session:', error.message);
        return null;
    }
};

// Check if user is authenticated
window.isAuthenticated = async function() {
    const session = await window.getCurrentSession();
    return session !== null;
};

// Listen for auth state changes
window.onAuthStateChange = function(callback) {
    if (!supabase) return null;
    
    return supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        callback(event, session);
    });
};

// =========================================
// MIGRATION HELPER
// =========================================

// Migrate localStorage data to Supabase (run once)
async function migrateLocalStorageToSupabase() {
    console.log('Starting migration from localStorage to Supabase...');
    
    // Migrate products
    const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
    if (localProducts.length > 0) {
        console.log(`Migrating ${localProducts.length} products...`);
        for (const product of localProducts) {
            await saveProductToDB(product);
        }
        console.log('Products migrated successfully!');
    }
    
    // Migrate sellers
    const localSellers = JSON.parse(localStorage.getItem('sellers') || '[]');
    if (localSellers.length > 0) {
        console.log(`Migrating ${localSellers.length} sellers...`);
        for (const seller of localSellers) {
            await saveSellerToDB(seller);
        }
        console.log('Sellers migrated successfully!');
    }
    
    console.log('Migration completed!');
}
