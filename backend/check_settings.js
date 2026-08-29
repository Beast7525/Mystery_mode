const dns = require('dns');
dns.setServers(['8.8.8.8']); // Force resolve via Google DNS

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// Define schema
const settingSchema = new mongoose.Schema({
  round: Number,
  timeLimit: Number
}, { timestamps: true });

const RoundSetting = mongoose.model('RoundSetting', settingSchema, 'roundsettings');

async function run() {
  try {
    console.log('Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.\n');

    const settings = await RoundSetting.find({}).lean();
    console.log('Settings found in DB:', settings.length);
    settings.forEach(s => {
      console.log(`- Round: ${s.round}, Time Limit: ${s.timeLimit} seconds, ID: ${s._id}`);
    });
  } catch (error) {
    console.error('Error connecting/querying database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

run();
