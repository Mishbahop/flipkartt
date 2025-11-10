const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// The email of the user you want to make an admin
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Please provide an email address as an argument');
  process.exit(1);
}

async function setUserAsAdmin(email) {
  try {
    // Get the user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claims (admin: true)
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log(`Successfully set admin privileges for user ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin privileges:', error);
    process.exit(1);
  }
}

setUserAsAdmin(userEmail);