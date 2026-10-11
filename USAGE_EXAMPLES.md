# 📖 Usage Examples

## Example 1: Import 10 Products from Google Sheets

### Step 1: Create Google Sheet
```
| Name              | Link                                          |
|-------------------|-----------------------------------------------|
| Nike AF1          | https://weidian.com/item.html?itemID=123      |
| Jordan 1          | https://weidian.com/item.html?itemID=456      |
| Yeezy 350         | https://weidian.com/item.html?itemID=789      |
```

### Step 2: Share the Sheet
- Click "Share" button
- Change to: "Anyone with the link can view"
- Copy the URL

### Step 3: Import
1. Open admin panel
2. Click "Template Import"
3. Select "Google Sheets URL" tab
4. Paste URL
5. Click fetch button (🔄)
6. Select mode: "Add / Refresh"
7. Select batch: "best"
8. Click "Start Import"

### Result:
```
✅ Import completed
Added: 10
Refreshed: 0
Errors: 0
```

---

## Example 2: Copy/Paste from Excel

### Step 1: Prepare Data in Excel
```
Column A (Name)    | Column B (Link)
Nike Dunk Low      | https://weidian.com/item.html?itemID=111
Jordan 4           | https://weidian.com/item.html?itemID=222
Yeezy Slide        | https://weidian.com/item.html?itemID=333
```

### Step 2: Copy Data
- Select cells A1:B3 (including data, not headers)
- Press Ctrl+C (or Cmd+C on Mac)

### Step 3: Import
1. Open admin panel
2. Click "Template Import"
3. Make sure "Paste Text" tab is selected
4. Click in the text area
5. Press Ctrl+V (or Cmd+V)
6. You should see: "Detected 3 products"
7. Select mode: "Add / Refresh"
8. Select batch: "best"
9. Click "Start Import"

---

## Example 3: Upload CSV File

### Step 1: Create CSV File
Save this as `products.csv`:
```csv
Name,Link
Nike Tech Fleece,https://weidian.com/item.html?itemID=4438424861
Jordan Hoodie,https://weidian.com/item.html?itemID=4401171332
Essentials Hoodie,https://weidian.com/item.html?itemID=4477393808
```

### Step 2: Import
1. Open admin panel
2. Click "Template Import"
3. Select "Upload File" tab
4. Click "Choose File" or drag & drop
5. Select your `products.csv` file
6. You should see: "Detected 3 products"
7. Select mode: "Add / Refresh"
8. Select batch: "best"
9. Click "Start Import"

---

## Example 4: Replace Pinned Products

**Use Case:** You want to replace all pinned (featured) products with a new seasonal collection.

### Step 1: Prepare New Collection
```
| Name                  | Link                                     |
|-----------------------|------------------------------------------|
| Spring Jordan 1       | https://weidian.com/item.html?itemID=111 |
| Spring Nike Dunk      | https://weidian.com/item.html?itemID=222 |
| Spring Yeezy 350      | https://weidian.com/item.html?itemID=333 |
```

### Step 2: Import with Replace Mode
1. Open admin panel
2. Click "Template Import"
3. Paste data or use Google Sheets URL
4. Select mode: **"Replace Pinned"** ⚠️
5. Type "REPLACE" in the confirmation box
6. Select batch: "popular"
7. Click "Start Import"

### Result:
```
✅ Import completed
Deleted: 15 (old pinned products)
Added: 3 (new pinned products)
```

**Note:** Old pinned products are deleted AFTER successful import of all new products.

---

## Example 5: Replace Entire Catalog

**Use Case:** You want to start fresh with a completely new product catalog.

### ⚠️ WARNING: This will delete ALL products!

### Step 1: Prepare Complete New Catalog
Make sure you have ALL products you want in your catalog.

### Step 2: Import with Nuclear Option
1. Open admin panel
2. Click "Template Import"
3. Load your complete product list
4. Select mode: **"Replace All Catalog"** ⚠️⚠️⚠️
5. Type "REPLACE" in the confirmation box
6. Select batch: "best"
7. Click "Start Import"

### Result:
```
✅ Import completed
Deleted: 1247 (all old products)
Added: 250 (new catalog)
```

**Note:** All old products are deleted AFTER successful import of all new products.

---

## Example 6: Force Specific Category

**Use Case:** You're importing only shoes and want to skip auto-detection.

### Step 1: Prepare Data
```
| Name              | Link                                          |
|-------------------|-----------------------------------------------|
| AF1 White         | https://weidian.com/item.html?itemID=123      |
| Dunk Low Panda    | https://weidian.com/item.html?itemID=456      |
| Jordan 4 Military | https://weidian.com/item.html?itemID=789      |
```

### Step 2: Import with Fixed Category
1. Open admin panel
2. Click "Template Import"
3. Load your data
4. Select mode: "Add / Refresh"
5. Select batch: "best"
6. **Category**: Select "👟 Shoes" (instead of Auto-detect)
7. Click "Start Import"

### Result:
All 3 products will be categorized as "shoes" regardless of their names.

---

## Example 7: Update Existing Products

**Use Case:** You want to update prices or refresh data for existing products.

### Step 1: Export Current Products
1. Export your current product list (URLs)
2. Keep the same URLs

### Step 2: Prepare Update Data
```
| Name (can be updated) | Link (must match)                      |
|-----------------------|----------------------------------------|
| Nike AF1 - Updated    | https://weidian.com/item.html?itemID=123 |
| Jordan 1 - New Price  | https://weidian.com/item.html?itemID=456 |
```

### Step 3: Import
1. Open admin panel
2. Click "Template Import"
3. Load your updated data
4. Select mode: "Add / Refresh"
5. Click "Start Import"

### Result:
```
✅ Import completed
Added: 0
Refreshed: 2 (existing products updated)
Errors: 0
```

**Note:** Products are matched by URL. If URL exists, product is updated with new data.

---

## Example 8: Mixed Batch Import

**Use Case:** You want different batches for different products.

### Current Limitation:
The modal assigns ONE batch to ALL products in a single import.

### Workaround:
1. **First import** - Best batch products:
   ```
   Products: [Nike AF1, Jordan 1, Yeezy 350]
   Batch: "best"
   ```

2. **Second import** - Budget batch products:
   ```
   Products: [Budget Dunks, Budget AF1]
   Batch: "budget"
   ```

3. **Third import** - Popular items:
   ```
   Products: [Trending Jordan 4, Hot Yeezy]
   Batch: "popular"
   ```

---

## Example 9: Handling Import Errors

### Scenario: Some products fail to import

### What You See:
```
⏳ Import in progress...
✅ Nike AF1 - created
✅ Jordan 1 - created
❌ Yeezy 350 - Failed to scrape
✅ Dunk Low - created
```

### What To Do:
1. Check the error logs in the progress section
2. Common errors:
   - "Failed to scrape" → Weidian URL might be invalid
   - "Access denied" → Product page restricted
   - "Not found" → itemID doesn't exist
3. Fix the problematic URLs
4. Re-run import (only failed products will be retried)

---

## Example 10: Large Bulk Import (100+ Products)

### Best Practices:

1. **Test First** - Import 5-10 products to verify setup
2. **Check Progress** - Monitor the progress bar
3. **Wait Patiently** - Large imports take time (500ms per product)
4. **Don't Close Tab** - Keep browser tab open during import
5. **Review Results** - Check success/failure counts
6. **Handle Failures** - Re-import failed products if needed

### Estimated Times:
- 10 products: ~5 seconds
- 50 products: ~25 seconds
- 100 products: ~50 seconds
- 500 products: ~4 minutes

---

## Common Patterns

### Pattern 1: Weekly Catalog Update
```
1. Export current top 50 products
2. Update prices in spreadsheet
3. Import with "Add / Refresh" mode
4. Products auto-update with new data
```

### Pattern 2: Seasonal Rotation
```
1. Prepare new season products
2. Import with "Replace Pinned" mode
3. Old featured items removed
4. New season items become featured
```

### Pattern 3: Fresh Start
```
1. Backup current catalog (export)
2. Prepare complete new catalog
3. Import with "Replace All" mode
4. Entire catalog refreshed
```

### Pattern 4: Gradual Addition
```
1. Add 10-20 products daily
2. Use "Add / Refresh" mode
3. Batch: "best" for premium items
4. Batch: "budget" for cheaper alternatives
```

---

## Tips & Tricks

### ✅ DO:
- Test with small batch first
- Use "Add/Refresh" for safety
- Keep Google Sheets public
- Include all required columns
- Monitor progress logs
- Review imported products

### ❌ DON'T:
- Close browser during import
- Use "Replace All" without backup
- Mix different product types in one category setting
- Import while editing products manually
- Forget to set sheet to public
- Skip testing with small batch

---

## Troubleshooting Guide

### Problem: "Detected 0 products"
**Solutions:**
- Check format: Name [TAB] Link (for paste)
- Check columns: A=Name, B=Link (for CSV)
- Verify Weidian URLs are present
- Remove header row if detected as data

### Problem: "Google Sheets access denied"
**Solution:**
- Share > Change to "Anyone with link"
- Use /export?format=csv URL
- Check sheet is not private

### Problem: "Some products failed"
**Solutions:**
- Check Weidian URLs are valid
- Verify itemIDs exist
- Check rate limiting (too fast?)
- Re-import failed items only

### Problem: "Import is slow"
**Explanation:**
- Each product needs to be scraped
- Average: 500ms per product
- This is normal and expected
- Be patient with large imports

---

**More questions? Check `AI_INTEGRATION_INSTRUCTIONS.md` for detailed documentation.**
