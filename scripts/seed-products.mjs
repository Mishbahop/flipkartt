import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = join(fileURLToPath(import.meta.url), "..");

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "..", "service-account.json"), "utf8")
);

initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "mishbah-e8e33"
});

const db = getFirestore();

const products = [
  // Electronics
  {
    title: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    category: "Electronics",
    price: 99999,
    rating: 4.8,
    description: "Latest flagship smartphone with advanced camera and display",
    imageUrl: "https://images.unsplash.com/photo-1511707267537-b85faf00021e?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "iPhone 15 Pro",
    brand: "Apple",
    category: "Electronics",
    price: 129999,
    rating: 4.9,
    description: "Premium smartphone with A17 chip and titanium design",
    imageUrl: "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "Sony WH-1000XM5 Headphones",
    brand: "Sony",
    category: "Electronics",
    price: 29999,
    rating: 4.7,
    description: "Premium noise-cancelling wireless headphones",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "MacBook Pro 16-inch",
    brand: "Apple",
    category: "Electronics",
    price: 249999,
    rating: 4.8,
    description: "Powerful laptop with M3 Max chip for professionals",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "iPad Air 11-inch",
    brand: "Apple",
    category: "Electronics",
    price: 79999,
    rating: 4.6,
    description: "Versatile tablet with M1 chip and stunning display",
    imageUrl: "https://images.unsplash.com/photo-1511707267537-b85faf00021e?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  
  // Fashion
  {
    title: "Premium Cotton T-Shirt",
    brand: "Calvin Klein",
    category: "Fashion",
    price: 1999,
    rating: 4.5,
    description: "Comfortable 100% cotton t-shirt for everyday wear",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "Denim Jeans",
    brand: "Levi's",
    category: "Fashion",
    price: 3999,
    rating: 4.7,
    description: "Classic blue denim jeans with perfect fit",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c62d465d1?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "Sports Running Shoes",
    brand: "Nike",
    category: "Fashion",
    price: 8999,
    rating: 4.6,
    description: "High-performance running shoes with cushioning",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "Leather Jacket",
    brand: "Zara",
    category: "Fashion",
    price: 12999,
    rating: 4.8,
    description: "Stylish leather jacket perfect for any occasion",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16ebc5?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },

  // Home & Kitchen
  {
    title: "Stainless Steel Kitchen Knife Set",
    brand: "Prestige",
    category: "Home",
    price: 2499,
    rating: 4.6,
    description: "Professional grade 6-piece knife set",
    imageUrl: "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "Non-Stick Cookware Set",
    brand: "Calphalon",
    category: "Home",
    price: 4999,
    rating: 4.5,
    description: "10-piece non-stick cookware set for all cooking needs",
    imageUrl: "https://images.unsplash.com/photo-1578500494198-246f612d03b3?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "Bed Sheet Set",
    brand: "Raymond",
    category: "Home",
    price: 1299,
    rating: 4.7,
    description: "Premium cotton bed sheets with deep pockets",
    imageUrl: "https://images.unsplash.com/photo-1578500494198-246f612d03b3?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "Coffee Maker",
    brand: "Philips",
    category: "Home",
    price: 3999,
    rating: 4.6,
    description: "Automatic coffee maker with programmable timer",
    imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },

  // Books
  {
    title: "Atomic Habits",
    brand: "James Clear",
    category: "Books",
    price: 399,
    rating: 4.9,
    description: "Build good habits and break bad ones",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583f20270319?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "The Psychology of Money",
    brand: "Morgan Housel",
    category: "Books",
    price: 449,
    rating: 4.8,
    description: "Timeless lessons on wealth and happiness",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583f20270319?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  },
  {
    title: "Deep Work",
    brand: "Cal Newport",
    category: "Books",
    price: 499,
    rating: 4.7,
    description: "Rules for focused success in a distracted world",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583f20270319?auto=format&fit=crop&w=500&q=60",
    dealExpires: new Date(Date.now() + 86400000).toISOString()
  }
];

async function seedDatabase() {
  try {
    let count = 0;
    for (const product of products) {
      await db.collection("products").add({
        ...product,
        createdAt: new Date().toISOString()
      });
      count++;
      console.log(`✓ Added: ${product.title}`);
    }
    console.log(`\n✅ Successfully seeded ${count} products!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
