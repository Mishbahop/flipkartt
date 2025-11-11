import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { auth, provider, db } from "./firebase-config.js";

const els = {
  catalogGrid: document.getElementById("catalogGrid"),
  dealsGrid: document.querySelector('[data-section="deals"]'),
  categoryNav: document.getElementById("categoryNav"),
  filterCategory: document.getElementById("filterCategory"),
  priceFilter: document.getElementById("priceFilter"),
  priceValue: document.getElementById("priceValue"),
  ratingFilter: document.getElementById("ratingFilter"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  cartBtn: document.getElementById("cartBtn"),
  wishlistBtn: document.getElementById("wishlistBtn"),
  ordersBtn: document.getElementById("ordersBtn"),
  cartDrawer: document.getElementById("cartDrawer"),
  wishlistDrawer: document.getElementById("wishlistDrawer"),
  cartItems: document.getElementById("cartItems"),
  wishlistItems: document.getElementById("wishlistItems"),
  cartTotal: document.getElementById("cartTotal"),
  cartCount: document.getElementById("cartCount"),
  checkoutBtn: document.getElementById("checkoutBtn"),
  loginBtn: document.getElementById("loginBtn"),
  authModal: document.getElementById("authModal"),
  authForm: document.getElementById("authForm"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  googleAuth: document.getElementById("googleAuth"),
  productModal: document.getElementById("productModal"),
  modalImage: document.getElementById("modalImage"),
  modalTitle: document.getElementById("modalTitle"),
  modalBrand: document.getElementById("modalBrand"),
  modalPrice: document.getElementById("modalPrice"),
  modalDescription: document.getElementById("modalDescription"),
  modalAddCart: document.getElementById("modalAddCart"),
  dealCountdown: document.getElementById("dealCountdown"),
  adminBtn: document.getElementById("adminBtn"),
  checkoutModal: document.getElementById("checkoutModal"),
  checkoutForm: document.getElementById("checkoutForm"),
  checkoutAmount: document.getElementById("checkoutAmount"),
  checkoutUpi: document.getElementById("checkoutUpi"),
  shipName: document.getElementById("shipName"),
  shipPhone: document.getElementById("shipPhone"),
  shipAddress1: document.getElementById("shipAddress1"),
  shipAddress2: document.getElementById("shipAddress2"),
  shipCity: document.getElementById("shipCity"),
  shipState: document.getElementById("shipState"),
  shipPostal: document.getElementById("shipPostal"),
  utrInput: document.getElementById("utrInput"),
  paymentNote: document.getElementById("paymentNote"),
  ordersModal: document.getElementById("ordersModal"),
  ordersList: document.getElementById("ordersList"),
  paymentModal: document.getElementById("paymentModal"),
  paymentForm: document.getElementById("paymentForm"),
  paymentOrderId: document.getElementById("paymentOrderId"),
  paymentOrderLabel: document.getElementById("paymentOrderLabel"),
  paymentUtr: document.getElementById("paymentUtr"),
  paymentNotes: document.getElementById("paymentNotes")
};

const STORAGE_KEYS = {
  cart: "cart",
  wishlist: "wishlist",
  shipping: "shippingProfile"
};

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const state = {
  products: [],
  filtered: [],
  cart: readLocal(STORAGE_KEYS.cart, []),
  wishlist: readLocal(STORAGE_KEYS.wishlist, []),
  user: null,
  orders: [],
  isAdmin: false,
  shippingDraft: readLocal(STORAGE_KEYS.shipping, {}),
  activeProduct: null,
  activeCategory: "All"
};

const formatINR = value => `₹${value.toLocaleString("en-IN")}`;

function setLoading(element, isLoading) {
  if (isLoading) {
    element.classList.add("loading");
    if (element.tagName === "BUTTON") {
      element.setAttribute("disabled", "");
    }
  } else {
    element.classList.remove("loading");
    if (element.tagName === "BUTTON") {
      element.removeAttribute("disabled");
    }
  }
}

function showToast(type, message, duration = 3000) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const text = document.createElement("span");
  text.textContent = message;
  toast.appendChild(text);
  
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "×";
  closeBtn.onclick = () => toast.remove();
  toast.appendChild(closeBtn);
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function handleError(error, defaultMessage = "Something went wrong") {
  console.error(error);
  const message = error?.message || defaultMessage;
  showToast("error", message);
}

const PAYMENT_INFO = {
  upiId: "mishbah@upi"
};

const API_ROUTES = {
  placeOrder: "/placeOrder",
  submitPayment: "/submitPayment",
  adminUpdateOrder: "/admin/updateOrder"
};

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  updateSyncStatus("Saved locally");
}

function updateSyncStatus(message) {
  const status = document.getElementById("cartSyncStatus");
  if (status) status.textContent = message;
}

function openDrawer(drawer) {
  drawer.classList.add("open");
}

function closeDrawer(evt) {
  const container = evt.currentTarget.closest(".drawer,dialog");
  if (!container) return;
  if (container.tagName === "DIALOG") {
    container.close();
  } else {
    container.classList.remove("open");
  }
}

function toggleDrawer(drawer) {
  drawer.classList.toggle("open");
}

function cartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function hydrateShippingForm() {
  const draft = state.shippingDraft || {};
  ["shipName", "shipPhone", "shipAddress1", "shipAddress2", "shipCity", "shipState", "shipPostal"].forEach(key => {
    if (els[key]) els[key].value = draft[mapping(key)] || "";
  });
  function mapping(id) {
    return {
      shipName: "fullName",
      shipPhone: "phone",
      shipAddress1: "addressLine1",
      shipAddress2: "addressLine2",
      shipCity: "city",
      shipState: "state",
      shipPostal: "postalCode"
    }[id];
  }
}

function captureShippingPayload() {
  return {
    fullName: els.shipName.value.trim(),
    phone: els.shipPhone.value.trim(),
    addressLine1: els.shipAddress1.value.trim(),
    addressLine2: els.shipAddress2.value.trim(),
    city: els.shipCity.value.trim(),
    state: els.shipState.value.trim(),
    postalCode: els.shipPostal.value.trim()
  };
}

function formatDateTime(value) {
  if (!value) return "";
  const date = value.toDate ? value.toDate() : new Date(value);
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function renderProducts(items) {
  state.filtered = items;
  els.catalogGrid.innerHTML = items
    .map(
      product => `
      <article class="product-card" data-id="${product.id}">
        <img src="${product.imageUrl}" alt="${product.title}" loading="lazy" />
        <h3>${product.title}</h3>
        <p class="brand">${product.brand}</p>
        <p class="price">${formatINR(product.price)}</p>
        <p class="rating">⭐ ${product.rating}</p>
        <div class="actions">
          <button data-action="cart">Add to Cart</button>
          <button data-action="wishlist" class="ghost">Wishlist</button>
          <button data-action="view" class="ghost">View</button>
        </div>
      </article>`
    )
    .join("");
}

function renderDeals() {
  const deals = state.products.filter(p => p.dealExpires && p.dealExpires > Date.now());
  els.dealsGrid.innerHTML = deals
    .map(
      product => `
      <article class="product-card compact" data-id="${product.id}">
        <h4>${product.title}</h4>
        <p>${formatINR(product.price)}</p>
        <button data-action="cart">Add</button>
      </article>`
    )
    .join("");
}

function renderCategories() {
  const categories = ["All", ...new Set(state.products.map(p => p.category))];
  els.categoryNav.innerHTML = categories
    .map(
      cat => `<button class="${cat === state.activeCategory ? "active" : ""}" data-category="${cat}">${cat}</button>`
    )
    .join("");
  els.filterCategory.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
}

function renderCart() {
  els.cartCount.textContent = state.cart.reduce((sum, item) => sum + item.qty, 0);
  els.cartItems.innerHTML = state.cart
    .map(
      item => `
      <article class="cart-card" data-id="${item.id}">
        <div>
          <h4>${item.title}</h4>
          <p>${formatINR(item.price)}</p>
          <p class="qty">
            <button data-action="dec">-</button>
            <span>${item.qty}</span>
            <button data-action="inc">+</button>
          </p>
        </div>
        <button data-action="remove">&times;</button>
      </article>`
    )
    .join("");
  const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  els.cartTotal.textContent = formatINR(total);
}

function renderWishlist() {
  els.wishlistItems.innerHTML = state.wishlist
    .map(
      item => `
      <article class="wishlist-card" data-id="${item.id}">
        <h4>${item.title}</h4>
        <p>${formatINR(item.price)}</p>
        <div class="actions">
          <button data-action="cart">Move to Cart</button>
          <button data-action="remove" class="ghost">Remove</button>
        </div>
      </article>`
    )
    .join("");
}

function renderOrders() {
  if (!state.orders.length) {
    els.ordersList.innerHTML = `<p class="empty-state">No orders yet. Start shopping!</p>`;
    return;
  }
  els.ordersList.innerHTML = state.orders
    .map(order => {
      const orderStatus = order.status || "PENDING";
      const paymentStatus = order.paymentStatus || "PENDING";
      const items = (order.items || [])
        .map(
          item => `
        <li>
          <span>${item.title}</span>
          <span>× ${item.qty}</span>
          <strong>${formatINR((item.price || 0) * item.qty)}</strong>
        </li>`
        )
        .join("");
      return `
      <article class="order-card" data-id="${order.id}">
        <header>
          <div>
            <p class="label">Order</p>
            <strong>#${order.id.slice(-6).toUpperCase()}</strong>
            <small>${formatDateTime(order.createdAt)}</small>
          </div>
          <div class="status-group">
            <span class="pill" data-status="${orderStatus}">${orderStatus}</span>
            <span class="pill muted" data-status="payment-${paymentStatus}">Payment ${paymentStatus}</span>
          </div>
        </header>
        <ul class="order-items">${items}</ul>
        <footer>
          <span>Total: ${formatINR(order.amount || 0)}</span>
          ${
            paymentStatus !== "APPROVED"
              ? `<button class="ghost" data-action="update-payment" data-order="${order.id}">Update UTR</button>`
              : ""
          }
        </footer>
      </article>`;
    })
    .join("");
}

async function fetchMyOrders() {
  if (!state.user) {
    state.orders = [];
    renderOrders();
    return;
  }
  try {
    const q = query(
      collection(db, "orders"),
      where("uid", "==", state.user.uid),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    state.orders = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderOrders();
  } catch (err) {
    handleError(err, "Unable to load orders right now");
    els.ordersList.innerHTML = `<p class="error">Unable to load orders right now.</p>`;
  }
}

function openOrdersModal() {
  if (!state.user) {
    openAuthModal();
    return;
  }
  els.ordersModal.showModal();
  els.ordersList.innerHTML = `<p class="muted">Loading...</p>`;
  fetchMyOrders();
}

function openCheckoutModal() {
  if (!state.user) {
    openAuthModal();
    return;
  }
  if (!state.cart.length) {
    alert("Add something to cart first!");
    return;
  }
  els.checkoutAmount.textContent = formatINR(cartTotal());
  els.checkoutUpi.textContent = PAYMENT_INFO.upiId;
  hydrateShippingForm();
  els.checkoutModal.showModal();
}

async function submitCheckout(evt) {
  evt.preventDefault();
  if (!state.user) {
    openAuthModal();
    return;
  }
  setLoading(evt.target, true);
  if (!state.cart.length) {
    showToast("error", "Add something to cart first!");
    return;
  }
  const shipping = captureShippingPayload();
  const required = ["fullName", "phone", "addressLine1", "city", "state", "postalCode"];
  const missing = required.some(field => !shipping[field]);
  if (missing) {
    showToast("error", "Please complete the shipping form");
    return;
  }
  const payment = {
    utr: els.utrInput.value.trim(),
    note: els.paymentNote.value.trim()
  };
  if (!payment.utr) {
    showToast("error", "Enter the UTR/reference number so we can verify your payment");
    return;
  }
  try {
    const token = await state.user.getIdToken();
    const response = await fetch(API_ROUTES.placeOrder, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        items: state.cart.map(item => ({ productId: item.id, qty: item.qty })),
        shipping,
        payment
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Checkout failed");
    state.shippingDraft = shipping;
    persist(STORAGE_KEYS.shipping, shipping);
    state.cart = [];
    persist(STORAGE_KEYS.cart, state.cart);
    renderCart();
    await syncCartRemote();
    els.checkoutModal.close();
    showToast("success", `Order placed successfully! Reference: ${payload.orderId}`);
    fetchMyOrders();
  } catch (err) {
    console.error(err);
    alert(err.message || "Order failed");
  }
}

function openPaymentModal(orderId) {
  const order = state.orders.find(item => item.id === orderId);
  if (!order) return;
  els.paymentOrderId.value = orderId;
  els.paymentOrderLabel.textContent = `#${orderId.slice(-6).toUpperCase()}`;
  els.paymentUtr.value = (order.payment && order.payment.utr) || "";
  els.paymentNotes.value = (order.payment && order.payment.note) || "";
  els.paymentModal.showModal();
}

async function submitPaymentUpdate(evt) {
  evt.preventDefault();
  if (!state.user) {
    openAuthModal();
    return;
  }
  const orderId = els.paymentOrderId.value;
  const utr = els.paymentUtr.value.trim();
  const note = els.paymentNotes.value.trim();
  if (!orderId || !utr) {
    alert("UTR is required.");
    return;
  }
  try {
    const token = await state.user.getIdToken();
    const response = await fetch(API_ROUTES.submitPayment, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderId, utr, note })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Unable to submit payment");
    els.paymentModal.close();
    alert("Payment proof submitted!");
    fetchMyOrders();
  } catch (err) {
    console.error(err);
    alert(err.message || "Unable to submit payment right now.");
  }
}

function findProduct(productId) {
  return state.products.find(p => p.id === productId);
}

function addToCart(productId) {
  console.log("addToCart called with productId:", productId);
  
  const product = findProduct(productId);
  if (!product) {
    console.error("❌ Product not found:", productId);
    handleError(new Error("Product not found"), "Cannot add to cart");
    return;
  }
  
  try {
    const existing = state.cart.find(item => item.id === productId);
    if (existing) {
      existing.qty += 1;
      console.log(`✓ Increased quantity for ${product.title} to ${existing.qty}`);
      showToast("info", `${product.title} quantity updated to ${existing.qty}`);
    } else {
      state.cart.push({ id: productId, title: product.title, price: product.price, qty: 1 });
      console.log(`✓ Added ${product.title} to cart`);
      showToast("success", `Added "${product.title}" to cart`);
    }
    
    persist(STORAGE_KEYS.cart, state.cart);
    renderCart();
    syncCartRemote();
  } catch (err) {
    console.error("❌ Error adding to cart:", err);
    handleError(err, "Failed to add to cart");
  }
}

function updateCartQuantity(productId, delta) {
  const item = state.cart.find(c => c.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter(c => c.id !== productId);
  }
  persist(STORAGE_KEYS.cart, state.cart);
  renderCart();
  syncCartRemote();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(c => c.id !== productId);
  persist(STORAGE_KEYS.cart, state.cart);
  renderCart();
  syncCartRemote();
}

function addToWishlist(productId) {
  console.log("addToWishlist called with productId:", productId);
  
  const product = findProduct(productId);
  if (!product) {
    console.error("❌ Product not found for wishlist:", productId);
    handleError(new Error("Product not found"), "Cannot add to wishlist");
    return;
  }
  
  // Check if already in wishlist
  if (state.wishlist.some(item => item.id === productId)) {
    console.log("⚠️ Item already in wishlist");
    showToast("info", "Item already in wishlist");
    return;
  }
  
  try {
    state.wishlist.push({ id: productId, title: product.title, price: product.price });
    persist(STORAGE_KEYS.wishlist, state.wishlist);
    renderWishlist();
    showToast("success", `Added "${product.title}" to wishlist`);
    console.log("✓ Item added to wishlist successfully");
  } catch (err) {
    console.error("❌ Error adding to wishlist:", err);
    handleError(err, "Failed to add to wishlist");
  }
}

function removeFromWishlist(productId) {
  state.wishlist = state.wishlist.filter(item => item.id !== productId);
  persist(STORAGE_KEYS.wishlist, state.wishlist);
  renderWishlist();
}

function applyFilters() {
  const term = els.searchInput.value.trim().toLowerCase();
  const category = els.filterCategory.value;
  const maxPrice = Number(els.priceFilter.value);
  const rating = Number(els.ratingFilter.value);
  const filtered = state.products.filter(product => {
    const matchesTerm =
      !term ||
      product.title.toLowerCase().includes(term) ||
      (product.brand || "").toLowerCase().includes(term);
    const matchesCategory = category === "All" || product.category === category;
    const matchesPrice = product.price <= maxPrice;
    const matchesRating = (product.rating || 0) >= rating;
    return matchesTerm && matchesCategory && matchesPrice && matchesRating;
  });
  renderProducts(filtered);
}

function showProductModal(productId) {
  console.log("showProductModal called with productId:", productId);
  const product = findProduct(productId);
  
  if (!product) {
    console.error("❌ Product not found:", productId);
    handleError(new Error("Product not found"), "Unable to load product details");
    return;
  }
  
  console.log("✓ Product found:", product.title);
  
  try {
    state.activeProduct = product;
    els.modalImage.src = product.imageUrl;
    els.modalImage.alt = product.title;
    els.modalTitle.textContent = product.title;
    els.modalBrand.textContent = product.brand;
    els.modalPrice.textContent = formatINR(product.price);
    els.modalDescription.textContent = product.description || "";
    
    if (els.productModal && typeof els.productModal.showModal === "function") {
      els.productModal.showModal();
      console.log("✓ Product modal opened successfully");
    } else {
      console.error("❌ Product modal element not found or showModal not available");
      handleError(new Error("Modal not available"), "Cannot open product details");
    }
  } catch (err) {
    console.error("❌ Error showing product modal:", err);
    handleError(err, "Error loading product details");
  }
}

function openAuthModal() {
  els.authForm.reset();
  els.authModal.showModal();
}

function closeDialogsOnBackdrop(dialog) {
  dialog.addEventListener("click", evt => {
    const rect = dialog.getBoundingClientRect();
    const inside =
      rect.top <= evt.clientY &&
      evt.clientY <= rect.top + rect.height &&
      rect.left <= evt.clientX &&
      evt.clientX <= rect.left + rect.width;
    if (!inside) dialog.close();
  });
}

async function syncCartRemote() {
  if (!state.user) {
    updateSyncStatus("Sign in to sync");
    return;
  }
  
  updateSyncStatus("Syncing...");
  try {
    const cartRef = doc(db, "carts", state.user.uid);
    await setDoc(cartRef, { 
      items: state.cart, 
      updatedAt: serverTimestamp(),
      deviceId: localStorage.getItem("deviceId") || "unknown"
    }, { merge: true });
    updateSyncStatus("Synced to cloud");
  } catch (err) {
    handleError(err, "Failed to sync cart with cloud");
    showToast("info", "Cart changes saved locally");
    updateSyncStatus("Sync failed");
  }
}

async function hydrateCartFromFirestore(uid) {
  try {
    const snapshot = await getDoc(doc(db, "carts", uid));
    if (snapshot.exists()) {
      const remoteData = snapshot.data();
      const remoteCart = remoteData.items || [];
      const remoteDeviceId = remoteData.deviceId;
      const localDeviceId = localStorage.getItem("deviceId");
      
      // If this is a new device, merge carts
      if (!localDeviceId) {
        localStorage.setItem("deviceId", crypto.randomUUID());
        if (state.cart.length && remoteCart.length) {
          // Merge local and remote carts
          const merged = [...state.cart];
          remoteCart.forEach(remoteItem => {
            const existing = merged.find(item => item.id === remoteItem.id);
            if (existing) {
              existing.qty += remoteItem.qty;
            } else {
              merged.push(remoteItem);
            }
          });
          state.cart = merged;
        } else {
          // Use whichever cart has items
          state.cart = state.cart.length ? state.cart : remoteCart;
        }
      } 
      // If remote cart is from same device, or local cart is empty, use remote
      else if (remoteDeviceId === localDeviceId || !state.cart.length) {
        state.cart = remoteCart;
      }
      // Otherwise keep local cart and sync to cloud
      
      persist(STORAGE_KEYS.cart, state.cart);
      renderCart();
      syncCartRemote(); // Sync merged/resolved cart back to cloud
    }
  } catch (err) {
    handleError(err, "Failed to load cart from cloud");
  }
}

function startCountdown() {
  const update = () => {
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    const diff = nextMidnight - Date.now();
    const hrs = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    els.dealCountdown.textContent = `${hrs}:${mins}:${secs} left`;
  };
  update();
  setInterval(update, 1000);
}

els.catalogGrid.addEventListener("click", evt => {
  const card = evt.target.closest(".product-card");
  if (!card) return;
  const productId = card.dataset.id;
  const action = evt.target.dataset.action;
  
  // Debug logging
  if (action) {
    console.log(`🔘 Button clicked: ${action} on product ${productId}`);
  }
  
  if (action === "cart") {
    console.log("Adding to cart:", productId);
    addToCart(productId);
  }
  if (action === "wishlist") {
    console.log("Adding to wishlist:", productId);
    addToWishlist(productId);
  }
  if (action === "view") {
    console.log("Viewing product:", productId);
    showProductModal(productId);
  }
});

els.dealsGrid.addEventListener("click", evt => {
  const card = evt.target.closest(".product-card");
  if (!card) return;
  if (evt.target.dataset.action === "cart") addToCart(card.dataset.id);
});

els.cartItems.addEventListener("click", evt => {
  const card = evt.target.closest(".cart-card");
  if (!card) return;
  const action = evt.target.dataset.action;
  if (!action) return;
  const id = card.dataset.id;
  if (action === "inc") updateCartQuantity(id, 1);
  if (action === "dec") updateCartQuantity(id, -1);
  if (action === "remove") removeFromCart(id);
});

els.wishlistItems.addEventListener("click", evt => {
  const card = evt.target.closest(".wishlist-card");
  if (!card) return;
  const action = evt.target.dataset.action;
  const id = card.dataset.id;
  if (action === "cart") {
    addToCart(id);
    removeFromWishlist(id);
  }
  if (action === "remove") removeFromWishlist(id);
});

els.categoryNav.addEventListener("click", evt => {
  const category = evt.target.dataset.category;
  if (!category) return;
  state.activeCategory = category;
  els.filterCategory.value = category;
  renderCategories();
  applyFilters();
});

["priceFilter", "ratingFilter", "filterCategory"].forEach(id => {
  els[id].addEventListener("input", () => {
    if (id === "priceFilter") els.priceValue.textContent = formatINR(Number(els.priceFilter.value));
    applyFilters();
  });
});
els.searchInput.addEventListener("input", applyFilters);
els.searchBtn.addEventListener("click", applyFilters);

els.cartBtn.addEventListener("click", () => toggleDrawer(els.cartDrawer));
els.wishlistBtn.addEventListener("click", () => toggleDrawer(els.wishlistDrawer));
els.ordersBtn.addEventListener("click", openOrdersModal);
els.checkoutBtn.addEventListener("click", openCheckoutModal);
els.checkoutForm.addEventListener("submit", submitCheckout);
els.paymentForm.addEventListener("submit", submitPaymentUpdate);

document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", closeDrawer));
closeDialogsOnBackdrop(els.productModal);
closeDialogsOnBackdrop(els.authModal);
closeDialogsOnBackdrop(els.checkoutModal);
closeDialogsOnBackdrop(els.ordersModal);
closeDialogsOnBackdrop(els.paymentModal);

els.ordersList.addEventListener("click", evt => {
  const target = evt.target.closest("[data-action='update-payment']");
  if (!target) return;
  openPaymentModal(target.dataset.order);
});

if (els.adminBtn) {
  els.adminBtn.addEventListener("click", () => {
    window.location.href = "/admin.html";
  });
}

els.modalAddCart.addEventListener("click", () => {
  if (!state.activeProduct) return;
  addToCart(state.activeProduct.id);
  els.productModal.close();
});

els.loginBtn.addEventListener("click", () => {
  if (state.user) {
    signOut(auth);
  } else {
    openAuthModal();
  }
});

els.authForm.addEventListener("submit", async evt => {
  evt.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, els.authEmail.value, els.authPassword.value);
    els.authModal.close();
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      await createUserWithEmailAndPassword(auth, els.authEmail.value, els.authPassword.value);
      els.authModal.close();
    } else {
      alert(err.message);
    }
  }
});

els.googleAuth.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
    els.authModal.close();
  } catch (err) {
    alert(err.message);
  }
});

onAuthStateChanged(auth, async user => {
  state.user = user;
  if (user) {
    els.loginBtn.textContent = `Hi, ${user.displayName || "User"} (Sign out)`;
    try {
      const tokenResult = await user.getIdTokenResult();
      state.isAdmin = Boolean(tokenResult.claims.admin);
    } catch (err) {
      console.error("Token error", err);
      state.isAdmin = false;
    }
    els.adminBtn.hidden = !state.isAdmin;
    hydrateCartFromFirestore(user.uid);
    fetchMyOrders();
  } else {
    els.loginBtn.textContent = "Login";
    state.isAdmin = false;
    els.adminBtn.hidden = true;
    state.orders = [];
    renderOrders();
  }
});

function applyInitialFilters() {
  els.priceValue.textContent = formatINR(Number(els.priceFilter.value));
  applyFilters();
}

async function fetchProducts() {
  setLoading(els.catalogGrid, true);
  try {
    const snapshot = await getDocs(collection(db, "products"));
    state.products = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderProducts(state.products);
    renderDeals();
    renderCategories();
    applyInitialFilters();
  } catch (err) {
    handleError(err, "Unable to load products");
    els.catalogGrid.innerHTML = `<p class="error">Unable to load products. Please try again.</p>`;
  } finally {
    setLoading(els.catalogGrid, false);
  }
}

function start() {
  els.checkoutUpi.textContent = PAYMENT_INFO.upiId;
  hydrateShippingForm();
  renderCart();
  renderWishlist();
  renderOrders();
  startCountdown();
  fetchProducts().catch(console.error);
}

start();
