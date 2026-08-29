const dns = require('dns');
dns.setServers(['8.8.8.8']); // Force resolve via Google DNS

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  try {
    console.log('Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    for (let col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count} documents`);
      if (count > 0) {
        const docs = await db.collection(col.name).find().limit(3).toArray();
        console.log(`  Sample:`, docs.map(d => ({ ...d, password: d.password ? '[HIDDEN]' : undefined })));
      }
    }

  } catch (error) {
    console.error('Error connecting/querying database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

run();
