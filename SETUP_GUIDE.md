# Flipkart Clone - Complete Setup Guide

## ✅ Features Enabled

This guide will help you enable and test all the main functions of your e-commerce application.

### 1. Authentication
- Email/Password signup and login
- Google authentication
- Admin user detection

### 2. Cart Management
- Add to cart
- Remove from cart
- Update quantities
- Local storage + Firestore sync
- Cart count badge

### 3. Wishlist
- Add to wishlist
- Remove from wishlist
- Move items from wishlist to cart

### 4. Products
- Browse all products
- Filter by category, price, rating
- Search products
- View product details

### 5. Orders
- Place orders with shipping details
- Payment proof submission (UPI)
- Track order status
- View payment status

### 6. Admin Features
- Manage orders
- Update payment status
- Review orders

---

## 📋 Pre-Setup Requirements

1. **Firebase Project Created** ✓
   - Project ID: `mishbah-e8e33`
   - Web app initialized

2. **Service Account Key** ✓
   - Downloaded and saved as `service-account.json`

3. **Node.js & npm** ✓
   - Already installed

---

## 🚀 Step-by-Step Setup

### Step 1: Enable Firebase Authentication
1. Go to Firebase Console → Authentication
2. Enable "Email/Password" provider
3. Enable "Google" provider

### Step 2: Create a Test User
1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Email: `test@example.com`
4. Password: `Test123456`
5. Click "Create user"

### Step 3: Add Sample Products
Run this command to seed sample products:
```powershell
node scripts/seed-products.mjs
```

This will add sample products to your Firestore database with:
- Product names and descriptions
- Prices and ratings
- Categories (Electronics, Fashion, Home, Books)
- Images

### Step 4: Set Admin User
After creating your admin user account in the app, run:
```powershell
node scripts/set-admin.js your-email@example.com
```

Replace `your-email@example.com` with your actual admin email.

### Step 5: Deploy Firebase Rules
Deploy your updated Firestore security rules:
```powershell
firebase deploy --only firestore:rules
```

### Step 6: Deploy Cloud Functions
Deploy your Cloud Functions for orders:
```powershell
firebase deploy --only functions
```

---

## 🧪 Testing the Features

### Test 1: Authentication
1. Open your app in a browser
2. Click "Login"
3. Enter test credentials:
   - Email: `test@example.com`
   - Password: `Test123456`
4. Click "Continue" or "Continue with Google"
5. You should be logged in

### Test 2: Browse Products
1. After logging in, products should appear on the main page
2. Try filtering by category, price, rating
3. Use the search bar to find products

### Test 3: Cart Functions
1. Click "Add to Cart" on any product
2. Cart count badge should update
3. Click "Cart" button to open cart drawer
4. Test:
   - Increase/decrease quantity with +/- buttons
   - Remove items with × button
   - Cart total should update

### Test 4: Wishlist
1. Click "Wishlist" button on a product
2. Click "Wishlist" in header to view
3. Test moving items to cart
4. Test removing items

### Test 5: Checkout
1. Add items to cart
2. Click "Place Order" button
3. Fill shipping form:
   - Full Name
   - Phone number
   - Address
   - City, State, Postal Code
4. Copy a UPI reference number (or use: 211810179851)
5. Paste it in the UTR field
6. Click "Submit UTR & Place Order"

### Test 6: Orders
1. Click "Orders" in header
2. View your placed orders
3. See order status and payment status
4. If payment not approved, click "Update UTR"

### Test 7: Admin Functions
1. Log in with your admin account
2. "Admin" button should appear
3. Click it to access admin dashboard
4. Manage orders, verify payments

---

## 🔧 Troubleshooting

### Cart not syncing?
- Check browser console for errors (F12)
- Make sure you're logged in
- Check Firestore rules are deployed

### Products not loading?
- Run `node scripts/seed-products.mjs` to add samples
- Check Firestore has "products" collection
- Check browser console for errors

### Login not working?
- Verify Firebase Authentication is enabled
- Check firestore.rules are deployed
- Clear browser cache and try again

### Admin not showing?
- Make sure you ran `set-admin.js` with correct email
- Sign out and sign back in
- Check browser console for token errors

---

## 📱 Deploy to Firebase Hosting

When ready to go live:

```powershell
# Build and prepare
firebase deploy

# View your live site
firebase open hosting:site
```

Your site will be available at: `https://mishbah-e8e33.web.app`

---

## 📞 Support

For Firebase issues:
- Firebase Console: https://console.firebase.google.com
- Firebase Docs: https://firebase.google.com/docs

For code issues:
- Check browser console (F12)
- Check Firebase console logs
- Review the error messages in toast notifications
