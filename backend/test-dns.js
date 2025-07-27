const dns = require('dns');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const url = new URL(process.env.DATABASE_URL);
const hostname = url.hostname;

console.log('Testing DNS resolution for:', hostname);

// Test different DNS resolution methods
async function testDNS() {
  console.log('\n=== DNS Resolution Tests ===');
  
  // Test 1: resolve4 (IPv4 only)
  try {
    console.log('\n1. Testing resolve4 (IPv4 only)...');
    const ipv4Addresses = await new Promise((resolve, reject) => {
      dns.resolve4(hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log('✅ resolve4 found:', ipv4Addresses);
  } catch (error) {
    console.log('❌ resolve4 failed:', error.message);
  }
  
  // Test 2: resolve6 (IPv6 only)
  try {
    console.log('\n2. Testing resolve6 (IPv6 only)...');
    const ipv6Addresses = await new Promise((resolve, reject) => {
      dns.resolve6(hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log('✅ resolve6 found:', ipv6Addresses);
  } catch (error) {
    console.log('❌ resolve6 failed:', error.message);
  }
  
  // Test 3: lookup with family 4
  try {
    console.log('\n3. Testing lookup with family 4...');
    const ipv4Lookup = await new Promise((resolve, reject) => {
      dns.lookup(hostname, { family: 4 }, (err, address, family) => {
        if (err) reject(err);
        else resolve({ address, family });
      });
    });
    console.log('✅ lookup family 4 found:', ipv4Lookup);
  } catch (error) {
    console.log('❌ lookup family 4 failed:', error.message);
  }
  
  // Test 4: lookup with family 6
  try {
    console.log('\n4. Testing lookup with family 6...');
    const ipv6Lookup = await new Promise((resolve, reject) => {
      dns.lookup(hostname, { family: 6 }, (err, address, family) => {
        if (err) reject(err);
        else resolve({ address, family });
      });
    });
    console.log('✅ lookup family 6 found:', ipv6Lookup);
  } catch (error) {
    console.log('❌ lookup family 6 failed:', error.message);
  }
  
  // Test 5: lookup with all addresses
  try {
    console.log('\n5. Testing lookup with all addresses...');
    const allAddresses = await new Promise((resolve, reject) => {
      dns.lookup(hostname, { all: true }, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log('✅ lookup all found:', allAddresses);
  } catch (error) {
    console.log('❌ lookup all failed:', error.message);
  }
}

testDNS(); 