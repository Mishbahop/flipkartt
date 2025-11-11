/**
 * DEBUG SCRIPT FOR VIEW AND WISHLIST BUTTONS
 * 
 * Run this in browser console (F12) to diagnose issues
 */

console.log("🔍 DEBUGGING VIEW AND WISHLIST BUTTONS");
console.log("=====================================\n");

// Check if elements exist
console.log("✅ STEP 1: Checking if DOM elements exist...");
const catalogGrid = document.getElementById("catalogGrid");
const productCards = document.querySelectorAll(".product-card");

console.log(`✓ Catalog Grid Found: ${catalogGrid ? "YES" : "NO"}`);
console.log(`✓ Product Cards Found: ${productCards.length} cards`);

if (productCards.length > 0) {
  const firstCard = productCards[0];
  const buttons = firstCard.querySelectorAll("button");
  console.log(`✓ First Card Has Buttons: ${buttons.length} buttons`);
  
  buttons.forEach((btn, i) => {
    console.log(`  - Button ${i+1}: data-action="${btn.dataset.action}", text="${btn.textContent}"`);
  });
} else {
  console.error("❌ No product cards found!");
}

// Check if event listener is attached
console.log("\n✅ STEP 2: Testing event listener...");
if (catalogGrid) {
  console.log("✓ Event listener is attached to catalog grid");
  
  // Simulate a click
  if (productCards.length > 0) {
    const firstViewBtn = productCards[0].querySelector('[data-action="view"]');
    const firstWishlistBtn = productCards[0].querySelector('[data-action="wishlist"]');
    
    if (firstViewBtn) {
      console.log("✓ View button found");
      console.log("  Try clicking View button now...");
    } else {
      console.error("❌ View button not found");
    }
    
    if (firstWishlistBtn) {
      console.log("✓ Wishlist button found");
      console.log("  Try clicking Wishlist button now...");
    } else {
      console.error("❌ Wishlist button not found");
    }
  }
}

// Check if functions exist
console.log("\n✅ STEP 3: Checking if JavaScript functions exist...");
console.log(`✓ showProductModal exists: ${typeof showProductModal === "function" ? "YES" : "NO"}`);
console.log(`✓ addToWishlist exists: ${typeof addToWishlist === "function" ? "YES" : "NO"}`);
console.log(`✓ findProduct exists: ${typeof findProduct === "function" ? "YES" : "NO"}`);

// Check if product modal exists
console.log("\n✅ STEP 4: Checking product modal...");
const productModal = document.getElementById("productModal");
console.log(`✓ Product Modal Element: ${productModal ? "FOUND" : "NOT FOUND"}`);

if (productModal) {
  console.log(`✓ Product Modal Is Dialog: ${productModal.tagName === "DIALOG" ? "YES" : "NO"}`);
  console.log(`✓ Product Modal showModal Method: ${typeof productModal.showModal === "function" ? "YES" : "NO"}`);
}

// Check if products are loaded
console.log("\n✅ STEP 5: Checking if products are loaded...");
console.log(`Number of product cards rendered: ${productCards.length}`);
if (productCards.length === 0) {
  console.error("❌ NO PRODUCTS LOADED - This is the problem!");
  console.log("\nSOLUTION:");
  console.log("1. Go to Firebase Console");
  console.log("2. Check Firestore Database");
  console.log("3. Run: node scripts/seed-products.mjs");
  console.log("4. Then refresh the page");
}

// Test the click handler manually
console.log("\n✅ STEP 6: Manual test...");
console.log("Commands to run in console:");
console.log(`
// Get first product ID
const firstCard = document.querySelector('.product-card');
const productId = firstCard.dataset.id;
console.log('Product ID:', productId);

// Try view function
showProductModal(productId);

// Try wishlist function
addToWishlist(productId);
`);

// Final diagnosis
console.log("\n" + "=".repeat(50));
console.log("🔍 DIAGNOSIS COMPLETE");
console.log("=".repeat(50));

if (productCards.length === 0) {
  console.error("\n⚠️  MAIN ISSUE: No products loaded");
  console.error("FIX: Seed the database with: node scripts/seed-products.mjs");
} else {
  const viewBtns = document.querySelectorAll('[data-action="view"]');
  const wishlistBtns = document.querySelectorAll('[data-action="wishlist"]');
  
  if (viewBtns.length > 0 && wishlistBtns.length > 0) {
    console.log("\n✅ All elements are in place!");
    console.log("✅ Try clicking the buttons on the page");
    console.log("✅ If still not working, check browser console for errors");
  }
}

console.log("\n💡 TIPS:");
console.log("1. Press F12 to open console");
console.log("2. Click the red X icon to see errors");
console.log("3. Copy any error messages");
console.log("4. Check TROUBLESHOOTING.md for solutions");
