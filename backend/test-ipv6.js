const dns = require('dns');
const { Pool } = require('pg');
require('dotenv').config();

console.log('=== IPv6 Connectivity Test ===');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

// Parse connection string
const url = new URL(process.env.DATABASE_URL);
const hostname = url.hostname;

console.log('Testing connectivity to:', hostname);

// Test 1: Check if IPv6 is available
async function testIPv6Support() {
  console.log('\n--- Test 1: IPv6 DNS Resolution ---');
  
  try {
    const addresses = await new Promise((resolve, reject) => {
      dns.lookup(hostname, { family: 6, all: true }, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    
    console.log('✅ IPv6 addresses found:');
    addresses.forEach(addr => {
      console.log(`  - ${addr.address} (family: ${addr.family})`);
    });
    
    return addresses.length > 0;
  } catch (error) {
    console.log('❌ IPv6 resolution failed:', error.message);
    return false;
  }
}

// Test 2: Check IPv4 fallback
async function testIPv4Support() {
  console.log('\n--- Test 2: IPv4 DNS Resolution ---');
  
  try {
    const addresses = await new Promise((resolve, reject) => {
      dns.lookup(hostname, { family: 4, all: true }, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    
    console.log('✅ IPv4 addresses found:');
    addresses.forEach(addr => {
      console.log(`  - ${addr.address} (family: ${addr.family})`);
    });
    
    return addresses.length > 0;
  } catch (error) {
    console.log('❌ IPv4 resolution failed:', error.message);
    return false;
  }
}

// Test 3: Try database connection with IPv6
async function testDatabaseConnection() {
  console.log('\n--- Test 3: Database Connection with IPv6 ---');
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      family: 6, // Force IPv6
      connectionTimeoutMillis: 30000
    });

    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful with IPv6!');
    console.log('Current time:', result.rows[0].current_time);
    await pool.end();
    return true;
  } catch (error) {
    console.log('❌ IPv6 database connection failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const ipv6Available = await testIPv6Support();
  const ipv4Available = await testIPv4Support();
  
  if (ipv6Available) {
    console.log('\n🎯 IPv6 is available, testing database connection...');
    const dbSuccess = await testDatabaseConnection();
    
    if (dbSuccess) {
      console.log('\n✅ SUCCESS: IPv6 database connection works!');
    } else {
      console.log('\n⚠️  IPv6 available but database connection failed');
      console.log('This might be a network routing issue on Render');
    }
  } else if (ipv4Available) {
    console.log('\n⚠️  Only IPv4 available, IPv6 not supported');
  } else {
    console.log('\n❌ No network connectivity available');
  }
}

runTests(); 