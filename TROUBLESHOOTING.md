# 🔧 FLIPKART CLONE - TROUBLESHOOTING GUIDE

## Common Issues & Solutions

### ❌ Cart Not Working

**Problem:** "Add to Cart" button doesn't work or cart doesn't update

**Solutions:**
1. **Check if you're logged in**
   - Click "Login" and authenticate first
   - Cart requires user authentication

2. **Check browser console for errors**
   - Press `F12` to open Developer Tools
   - Click "Console" tab
   - Look for red error messages
   - Copy the error and search for solutions

3. **Clear browser cache and reload**
   - Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
   - Clear "All time" data
   - Reload the page

4. **Check Firestore permissions**
   - Go to Firebase Console
   - Check Firestore Rules are deployed
   - Run: `firebase deploy --only firestore:rules`

5. **Test in browser console**
   ```javascript
   // Open console (F12) and paste:
   testCart.viewCart()  // View cart items
   testCart.clearCart() // Clear cart
   ```

---

### ❌ Wishlist Not Working

**Problem:** Wishlist button doesn't respond or items don't save

**Solutions:**
1. **Verify wishlist drawer exists**
   - Right-click on page > Inspect
   - Search for `id="wishlistDrawer"`
   - It should exist in HTML

2. **Check localStorage**
   ```javascript
   // In browser console:
   testCart.viewWishlist()  // See all wishlist items
   ```

3. **Clear and try again**
   ```javascript
   // In browser console:
   testCart.clearWishlist()  // Reset wishlist
   ```

---

### ❌ Products Not Loading

**Problem:** Main page shows empty grid with no products

**Solutions:**
1. **Ensure products are seeded**
   ```powershell
   # In project root:
   node scripts/seed-products.mjs
   ```

2. **Check Firestore Database**
   - Go to Firebase Console
   - Click Firestore Database
   - Look for "products" collection
   - Should have 16+ documents

3. **Check browser console for errors**
   - Press `F12`
   - Look for Firestore connection errors
   - Common error: "Missing or insufficient permissions"

4. **Verify Firestore Rules**
   - Products should be readable by anyone
   - Check `firestore.rules` has:
   ```
   match /products/{productId} {
     allow read: if true;
   }
   ```

5. **Try refreshing page**
   - Press `Ctrl + F5` (hard refresh)
   - Wait for products to load

---

### ❌ Checkout Not Working

**Problem:** "Place Order" button doesn't work or form won't submit

**Solutions:**
1. **Make sure you're logged in**
   - Must be authenticated to checkout

2. **Ensure you have items in cart**
   - Add at least one product to cart
   - Cart badge should show count

3. **Fill all required fields**
   - Full Name (required)
   - Phone (required)
   - Address Line 1 (required)
   - City (required)
   - State (required)
   - Postal Code (required)
   - UTR / Reference (required)

4. **Check UTR format**
   - Must be a valid reference number
   - Example: `211810179851`
   - Get from your UPI transaction confirmation

5. **Check browser console for errors**
   - Press `F12`
   - Look for error messages during checkout
   - Check for authentication errors

6. **Verify Cloud Functions are deployed**
   ```powershell
   firebase deploy --only functions
   ```

---

### ❌ Orders Not Loading

**Problem:** "Orders" page shows no orders or "Loading..." forever

**Solutions:**
1. **Make sure you're logged in**
   - Orders are user-specific

2. **Place at least one order first**
   - Complete a checkout first
   - Then view orders

3. **Check Firestore Orders collection**
   - Go to Firebase Console
   - Click Firestore Database
   - Look for "orders" collection
   - Your order should be there

4. **Check permissions in browser console**
   ```
   If you see "Missing or insufficient permissions":
   - Cloud Functions might not have completed
   - Wait a few seconds and refresh
   - Check Cloud Functions logs in Firebase Console
   ```

5. **Verify Firestore Rules**
   - Users can only see their own orders
   - Admins can see all orders
   - Check `firestore.rules`

---

### ❌ Admin Button Not Showing

**Problem:** Admin button is hidden or doesn't appear

**Solutions:**
1. **Verify user is admin**
   ```powershell
   # Make sure you ran this:
   node scripts/set-admin.js your-email@example.com
   ```

2. **Sign out and sign back in**
   - Admin status is refreshed on login
   - Click "Login" and logout first
   - Then login again

3. **Check service account credentials**
   - `service-account.json` must have valid credentials
   - Get from Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Replace entire contents of `service-account.json`

4. **Check console for token errors**
   - Press `F12` > Console
   - Look for "Token error" or "UNAUTHENTICATED"

5. **Verify admin script ran successfully**
   ```powershell
   # Should see output like:
   # "Successfully set admin privileges for user..."
   ```

---

### ❌ Login Not Working

**Problem:** Can't login or signup with email/password or Google

**Solutions:**
1. **Check Firebase Authentication**
   - Go to Firebase Console
   - Click Authentication
   - Verify "Email/Password" is enabled
   - Verify "Google" is enabled

2. **Verify user account exists**
   - Go to Firebase Console
   - Click Authentication > Users
   - Look for your email
   - If missing, create a new user first

3. **Check password requirements**
   - Firebase requires minimum 6 characters
   - Use password: `Test123456` for testing

4. **Google authentication not working?**
   - Check OAuth consent screen is configured
   - Add your email to test users
   - Go to Firebase Console > Authentication > OAuth consent screen

5. **Check browser console for errors**
   - Press `F12`
   - Look for auth errors
   - Common: "auth/user-not-found", "auth/wrong-password"

---

### ❌ Search/Filter Not Working

**Problem:** Filters don't apply or search doesn't find products

**Solutions:**
1. **Make sure products are loaded**
   - Products must load first
   - Wait for grid to show products

2. **Check filter values**
   - Category: Must match exactly
   - Price: Must be numeric
   - Rating: Must be 0, 3, or 4

3. **Try clearing filters**
   - Reset category to "All"
   - Reset price to max (200000)
   - Reset rating to "All"
   - Try searching again

4. **Type search term carefully**
   - Case-insensitive (should work)
   - Searches product name and brand
   - Try: "Samsung", "Apple", "Electronics"

---

### ✅ Testing Checklist

Use this to verify everything works:

- [ ] Products load on page
- [ ] Can add product to cart
- [ ] Cart count updates
- [ ] Can remove from cart
- [ ] Can increase/decrease quantity
- [ ] Can add to wishlist
- [ ] Can move wishlist item to cart
- [ ] Can filter by category
- [ ] Can filter by price
- [ ] Can search products
- [ ] Can login/logout
- [ ] Can checkout with order
- [ ] Can view orders
- [ ] Can update payment proof
- [ ] Admin can see orders (if admin)

---

### 🆘 Still Having Issues?

**Check these in order:**

1. **Browser Console Errors**
   ```
   Press F12 > Console tab
   Look for any RED error messages
   Screenshot and note the exact error
   ```

2. **Firebase Console Logs**
   ```
   Go to Firebase Console
   Click Functions
   Check Recent Logs for errors
   Look for red "Error" entries
   ```

3. **Network Tab**
   ```
   Press F12 > Network tab
   Reload page
   Look for failed requests (red ones)
   Check which API calls are failing
   ```

4. **Common Error Codes**
   ```
   auth/user-not-found → User doesn't exist
   auth/wrong-password → Password is wrong
   permission-denied → Firestore rules issue
   UNAUTHENTICATED → Not logged in
   ```

---

### 📞 Getting Help

**If error messages mention:**

- **"permission-denied"** → Firestore rules issue
  - Solution: `firebase deploy --only firestore:rules`

- **"UNAUTHENTICATED"** → Not logged in
  - Solution: Click Login and authenticate

- **"user-not-found"** → Account doesn't exist
  - Solution: Create account or use existing email

- **"Cloud Functions error"** → Backend issue
  - Solution: `firebase deploy --only functions`

- **"Missing products"** → No data in database
  - Solution: `node scripts/seed-products.mjs`

---

### 🔄 Quick Fixes (Try These First)

```powershell
# 1. Clear everything and redeploy
firebase deploy

# 2. Seed products again
node scripts/seed-products.mjs

# 3. Deploy just rules
firebase deploy --only firestore:rules

# 4. Deploy just functions
firebase deploy --only functions

# 5. Hard refresh browser
# Windows: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# 6. Clear browser cache
# Chrome: Settings > Privacy > Clear browsing data
```

---

### 💡 Pro Tips

1. **Always check browser console first**
   - F12 > Console tab
   - Most issues show error messages there

2. **Keep Firebase Console open**
   - Check logs while testing
   - See real-time errors

3. **Use test data**
   ```
   Email: test@example.com
   Password: Test123456
   UTR: 211810179851
   ```

4. **Clear data between tests**
   ```javascript
   // In browser console:
   localStorage.clear()
   location.reload()
   ```

5. **Test on different browsers**
   - Chrome, Firefox, Safari
   - Each has slightly different behavior

---

✨ **Most issues are solved by:**
1. Clearing browser cache
2. Checking browser console
3. Redeploying Firebase
4. Hard refreshing the page

**Try these first before diving deeper!**
