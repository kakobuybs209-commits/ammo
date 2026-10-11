# 📦 Template Import Feature - Integration Guide for AI

## 🎯 Overview
This package contains a complete **Template Import** feature that allows bulk product import through:
1. **Paste Text** - Copy/paste from Google Sheets or Excel (tab-separated)
2. **Upload File** - CSV/TXT file upload
3. **Google Sheets URL** - Direct import from public Google Sheets

## 📁 Package Contents

```
TEMPLATE_IMPORT_PACKAGE/
├── AI_INTEGRATION_INSTRUCTIONS.md  ← This file
├── TemplateImportModal.jsx         ← Main React component
├── template-helpers.js             ← Parsing utilities
├── sheets-route.js                 ← Google Sheets proxy API
└── template-route.js               ← Template processing API (backend)
```

---

## 🚀 Step-by-Step Integration Instructions

### Step 1: Copy Frontend Files

**1.1 Copy the Modal Component**
```bash
# Copy to your components folder
src/components/admin/TemplateImportModal.jsx
```

**1.2 Copy the Helper Utilities**
```bash
# Copy to your utils folder
src/utils/template-helpers.js
```

### Step 2: Copy API Routes (Next.js App Router)

**2.1 Create Google Sheets Proxy Route**
```bash
# Create file at:
src/app/api/admin/scrape/sheets/route.js

# Copy contents from: sheets-route.js
```

**2.2 Create Template Processing Route**
```bash
# Create file at:
src/app/api/admin/scrape/template/route.js

# Copy contents from: template-route.js
```

### Step 3: Install Modal in Admin Panel

**3.1 Import the Component**
```javascript
import TemplateImportModal from '@/components/admin/TemplateImportModal';
```

**3.2 Add State Management**
```javascript
const [showTemplateModal, setShowTemplateModal] = useState(false);
```

**3.3 Add Button to Open Modal**
```jsx
<button onClick={() => setShowTemplateModal(true)}>
  📋 Template Import
</button>
```

**3.4 Render the Modal**
```jsx
<TemplateImportModal
  isOpen={showTemplateModal}
  onClose={() => setShowTemplateModal(false)}
  onImportComplete={(data) => {
    console.log('Import completed:', data);
    // Refresh your product list here
    fetchProducts();
  }}
  showToast={(message, type) => {
    // Your toast notification function
    console.log(type, message);
  }}
/>
```

---

## 🔧 Backend API Requirements

The template processing route needs to:

### Required Endpoint: POST `/api/admin/scrape/template`

**Request Body:**
```json
{
  "products": [
    { "name": "Product Name", "url": "https://weidian.com/item.html?itemID=123" },
    { "name": "Another Product", "url": "https://weidian.com/item.html?itemID=456" }
  ],
  "replaceMode": "none",  // or "pinned" or "all"
  "confirm": "REPLACE",   // required when replaceMode != "none"
  "batch": "best",        // or "budget", "random", "popular"
  "category": "shoes",    // optional, omit for auto-detection
  "pin": false,
  "startOrder": 1,
  "concurrency": 4
}
```

**Response Format:**
```json
{
  "total": 10,
  "created": 8,
  "updated": 2,
  "successes": 10,
  "failures": 0,
  "deletedCount": 0,
  "results": [
    {
      "status": "success",
      "action": "created",
      "name": "Product Name",
      "itemId": "123",
      "url": "https://weidian.com/item.html?itemID=123"
    }
  ]
}
```

### Backend Logic Flow:

1. **Validate Request**
   - Check `products` array is not empty
   - If `replaceMode` is "pinned" or "all", verify `confirm === "REPLACE"`

2. **For Each Product:**
   - Scrape product details from Weidian URL
   - Extract: image, price, description
   - Use provided `name` (don't scrape name - use what user provided)
   - Apply `batch` tag
   - Auto-detect or use fixed `category`

3. **Handle Replace Modes:**
   - `none`: Add new products, update existing ones (match by URL)
   - `pinned`: Delete all pinned products AFTER successful scrape, then add new ones as pinned
   - `all`: Delete ALL products AFTER successful scrape, then add new ones

4. **Return Results:**
   - Track successes/failures
   - Return detailed logs for each product

---

## 🔑 Key Features to Implement in Backend

### 1. Weidian Scraper
```javascript
async function scrapeWeidianProduct(url) {
  // Extract itemID from URL
  // Fetch product page HTML
  // Parse: image, price, description (NOT name - user provides that)
  // Return product data
}
```

### 2. Category Auto-Detection (Optional)
```javascript
function detectCategory(productName) {
  // Use keywords to detect category
  // Return: 'shoes', 'hoodies', 't-shirts', etc.
  // Or use the category provided in request
}
```

### 3. Database Operations
```javascript
// Check if product exists (by Weidian URL)
const existing = await db.products.findOne({ link: url });

if (existing) {
  // Update existing product
  await db.products.update(id, newData);
} else {
  // Create new product
  await db.products.create(newData);
}
```

### 4. Replace Mode Logic
```javascript
if (replaceMode === 'pinned') {
  // After all scrapes succeed:
  await db.products.deleteMany({ isPinned: true });
  // Then insert new products with isPinned: true
}

if (replaceMode === 'all') {
  // After all scrapes succeed:
  await db.products.deleteMany({});
  // Then insert new products
}
```

---

## 📋 Testing Checklist

### ✅ Frontend Testing
- [ ] Modal opens and closes correctly
- [ ] Text paste mode works (tab-separated data)
- [ ] File upload mode works (CSV files)
- [ ] Google Sheets URL mode works (public sheets)
- [ ] Progress bar updates during import
- [ ] Success/error messages display correctly
- [ ] Replace confirmation works (REPLACE text input)

### ✅ Backend Testing
- [ ] Single product import works
- [ ] Bulk import works (10+ products)
- [ ] "Add/Refresh" mode works
- [ ] "Replace Pinned" mode works
- [ ] "Replace All" mode works
- [ ] Category auto-detection works
- [ ] Fixed category assignment works
- [ ] Batch tagging works (best, budget, etc.)

### ✅ Google Sheets Testing
- [ ] Public sheet (viewable by anyone) works
- [ ] First row detected as header correctly
- [ ] Empty cells handled correctly
- [ ] Non-Weidian links are skipped
- [ ] Access denied error shows helpful message

---

## 🛠️ Customization Options

### Change API Endpoint
```jsx
<TemplateImportModal
  apiEndpoint="/api/your-custom-endpoint"
  // ... other props
/>
```

### Add Custom Toast Notifications
```jsx
<TemplateImportModal
  showToast={(message, type) => {
    // type: 'success', 'error', 'info'
    yourToastLibrary.show(message, type);
  }}
  // ... other props
/>
```

### Add More Categories
In `TemplateImportModal.jsx`, find the category dropdown and add:
```jsx
<option value="longsleeve">🧥 Long Sleeve</option>
<option value="electronics">📱 Electronics</option>
<option value="headwear">🧢 Headwear</option>
<option value="bags-backpacks">🎒 Bags</option>
<option value="belts">👔 Belts</option>
```

---

## 🌐 Google Sheets Format

### Required Format:
```
| Name (A)          | Link (B)                                      | ID (C) [ignored] |
|-------------------|-----------------------------------------------|------------------|
| Nike AF1          | https://weidian.com/item.html?itemID=123      | 1                |
| Jordan 1 High     | https://weidian.com/item.html?itemID=456      | 2                |
```

### Rules:
1. **Column A** = Product Name (required)
2. **Column B** = Weidian Link (required)
3. **Columns C, D, E...** = Ignored (can contain IDs, notes, etc.)
4. **First row** = Can be header (auto-detected and skipped)
5. **Sheet must be public** = "Anyone with the link can view"

---

## 🚨 Common Issues & Solutions

### Issue 1: "Google Sheets access denied"
**Solution:** Make sure the sheet sharing is set to "Anyone with the link can view"

### Issue 2: "No valid template data found"
**Solution:** Check that data has both Name (column A) and Link (column B)

### Issue 3: "Failed to fetch Google Sheets"
**Solution:** 
- Check if the URL is correct
- Verify the sheet is public
- Try the direct CSV export URL

### Issue 4: Products not importing
**Solution:**
- Check backend API is running
- Verify Weidian URLs are valid
- Check browser console for errors
- Test with single product first

---

## 💡 Pro Tips

1. **Start Small** - Test with 2-3 products first
2. **Use "Add/Refresh" Mode** - Safer than replace modes
3. **Keep Google Sheets Simple** - Just Name + Link columns
4. **Monitor Progress** - Watch the progress bar and logs
5. **Check Results** - Verify imported products in your catalog

---

## 📞 Support

If you need help integrating this feature:

1. Check the console for error messages
2. Verify all files are in correct locations
3. Test the Google Sheets proxy route separately
4. Ensure your backend Weidian scraper is working
5. Test with a single product before bulk import

---

## 🎨 Styling (Optional)

The component uses inline styles for portability. To customize:

1. Extract styles to a CSS module
2. Add your own color scheme
3. Adjust modal size and layout
4. Customize progress bar appearance

---

**Good luck with your integration! 🚀**
