import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault(), projectId: "mishbah-e8e33" });
const db = getFirestore();

const products = [
  {
    title: "Samsung Galaxy S24",
    brand: "Samsung",
    category: "Mobiles",
    price: 79999,
    rating: 4.6,
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/.../s24.png",
    keywords: ["mobile", "android", "samsung"],
    dealExpires: Date.now() + 86400000
  },
  // add more…
];

for (const product of products) {
  await db.collection("products").add(product);
}
console.log("Seed complete");
