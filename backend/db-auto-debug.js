const { Pool } = require('pg');
const dns = require('dns');
require('dotenv').config();

console.log('🔍 Auto-Debug Database Connection System Starting...');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  process.exit(1);
}

// Parse connection string
const url = new URL(process.env.DATABASE_URL);
const hostname = url.hostname;
const port = url.port || 5432;
const database = url.pathname.slice(1);
const username = url.username;
const password = url.password;

console.log('📍 Target:', hostname, 'Port:', port, 'Database:', database);

// Intelligent connection strategies with automatic debugging
class AutoDebugDB {
  constructor() {
    this.diagnosticResults = [];
    this.successfulStrategy = null;
  }

  // Log diagnostic information
  logDiagnostic(step, result, error = null) {
    const diagnostic = {
      step,
      result,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    };
    this.diagnosticResults.push(diagnostic);
    console.log(`🔍 ${step}: ${result}${error ? ` (${error.message})` : ''}`);
  }

  // Test DNS resolution
  async testDNS() {
    this.logDiagnostic('DNS Test', 'Starting...');
    
    const tests = [
      { name: 'resolve4', method: () => new Promise((resolve, reject) => 
        dns.resolve4(hostname, (err, addresses) => err ? reject(err) : resolve(addresses))) },
      { name: 'resolve6', method: () => new Promise((resolve, reject) => 
        dns.resolve6(hostname, (err, addresses) => err ? reject(err) : resolve(addresses))) },
      { name: 'lookup4', method: () => new Promise((resolve, reject) => 
        dns.lookup(hostname, { family: 4 }, (err, address, family) => err ? reject(err) : resolve({ address, family }))) },
      { name: 'lookup6', method: () => new Promise((resolve, reject) => 
        dns.lookup(hostname, { family: 6 }, (err, address, family) => err ? reject(err) : resolve({ address, family }))) }
    ];

    const results = {};
    for (const test of tests) {
      try {
        results[test.name] = await test.method();
        this.logDiagnostic(`DNS ${test.name}`, `✅ Success: ${JSON.stringify(results[test.name])}`);
      } catch (error) {
        results[test.name] = null;
        this.logDiagnostic(`DNS ${test.name}`, `❌ Failed`, error);
      }
    }
    
    return results;
  }

  // Test network connectivity
  async testNetworkConnectivity(ipAddress) {
    this.logDiagnostic('Network Test', `Testing connectivity to ${ipAddress}...`);
    
    try {
      const net = require('net');
      const socket = new net.Socket();
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.destroy();
          reject(new Error('Connection timeout'));
        }, 5000);
        
        socket.connect(port, ipAddress, () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve();
        });
        
        socket.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      
      this.logDiagnostic('Network Test', `✅ Can reach ${ipAddress}:${port}`);
      return true;
    } catch (error) {
      this.logDiagnostic('Network Test', `❌ Cannot reach ${ipAddress}:${port}`, error);
      return false;
    }
  }

  // Generate connection strategies based on diagnostic results
  generateStrategies(dnsResults) {
    const strategies = [];
    
    // Strategy 1: Direct IP connection if we have IPv4
    if (dnsResults.resolve4 && dnsResults.resolve4.length > 0) {
      for (const ip of dnsResults.resolve4) {
        strategies.push({
          name: `Direct IPv4: ${ip}`,
          priority: 1,
          config: {
            host: ip,
            port: port,
            database: database,
            user: username,
            password: password,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 30000
          }
        });
      }
    }
    
    // Strategy 2: SSL mode variations
    const sslModes = ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'];
    for (const sslMode of sslModes) {
      strategies.push({
        name: `SSL Mode: ${sslMode}`,
        priority: 2,
        config: {
          connectionString: process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + `sslmode=${sslMode}`,
          ssl: sslMode === 'disable' ? false : { rejectUnauthorized: false },
          connectionTimeoutMillis: 30000
        }
      });
    }
    
    // Strategy 3: Connection string variations
    strategies.push({
      name: 'Original Connection String',
      priority: 3,
      config: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000
      }
    });
    
    // Strategy 4: Pooler connection (if it's Supabase)
    if (hostname.includes('supabase.co')) {
      const poolerUrl = process.env.DATABASE_URL.replace(':5432/', ':6543/');
      strategies.push({
        name: 'Supabase Pooler',
        priority: 4,
        config: {
          connectionString: poolerUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 30000
        }
      });
    }
    
    return strategies.sort((a, b) => a.priority - b.priority);
  }

  // Test a connection strategy
  async testStrategy(strategy) {
    this.logDiagnostic('Strategy Test', `Trying: ${strategy.name}`);
    
    try {
      const pool = new Pool(strategy.config);
      await pool.query('SELECT 1 as test');
      await pool.end();
      
      this.logDiagnostic('Strategy Test', `✅ SUCCESS: ${strategy.name}`);
      return { success: true, strategy };
    } catch (error) {
      this.logDiagnostic('Strategy Test', `❌ FAILED: ${strategy.name}`, error);
      return { success: false, strategy, error };
    }
  }

  // Main connection method
  async connect() {
    console.log('\n🚀 Starting Auto-Debug Database Connection...\n');
    
    // Step 1: DNS Diagnostics
    this.logDiagnostic('Phase 1', 'DNS Resolution Diagnostics');
    const dnsResults = await this.testDNS();
    
    // Step 2: Network Connectivity Test (if we have IPs)
    if (dnsResults.resolve4 && dnsResults.resolve4.length > 0) {
      this.logDiagnostic('Phase 2', 'Network Connectivity Test');
      for (const ip of dnsResults.resolve4) {
        await this.testNetworkConnectivity(ip);
      }
    }
    
    // Step 3: Generate and test strategies
    this.logDiagnostic('Phase 3', 'Connection Strategy Testing');
    const strategies = this.generateStrategies(dnsResults);
    
    console.log(`\n🎯 Generated ${strategies.length} connection strategies:`);
    strategies.forEach((s, i) => console.log(`  ${i + 1}. ${s.name}`));
    
    // Step 4: Test each strategy
    for (const strategy of strategies) {
      const result = await this.testStrategy(strategy);
      if (result.success) {
        this.successfulStrategy = strategy;
        break;
      }
    }
    
    // Step 5: Create final connection
    if (this.successfulStrategy) {
      this.logDiagnostic('Final Connection', `Creating pool with: ${this.successfulStrategy.name}`);
      const pool = new Pool(this.successfulStrategy.config);
      
      // Test the final connection
      await pool.query('SELECT NOW() as connected_at');
      this.logDiagnostic('Final Connection', '✅ Database connection established successfully!');
      
      return pool;
    } else {
      // Generate comprehensive error report
      this.generateErrorReport();
      throw new Error('All connection strategies failed. Check the diagnostic report above.');
    }
  }

  // Generate comprehensive error report
  generateErrorReport() {
    console.log('\n📋 DIAGNOSTIC REPORT:');
    console.log('='.repeat(50));
    
    this.diagnosticResults.forEach(d => {
      const status = d.error ? '❌' : '✅';
      console.log(`${status} ${d.step}: ${d.result}`);
      if (d.error) console.log(`   Error: ${d.error}`);
    });
    
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('='.repeat(50));
    
    const hasDNSIssues = this.diagnosticResults.some(d => d.step.includes('DNS') && d.error);
    const hasNetworkIssues = this.diagnosticResults.some(d => d.step.includes('Network') && d.error);
    
    if (hasDNSIssues) {
      console.log('• DNS resolution issues detected');
      console.log('• Check if the hostname is correct');
      console.log('• Verify network connectivity');
    }
    
    if (hasNetworkIssues) {
      console.log('• Network connectivity issues detected');
      console.log('• Check firewall settings');
      console.log('• Verify the port is accessible');
    }
    
    console.log('• Try using a different connection string format');
    console.log('• Check if SSL/TLS settings are correct');
    console.log('• Verify database credentials');
  }
}

// Create and use the auto-debug system
const autoDebug = new AutoDebugDB();
let pool;

// Initialize connection
autoDebug.connect()
  .then(createdPool => {
    pool = createdPool;
    console.log('\n🎉 Auto-Debug Database Connection SUCCESSFUL!');
  })
  .catch(error => {
    console.error('\n💥 Auto-Debug Database Connection FAILED!');
    console.error(error.message);
    process.exit(1);
  });

// Export functions
module.exports = {
  getPool: () => pool,
  query: async (text, params) => {
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    return pool.query(text, params);
  },
  getClient: async () => {
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    return pool.connect();
  },
  getDiagnostics: () => autoDebug.diagnosticResults,
  getSuccessfulStrategy: () => autoDebug.successfulStrategy
}; 