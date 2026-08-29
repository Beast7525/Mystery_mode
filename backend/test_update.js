const dns = require('dns');
dns.setServers(['8.8.8.8']); // Force resolve via Google DNS

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { RoundSetting } = require('./models');
const MONGODB_URI = process.env.MONGODB_URI;

async function test() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const roundNum = 1;
    const timeLimit = 360;

    console.log(`Updating Round ${roundNum} to ${timeLimit}s...`);
    const updated = await RoundSetting.findOneAndUpdate(
      { round: roundNum },
      { timeLimit },
      { new: true, upsert: true }
    );
    console.log('Update success! Result:', updated);

  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

test();
