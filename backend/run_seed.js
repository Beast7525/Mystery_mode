const dns = require('dns');
dns.setServers(['8.8.8.8']); // Force resolve via Google DNS

console.log('Starting seed execution...');
require('./seed.js');
