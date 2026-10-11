# ⚡ Quick Start Guide for AI Assistant

## 🎯 Your Mission
Integrate the **Template Import** feature into the user's project.

## 📦 Package Contents
- `TemplateImportModal.jsx` - React component (ready to use)
- `template-helpers.js` - Parsing utilities (ready to use)
- `sheets-route.js` - Google Sheets proxy API
- `template-route.js` - Template processing API (needs customization)
- `AI_INTEGRATION_INSTRUCTIONS.md` - Complete integration guide
- `EXAMPLE_TEMPLATE.csv` - Example CSV template

## ✅ Integration Checklist (DO THIS IN ORDER)

### Step 1: Read the Documentation
- [ ] Read `AI_INTEGRATION_INSTRUCTIONS.md` completely
- [ ] Understand the file structure and requirements
- [ ] Check user's project structure

### Step 2: Copy Frontend Files
```bash
# Copy these files EXACTLY to these locations:
TemplateImportModal.jsx  →  src/components/admin/TemplateImportModal.jsx
template-helpers.js      →  src/utils/template-helpers.js
```

### Step 3: Copy API Routes
```bash
# Create directories if needed, then copy:
sheets-route.js    →  src/app/api/admin/scrape/sheets/route.js
template-route.js  →  src/app/api/admin/scrape/template/route.js
```

### Step 4: Integrate Modal in Admin Panel

Find the admin products page (usually `src/app/admin/.../products/page.jsx` or similar).

Add these 3 things:

**1. Import:**
```jsx
import TemplateImportModal from '@/components/admin/TemplateImportModal';
```

**2. State:**
```jsx
const [showTemplateModal, setShowTemplateModal] = useState(false);
```

**3. Button and Modal:**
```jsx
// Add button near other action buttons
<button onClick={() => setShowTemplateModal(true)}>
  📋 Template Import
</button>

// Add modal at the end of component
<TemplateImportModal
  isOpen={showTemplateModal}
  onClose={() => setShowTemplateModal(false)}
  onImportComplete={(data) => {
    // Refresh products list after import
    fetchProducts();
  }}
  showToast={(message, type) => {
    // Use existing toast function or console.log
    showToast ? showToast(message, type) : console.log(type, message);
  }}
/>
```

### Step 5: Customize Backend API

Open `src/app/api/admin/scrape/template/route.js` and customize:

**5.1 Database Connection**
```javascript
// Replace MongoDB with user's database (Supabase, PostgreSQL, etc.)
import { supabase } from '@/lib/supabase'; // or user's DB lib
```

**5.2 Product Scraper**
```javascript
// Use existing Weidian scraper or implement new one
async function scrapeWeidianProduct(url) {
  // IMPORTANT: Use the user's existing scraper if available
  // Look for files like: scrape.js, weidian-scraper.js, etc.
  
  // Extract image, price, description from Weidian URL
  // DO NOT scrape name - use the name from request
  
  return {
    image: scrapedImage,
    price: scrapedPrice,
    // ... other fields
  };
}
```

**5.3 Database Operations**
```javascript
// Adapt to user's database schema
// Check if product exists (by URL)
const existing = await db.products.findOne({ link: url });

if (existing) {
  // Update existing product
  await db.products.update(id, newData);
} else {
  // Create new product
  await db.products.create(newData);
}
```

**5.4 Replace Mode Logic**
```javascript
if (replaceMode === 'pinned') {
  // After successful scrape of ALL products:
  await db.products.deleteMany({ isPinned: true });
  // Then insert new products with isPinned: true
}

if (replaceMode === 'all') {
  // After successful scrape of ALL products:
  await db.products.deleteMany({});
  // Then insert new products
}
```

### Step 6: Test Everything

**6.1 Frontend Tests:**
- [ ] Modal opens and closes
- [ ] Text paste mode works
- [ ] File upload mode works
- [ ] Google Sheets URL mode works
- [ ] Progress bar updates
- [ ] Error messages display

**6.2 Backend Tests:**
- [ ] Single product import works
- [ ] Bulk import (10+ products) works
- [ ] "Add/Refresh" mode works
- [ ] "Replace Pinned" mode works
- [ ] "Replace All" mode works

**6.3 Google Sheets Tests:**
- [ ] Public sheet works
- [ ] Header row detected correctly
- [ ] Empty cells handled
- [ ] Access denied shows helpful message

## ⚠️ CRITICAL POINTS

### 1. File Locations Matter!
The files MUST be placed in exact locations:
- `src/components/admin/TemplateImportModal.jsx`
- `src/utils/template-helpers.js`  
- `src/app/api/admin/scrape/sheets/route.js`
- `src/app/api/admin/scrape/template/route.js`

### 2. Don't Modify TemplateImportModal.jsx
This component is self-contained and works out-of-the-box. Only modify:
- API endpoint (if needed)
- Toast function integration
- Categories list (if adding new categories)

### 3. Reuse Existing Code
- Use user's existing Weidian scraper (don't reimplement)
- Use user's existing database connection
- Use user's existing error handling patterns
- Use user's existing toast/notification system

### 4. Product Name Handling
IMPORTANT: The name comes from the user's input (spreadsheet).
DO NOT scrape the name from Weidian. Only scrape: image, price, description.

### 5. Replace Modes are Dangerous
- Make sure confirmation ("REPLACE") is required
- Only delete AFTER successful scrape of ALL products
- Transaction/rollback if any product fails

## 🔍 Finding Existing Code

### Look for Weidian Scraper:
```bash
# Search for files:
- scrape.js
- weidian-scraper.js
- scraper-utils.js
- /api/admin/scrape/route.js
```

### Look for Database Connection:
```bash
# Search for imports:
- @/lib/supabase
- @/lib/db
- @/lib/mongo
- mongoose
- pg
```

### Look for Toast Function:
```bash
# Search in admin panel:
- showToast
- toast.success
- notification.show
- alert/console.log as fallback
```

## 🐛 Common Issues & Quick Fixes

### Issue: "Module not found" for imports
**Fix:** Check import paths match user's project structure
```jsx
// Try these variations:
import { supabase } from '@/lib/supabase';
import { supabase } from '@/utils/supabase';
import { supabase } from '../../../lib/supabase';
```

### Issue: "Google Sheets access denied"
**Fix:** Tell user to make sheet public: "Anyone with the link can view"

### Issue: Products not importing
**Fix:**
1. Check API route is working: `curl http://localhost:3000/api/admin/scrape/template`
2. Check Weidian scraper is working
3. Check database connection is valid
4. Test with single product first

### Issue: Progress not updating
**Fix:** Make sure API returns correct format:
```json
{
  "total": 10,
  "created": 8,
  "updated": 2,
  "successes": 10,
  "failures": 0,
  "results": [...]
}
```

## 📋 Testing Script

Use this to test the complete flow:

```javascript
// 1. Test with minimal data
const testData = {
  products: [
    { name: "Test Product", url: "https://weidian.com/item.html?itemID=123" }
  ],
  replaceMode: "none",
  batch: "best",
  category: "shoes"
};

// 2. Send to API
fetch('/api/admin/scrape/template', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
}).then(r => r.json()).then(console.log);
```

## 🎯 Success Criteria

You've successfully integrated when:
1. ✅ Modal opens in admin panel
2. ✅ Can paste text and see "Detected X products"
3. ✅ Can upload CSV and see "Detected X products"  
4. ✅ Can import from Google Sheets URL
5. ✅ Progress bar shows real-time updates
6. ✅ Products appear in database after import
7. ✅ All 3 modes work (Add, Replace Pinned, Replace All)
8. ✅ Error handling works (shows helpful messages)

## 💬 Communication Templates

### When asking user for info:
```
I need to customize the Template Import backend.

1. What database are you using? (Supabase/MongoDB/PostgreSQL/etc.)
2. Do you have an existing Weidian scraper? (file location?)
3. What is your product database schema? (field names?)
4. Do you have a toast notification function? (showToast/toast.success/etc?)
```

### When reporting progress:
```
✅ Copied frontend files
✅ Copied API routes
✅ Integrated modal in admin panel
🔄 Customizing backend API...
```

### When finished:
```
✅ Template Import integration complete!

You can now:
1. Open admin panel
2. Click "Template Import" button
3. Paste data or use Google Sheets URL
4. Start importing products

Test with EXAMPLE_TEMPLATE.csv included in the package.
```

## 📚 Reference Files

- **Complete Guide:** `AI_INTEGRATION_INSTRUCTIONS.md`
- **Quick Start:** `README.md`
- **Polish Instructions:** `INSTRUKCJA_PL.md` (for user)
- **Example Data:** `EXAMPLE_TEMPLATE.csv`

## 🚀 Let's Go!

1. Read `AI_INTEGRATION_INSTRUCTIONS.md`
2. Follow this checklist step by step
3. Test each step before moving to next
4. Ask user for info when needed
5. Report progress regularly

**Good luck! 🎉**
