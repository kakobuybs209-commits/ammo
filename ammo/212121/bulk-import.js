// =========================================
// BULK IMPORT FUNCTIONS
// =========================================

/**
 * Split CSV text into rows of fields (RFC 4180).
 * Handles quoted fields, escaped quotes (""), embedded commas and
 * embedded newlines — a plain split(',') corrupts all of those.
 */
function parseCSVRows(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    // Strip UTF-8 BOM so the first header is not "\uFEFFid".
    const src = text.replace(/^\uFEFF/, '');

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];

        if (inQuotes) {
            if (ch === '"') {
                if (src[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
            continue;
        }

        if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            row.push(field);
            field = '';
        } else if (ch === '\r') {
            // handled by the \n branch
        } else if (ch === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += ch;
        }
    }

    // Flush trailing field / row when the file has no final newline.
    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows.filter(r => r.some(v => v.trim() !== ''));
}

/**
 * Parse CSV file to products array
 */
function parseCSV(csvText) {
    const rows = parseCSVRows(csvText);
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const products = [];

    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        const product = {};

        headers.forEach((header, index) => {
            product[header] = (values[index] !== undefined ? values[index] : '').trim();
        });
        
        // Convert to correct format
        products.push({
            id: product.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: product.name || 'Unnamed Product',
            price: parseFloat(product.price) || 0,
            currency: product.currency || 'PLN',
            image: product.image || '',
            category: product.category || 'Uncategorized',
            link: product.link || '',
            status: product.status || 'active',
            clicks: parseInt(product.clicks) || 0,
            popular: product.popular === 'true' || product.popular === '1'
        });
    }
    
    return products;
}

/**
 * Parse JSON file to products array
 */
function parseJSON(jsonText) {
    try {
        const data = JSON.parse(jsonText);
        
        // If it's an array, use it directly
        if (Array.isArray(data)) {
            return data.map(p => ({
                id: p.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: p.name || 'Unnamed Product',
                price: parseFloat(p.price) || 0,
                currency: p.currency || 'PLN',
                image: p.image || '',
                category: p.category || 'Uncategorized',
                link: p.link || '',
                status: p.status || 'active',
                clicks: parseInt(p.clicks) || 0,
                popular: p.popular === true || p.popular === 'true'
            }));
        }
        
        // If it's an object with products property
        if (data.products && Array.isArray(data.products)) {
            return parseJSON(JSON.stringify(data.products));
        }
        
        return [];
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return [];
    }
}

/**
 * Import products from file
 */
async function importProductsFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                let products = [];
                
                // Detect file type
                if (file.name.endsWith('.csv')) {
                    products = parseCSV(text);
                } else if (file.name.endsWith('.json')) {
                    products = parseJSON(text);
                } else {
                    reject(new Error('Unsupported file format. Use CSV or JSON.'));
                    return;
                }
                
                resolve(products);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Bulk import products to Supabase
 */
async function bulkImportProducts(products, onProgress) {
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };
    
    for (let i = 0; i < products.length; i++) {
        try {
            const product = products[i];
            await saveProductToDB(product);
            results.success++;
            
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: products.length,
                    product: product.name,
                    status: 'success'
                });
            }
        } catch (error) {
            results.failed++;
            results.errors.push({
                product: products[i].name,
                error: error.message
            });
            
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: products.length,
                    product: products[i].name,
                    status: 'error',
                    error: error.message
                });
            }
        }
    }
    
    return results;
}

const CSV_COLUMNS = ['id', 'name', 'price', 'currency', 'image', 'category', 'link', 'status', 'clicks', 'popular'];

/**
 * Quote a single CSV field per RFC 4180.
 * null/undefined become empty instead of the literal "null"/"undefined",
 * and anything containing a comma, quote or newline gets quoted with its
 * inner quotes doubled.
 */
function csvEscapeValue(value) {
    if (value === null || value === undefined) return '';

    const str = String(value);
    if (/[",\r\n;]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

/**
 * Export products to CSV
 */
function exportProductsToCSV(products, columns = CSV_COLUMNS) {
    const rows = [columns.map(csvEscapeValue).join(',')];

    (products || []).forEach(product => {
        rows.push(columns.map(col => csvEscapeValue(product ? product[col] : '')).join(','));
    });

    // CRLF is what Excel expects.
    return rows.join('\r\n');
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent, filename = 'products-export.csv') {
    // Without the BOM Excel reads the file as ANSI and mangles ł, ę, ś...
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Release the blob instead of leaking it for the life of the tab.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate CSV template
 */
function generateCSVTemplate() {
    const example = {
        id: '1',
        name: 'Example Product, Special Edition',
        price: '99.99',
        currency: 'CNY',
        image: 'https://example.com/image.jpg',
        category: 'Shoes',
        link: 'https://example.com/product',
        status: 'active',
        clicks: '0',
        popular: 'false'
    };

    return exportProductsToCSV([example]);
}
