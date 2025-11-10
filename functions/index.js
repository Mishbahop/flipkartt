const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const ORDER_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
};

const PAYMENT_STATUS = {
  PENDING: "PENDING",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
};

function send(res, status, payload) {
  return res.status(status).json(payload);
}

async function verifyAuth(req) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) throw new Error("UNAUTHENTICATED");
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (err) {
    throw new Error("UNAUTHENTICATED");
  }
}

function sanitizeShipping(input = {}) {
  const shipping = {
    fullName: String(input.fullName || "").trim(),
    phone: String(input.phone || "").trim(),
    addressLine1: String(input.addressLine1 || "").trim(),
    addressLine2: String(input.addressLine2 || "").trim(),
    city: String(input.city || "").trim(),
    state: String(input.state || "").trim(),
    postalCode: String(input.postalCode || "").trim()
  };
  const required = ["fullName", "phone", "addressLine1", "city", "state", "postalCode"];
  for (const field of required) {
    if (!shipping[field]) return null;
  }
  return shipping;
}

async function buildLineItems(items = []) {
  if (!Array.isArray(items) || !items.length) return null;
  const productFetches = await Promise.all(
    items.map(async item => {
      const qty = Number(item.qty || 0);
      if (!item.productId || qty <= 0) return null;
      const snapshot = await db.collection("products").doc(item.productId).get();
      if (!snapshot.exists) return null;
      const data = snapshot.data();
      return {
        productId: snapshot.id,
        title: data.title,
        price: Number(data.price || 0),
        qty,
        imageUrl: data.imageUrl || null,
        category: data.category || null
      };
    })
  );
  const sanitized = productFetches.filter(Boolean);
  if (!sanitized.length) return null;
  return sanitized;
}

exports.placeOrder = functions
  .runWith({ enforceAppCheck: true, timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    let decoded;
    try {
      decoded = await verifyAuth(req);
    } catch (err) {
      return send(res, 401, { error: "Unauthenticated" });
    }

    try {
      const { items, shipping, payment } = req.body || {};
      const normalizedShipping = sanitizeShipping(shipping);
      const lineItems = await buildLineItems(items);

      if (!lineItems || !normalizedShipping) {
        return send(res, 400, { error: "Invalid checkout payload" });
      }

      const amount = lineItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      if (amount <= 0) return send(res, 400, { error: "Invalid amount" });

      const utr = String(payment?.utr || "").trim();
      const paymentNote = String(payment?.note || "").trim();
      const paymentStatus = utr ? PAYMENT_STATUS.SUBMITTED : PAYMENT_STATUS.PENDING;

      const now = admin.firestore.FieldValue.serverTimestamp();
      const order = {
        uid: decoded.uid,
        customer: {
          email: decoded.email || null,
          displayName: decoded.name || normalizedShipping.fullName
        },
        items: lineItems,
        amount,
        shipping: normalizedShipping,
        status: ORDER_STATUS.PENDING,
        paymentStatus,
        payment: {
          method: "MANUAL_UTR",
          utr: utr || null,
          note: paymentNote || null,
          submittedAt: utr ? now : null,
          reviewedAt: null,
          reviewedBy: null,
          adminRemark: null
        },
        createdAt: now,
        updatedAt: now,
        timeline: [
          {
            status: ORDER_STATUS.PENDING,
            message: "Order placed",
            at: now
          }
        ]
      };

      const ref = await db.collection("orders").add(order);
      return send(res, 201, { orderId: ref.id, paymentStatus });
    } catch (err) {
      console.error("placeOrder error", err);
      return send(res, 500, { error: "Server error" });
    }
  });

exports.submitManualPayment = functions
  .runWith({ enforceAppCheck: true, timeoutSeconds: 30 })
  .https.onRequest(async (req, res) => {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    let decoded;
    try {
      decoded = await verifyAuth(req);
    } catch (err) {
      return send(res, 401, { error: "Unauthenticated" });
    }

    const { orderId, utr, note } = req.body || {};
    if (!orderId || !utr) return send(res, 400, { error: "Missing orderId or UTR" });

    try {
      const orderRef = db.collection("orders").doc(orderId);
      const snapshot = await orderRef.get();
      if (!snapshot.exists) return send(res, 404, { error: "Order not found" });
      if (snapshot.data().uid !== decoded.uid) return send(res, 403, { error: "Forbidden" });

      const update = {
        paymentStatus: PAYMENT_STATUS.SUBMITTED,
        "payment.utr": String(utr).trim(),
        "payment.note": note ? String(note).trim() : null,
        "payment.submittedAt": admin.firestore.FieldValue.serverTimestamp(),
        "payment.reviewedAt": null,
        "payment.reviewedBy": null,
        "payment.adminRemark": null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await orderRef.update(update);
      return send(res, 200, { ok: true });
    } catch (err) {
      console.error("submitManualPayment error", err);
      return send(res, 500, { error: "Server error" });
    }
  });

exports.adminUpdateOrder = functions
  .runWith({ enforceAppCheck: true, timeoutSeconds: 30 })
  .https.onRequest(async (req, res) => {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    let decoded;
    try {
      decoded = await verifyAuth(req);
    } catch (err) {
      return send(res, 401, { error: "Unauthenticated" });
    }

    if (!decoded.admin) return send(res, 403, { error: "Admin only" });

    const { orderId, status, paymentStatus, adminRemark } = req.body || {};
    if (!orderId) return send(res, 400, { error: "orderId required" });

    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    const timelineEntry = [];

    if (status) {
      if (!Object.values(ORDER_STATUS).includes(status)) {
        return send(res, 400, { error: "Invalid status" });
      }
      updates.status = status;
      timelineEntry.push({
        status,
        at: admin.firestore.FieldValue.serverTimestamp(),
        message: `Status set to ${status}`
      });
    }

    if (paymentStatus) {
      if (!Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
        return send(res, 400, { error: "Invalid payment status" });
      }
      updates.paymentStatus = paymentStatus;
      updates["payment.reviewedBy"] = decoded.uid;
      updates["payment.reviewedAt"] = admin.firestore.FieldValue.serverTimestamp();
      if (adminRemark !== undefined) updates["payment.adminRemark"] = adminRemark || null;
      timelineEntry.push({
        status: `PAYMENT_${paymentStatus}`,
        at: admin.firestore.FieldValue.serverTimestamp(),
        message: `Payment marked ${paymentStatus}`
      });
    } else if (adminRemark !== undefined) {
      updates["payment.adminRemark"] = adminRemark || null;
    }

    if (!status && !paymentStatus && adminRemark === undefined) {
      return send(res, 400, { error: "No updates provided" });
    }

    try {
      const orderRef = db.collection("orders").doc(orderId);
      await orderRef.update({
        ...updates,
        ...(timelineEntry.length
          ? {
              timeline: admin.firestore.FieldValue.arrayUnion(...timelineEntry)
            }
          : {})
      });
      return send(res, 200, { ok: true });
    } catch (err) {
      console.error("adminUpdateOrder error", err);
      return send(res, 500, { error: "Server error" });
    }
  });
