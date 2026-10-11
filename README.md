# 📦 Template Import Feature - Complete Package

## 🚀 Quick Start (5 Minutes)

This package contains everything you need to add bulk product import functionality to your admin panel.

### What You Get:
✅ **3 Import Methods**: Paste text, Upload file, Google Sheets URL  
✅ **3 Import Modes**: Add/Refresh, Replace Pinned, Replace All  
✅ **Auto Category Detection**: AI-powered or manual selection  
✅ **Real-time Progress**: Live progress bar with detailed logs  
✅ **Error Handling**: Graceful failures with helpful messages  

---

## 📁 Files Included

```
TEMPLATE_IMPORT_PACKAGE/
├── README.md                           ← Quick start guide (you are here)
├── AI_INTEGRATION_INSTRUCTIONS.md      ← Complete integration guide for AI
├── TemplateImportModal.jsx             ← React component (frontend)
├── template-helpers.js                 ← Parsing utilities
├── sheets-route.js                     ← Google Sheets proxy API
└── template-route.js                   ← Template processing API (backend)
```

---

## ⚡ 3-Step Integration

### Step 1: Copy Files to Your Project
```bash
# Frontend files
cp TemplateImportModal.jsx → src/components/admin/
cp template-helpers.js → src/utils/

# API routes (Next.js App Router)
cp sheets-route.js → src/app/api/admin/scrape/sheets/route.js
cp template-route.js → src/app/api/admin/scrape/template/route.js
```

### Step 2: Add to Your Admin Panel
```jsx
import TemplateImportModal from '@/components/admin/TemplateImportModal';

// In your component:
const [showTemplateModal, setShowTemplateModal] = useState(false);

// Add button:
<button onClick={() => setShowTemplateModal(true)}>
  📋 Template Import
</button>

// Render modal:
<TemplateImportModal
  isOpen={showTemplateModal}
  onClose={() => setShowTemplateModal(false)}
  onImportComplete={(data) => {
    console.log('Imported:', data);
    fetchProducts(); // Refresh your product list
  }}
  showToast={(msg, type) => console.log(type, msg)}
/>
```

### Step 3: Test It!
1. Click "Template Import" button
2. Paste some data: `Product Name [TAB] https://weidian.com/item.html?itemID=123`
3. Click "Start Import"
4. Watch the magic happen! ✨

---

## 📋 Google Sheets Format

Create a Google Sheet with 2 columns:

| Name (A)          | Link (B)                                      |
|-------------------|-----------------------------------------------|
| Nike AF1          | https://weidian.com/item.html?itemID=123      |
| Jordan 1 High     | https://weidian.com/item.html?itemID=456      |

**Important:**
- Share settings: "Anyone with the link can view"
- Column A = Product Name
- Column B = Weidian URL
- Other columns are ignored

---

## 🎨 Features

### Input Methods
1. **Paste Text** - Copy/paste from Excel or Google Sheets
2. **Upload File** - Drag & drop CSV/TXT files
3. **Google Sheets** - Direct import from URL

### Import Modes
1. **Add/Refresh** - Safe mode, adds new + updates existing
2. **Replace Pinned** - Deletes pinned products, imports new ones
3. **Replace All** - Nuclear option, deletes everything

### Options
- **Batch Selection**: Best, Budget, Random, Popular
- **Category**: Auto-detect or force specific category
- **Real-time Progress**: See exactly what's happening
- **Error Logs**: Know which products failed and why

---

## 🔧 Backend Requirements

Your backend API must:

1. **Scrape Weidian Products**
   - Extract image, price, description from URL
   - Use provided name (don't scrape name)

2. **Handle Replace Modes**
   - `none`: Add/update products
   - `pinned`: Delete pinned, then add new
   - `all`: Delete all, then add new

3. **Return Progress**
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

See `AI_INTEGRATION_INSTRUCTIONS.md` for complete backend implementation details.

---

## 🛠️ Customization

### Change API Endpoint
```jsx
<TemplateImportModal
  apiEndpoint="/api/your-endpoint"
/>
```

### Custom Toast Notifications
```jsx
<TemplateImportModal
  showToast={(message, type) => {
    yourToastLib.show(message, type);
  }}
/>
```

### Add More Categories
Edit the category dropdown in `TemplateImportModal.jsx`:
```jsx
<option value="your-category">🏷️ Your Category</option>
```

---

## 🚨 Troubleshooting

### "Google Sheets access denied"
→ Make sheet public: "Anyone with the link can view"

### "No valid template data found"
→ Check format: Name [TAB] Link (both required)

### "Failed to fetch"
→ Verify backend API is running at `/api/admin/scrape/template`

### Products not importing
→ Check console errors, test with single product first

---

## 📚 Documentation

- **Quick Start**: This file (README.md)
- **Complete Guide**: AI_INTEGRATION_INSTRUCTIONS.md
- **Component Docs**: See comments in TemplateImportModal.jsx
- **Helper Functions**: See comments in template-helpers.js

---

## 💡 Pro Tips

1. Test with 2-3 products first
2. Use "Add/Refresh" mode initially
3. Keep Google Sheets simple (just Name + Link)
4. Monitor the progress logs
5. Start with manual category selection before using auto-detect

---

## 🎯 Example Use Cases

### Use Case 1: Bulk Add Products
1. Create Google Sheet with product list
2. Open Template Import
3. Paste Google Sheets URL
4. Select "Add/Refresh" mode
5. Choose "best" batch
6. Click "Start Import"

### Use Case 2: Replace Seasonal Catalog
1. Prepare new product list
2. Select "Replace All" mode
3. Type "REPLACE" to confirm
4. Import new catalog

### Use Case 3: Update Prices
1. Export current products to Google Sheets
2. Update prices in Sheet
3. Select "Add/Refresh" mode
4. Existing products get updated with new prices

---

## 📞 Need Help?

Read the complete integration guide:
→ `AI_INTEGRATION_INSTRUCTIONS.md`

Check the code comments in:
→ `TemplateImportModal.jsx`
→ `template-helpers.js`

Test the components step by step:
→ Start with frontend modal only
→ Then add Google Sheets proxy
→ Finally implement backend processing

---

**Happy Importing! 🎉**
