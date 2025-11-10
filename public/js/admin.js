import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  limit
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { auth, provider, db } from "./firebase-config.js";

const els = {
  status: document.getElementById("adminStatus"),
  authBtn: document.getElementById("adminAuthBtn"),
  signOutBtn: document.getElementById("adminSignOut"),
  authMessage: document.getElementById("adminAuthMessage"),
  emailForm: document.getElementById("adminEmailForm"),
  emailInput: document.getElementById("adminEmail"),
  passwordInput: document.getElementById("adminPassword"),
  navButtons: document.querySelectorAll(".admin-nav [data-section]"),
  sections: document.querySelectorAll(".admin-section"),
  gate: document.getElementById("adminGate"),
  productForm: document.getElementById("productForm"),
  productList: document.getElementById("productList"),
  productReset: document.getElementById("productReset"),
  productDelete: document.getElementById("productDelete"),
  ordersContainer: document.getElementById("adminOrders"),
  refreshOrders: document.getElementById("refreshOrders")
};

const API_ROUTES = {
  adminUpdateOrder: "/admin/updateOrder"
};

const ORDER_STATUS = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];
const PAYMENT_STATUS = ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"];

const state = {
  user: null,
  isAdmin: false,
  products: [],
  orders: [],
  activeProductId: null
};

const formatINR = value => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function formatDateTime(value) {
  if (!value) return "";
  const date = value.toDate ? value.toDate() : new Date(value);
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function toggleAccess(enabled) {
  document.body.classList.toggle("admin-locked", !enabled);
  els.signOutBtn.hidden = !enabled;
  els.authBtn.hidden = enabled;
  els.gate.textContent = enabled
    ? "You are managing live data. All changes are instant."
    : "Admin access required. Sign in with an authorized account.";
  if (!enabled) {
    setAuthMessage("", "info");
  }
}

function setStatus(text) {
  els.status.textContent = text;
}

function setAuthMessage(message = "", variant = "info") {
  if (!els.authMessage) return;
  els.authMessage.textContent = message;
  els.authMessage.dataset.variant = variant;
}

function showSection(name) {
  els.navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === name);
  });
  els.sections.forEach(section => {
    section.classList.toggle("active", section.id === `${name}Section`);
  });
}

async function loadProducts() {
  els.productList.innerHTML = "<p class='muted'>Loading products…</p>";
  try {
    const snapshot = await getDocs(query(collection(db, "products"), orderBy("title")));
    state.products = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderProductList();
  } catch (err) {
    console.error(err);
    els.productList.innerHTML = "<p class='error'>Unable to load products.</p>";
  }
}

function renderProductList() {
  if (!state.products.length) {
    els.productList.innerHTML = "<p class='muted'>No products yet.</p>";
    return;
  }
  els.productList.innerHTML = state.products
    .map(
      product => `
      <article class="admin-card" data-id="${product.id}">
        <div>
          <h4>${product.title}</h4>
          <p>${product.category || "Uncategorised"} • ${formatINR(product.price)}</p>
        </div>
        <div class="actions">
          <button class="ghost" data-action="edit">Edit</button>
          <button class="ghost danger" data-action="delete">Delete</button>
        </div>
      </article>`
    )
    .join("");
}

function setProductForm(product) {
  state.activeProductId = product ? product.id : null;
  els.productDelete.hidden = !product;
  const fields = {
    productTitle: product?.title || "",
    productBrand: product?.brand || "",
    productCategory: product?.category || "",
    productPrice: product?.price || "",
    productRating: product?.rating || "",
    productImage: product?.imageUrl || "",
    productDescription: product?.description || "",
    productStock: product?.stock || "",
    productDeal: product?.dealExpires ? new Date(product.dealExpires).toISOString().slice(0, 10) : ""
  };
  Object.entries(fields).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });
}

function resetProductForm() {
  els.productForm.reset();
  setProductForm(null);
}

function buildProductPayload() {
  const payload = {
    title: document.getElementById("productTitle").value.trim(),
    brand: document.getElementById("productBrand").value.trim(),
    category: document.getElementById("productCategory").value.trim(),
    price: Number(document.getElementById("productPrice").value),
    rating: Number(document.getElementById("productRating").value) || 0,
    imageUrl: document.getElementById("productImage").value.trim(),
    description: document.getElementById("productDescription").value.trim(),
    stock: Number(document.getElementById("productStock").value) || 0,
    dealExpires: document.getElementById("productDeal").value
      ? new Date(document.getElementById("productDeal").value).getTime()
      : null
  };
  if (!payload.title || !payload.category || Number.isNaN(payload.price)) {
    throw new Error("Title, category, and price are required.");
  }
  payload.price = Number(payload.price);
  payload.keywords = Array.from(
    new Set(
      `${payload.title} ${payload.brand}`.toLowerCase().split(/\s+/).filter(Boolean)
    )
  );
  return payload;
}

async function saveProduct(evt) {
  evt.preventDefault();
  try {
    const payload = buildProductPayload();
    if (state.activeProductId) {
      await setDoc(
        doc(db, "products", state.activeProductId),
        { ...payload, updatedAt: serverTimestamp() },
        { merge: true }
      );
      alert("Product updated.");
    } else {
      await addDoc(collection(db, "products"), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert("Product created.");
    }
    resetProductForm();
    loadProducts();
  } catch (err) {
    alert(err.message || "Unable to save product.");
  }
}

async function deleteProduct() {
  if (!state.activeProductId) return;
  if (!confirm("Delete this product?")) return;
  try {
    await deleteDoc(doc(db, "products", state.activeProductId));
    alert("Product removed.");
    resetProductForm();
    loadProducts();
  } catch (err) {
    alert(err.message || "Unable to delete product.");
  }
}

function renderOrders() {
  if (!state.orders.length) {
    els.ordersContainer.innerHTML = "<p class='muted'>No orders yet.</p>";
    return;
  }
  els.ordersContainer.innerHTML = state.orders
    .map(order => {
      const status = order.status || "PENDING";
      const paymentStatus = order.paymentStatus || "PENDING";
      const shipping = [
        order.shipping?.addressLine1,
        order.shipping?.addressLine2,
        order.shipping?.city,
        order.shipping?.state,
        order.shipping?.postalCode
      ]
        .filter(Boolean)
        .join(", ");
      return `
      <article class="order" data-id="${order.id}">
        <header>
          <div>
            <h4>#${order.id.slice(-6).toUpperCase()}</h4>
            <p>${order.customer?.displayName || "Customer"} • ${formatDateTime(order.createdAt)}</p>
          </div>
          <div class="status-group">
            <span class="pill" data-status="${status}">${status}</span>
            <span class="pill" data-status="payment-${paymentStatus}">Payment ${paymentStatus}</span>
          </div>
        </header>
        <div class="order-body">
          <p><strong>Amount:</strong> ${formatINR(order.amount)}</p>
          <p><strong>UTR:</strong> ${order.payment?.utr || "Pending"}</p>
          <p><strong>Shipping:</strong> ${shipping || "—"}</p>
        </div>
        <div class="order-controls">
          <label>
            Order status
            <select id="status-${order.id}">
              ${ORDER_STATUS.map(
                value => `<option value="${value}" ${value === status ? "selected" : ""}>${value}</option>`
              ).join("")}
            </select>
          </label>
          <label>
            Payment status
            <select id="payment-${order.id}">
              ${PAYMENT_STATUS.map(
                value => `<option value="${value}" ${value === paymentStatus ? "selected" : ""}>${value}</option>`
              ).join("")}
            </select>
          </label>
          <textarea id="remark-${order.id}" rows="3" placeholder="Admin notes">${order.payment?.adminRemark || ""}</textarea>
          <button class="cta" data-action="update-order" data-order="${order.id}">Apply</button>
        </div>
      </article>`;
    })
    .join("");
}

async function loadOrders() {
  els.ordersContainer.innerHTML = "<p class='muted'>Loading orders…</p>";
  try {
    const snapshot = await getDocs(
      query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(50))
    );
    state.orders = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderOrders();
  } catch (err) {
    console.error(err);
    els.ordersContainer.innerHTML = "<p class='error'>Unable to load orders.</p>";
  }
}

async function handleEmailLogin(evt) {
  evt.preventDefault();
  if (!els.emailInput || !els.passwordInput) return;
  const email = els.emailInput.value.trim();
  const password = els.passwordInput.value;
  if (!email || !password) {
    setAuthMessage("Enter email and password.", "error");
    return;
  }
  setAuthMessage("Signing in…");
  try {
    await signInWithEmailAndPassword(auth, email, password);
    els.passwordInput.value = "";
    setAuthMessage("Signed in.", "success");
  } catch (err) {
    let message = err.message || "Unable to sign in.";
    if (err.code === "auth/user-not-found") {
      message = "Account not found. Ask the owner to invite you.";
    }
    if (err.code === "auth/wrong-password") {
      message = "Incorrect password.";
    }
    setAuthMessage(message, "error");
  }
}

async function updateOrder(orderId) {
  const order = state.orders.find(item => item.id === orderId);
  if (!order) return;
  const statusSelect = document.getElementById(`status-${orderId}`);
  const paymentSelect = document.getElementById(`payment-${orderId}`);
  const remarkInput = document.getElementById(`remark-${orderId}`);
  const updates = {};
  if (statusSelect && statusSelect.value !== (order.status || "PENDING")) {
    updates.status = statusSelect.value;
  }
  if (paymentSelect && paymentSelect.value !== (order.paymentStatus || "PENDING")) {
    updates.paymentStatus = paymentSelect.value;
  }
  if (remarkInput && remarkInput.value.trim() !== (order.payment?.adminRemark || "")) {
    updates.adminRemark = remarkInput.value.trim();
  }
  if (!Object.keys(updates).length) {
    alert("No changes to apply.");
    return;
  }
  try {
    const token = await state.user.getIdToken();
    const response = await fetch(API_ROUTES.adminUpdateOrder, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ orderId, ...updates })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Update failed");
    alert("Order updated.");
    loadOrders();
  } catch (err) {
    console.error(err);
    alert(err.message || "Unable to update order.");
  }
}

els.navButtons.forEach(btn =>
  btn.addEventListener("click", () => {
    showSection(btn.dataset.section);
  })
);

if (els.emailForm) {
  els.emailForm.addEventListener("submit", handleEmailLogin);
}

els.productForm.addEventListener("submit", saveProduct);
els.productReset.addEventListener("click", resetProductForm);
els.productDelete.addEventListener("click", deleteProduct);

els.productList.addEventListener("click", evt => {
  const card = evt.target.closest(".admin-card");
  if (!card) return;
  const product = state.products.find(item => item.id === card.dataset.id);
  if (!product) return;
  if (evt.target.dataset.action === "edit") {
    setProductForm(product);
    showSection("products");
  }
  if (evt.target.dataset.action === "delete") {
    state.activeProductId = product.id;
    deleteProduct();
  }
});

els.ordersContainer.addEventListener("click", evt => {
  const btn = evt.target.closest("[data-action='update-order']");
  if (!btn) return;
  updateOrder(btn.dataset.order);
});

els.refreshOrders.addEventListener("click", loadOrders);

els.authBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert(err.message);
  }
});

els.signOutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async user => {
  state.user = user;
  if (!user) {
    setStatus("Sign in to manage the store");
    toggleAccess(false);
    state.products = [];
    state.orders = [];
    renderProductList();
    renderOrders();
    resetProductForm();
    return;
  }
  try {
    const token = await user.getIdTokenResult();
    state.isAdmin = Boolean(token.claims.admin);
  } catch (err) {
    state.isAdmin = false;
  }
  if (!state.isAdmin) {
    setStatus("This account is not an admin.");
    toggleAccess(false);
    alert("You do not have admin permissions on this project.");
    return;
  }
  toggleAccess(true);
  setStatus(`Hi, ${user.displayName || user.email}`);
  loadProducts();
  loadOrders();
});
