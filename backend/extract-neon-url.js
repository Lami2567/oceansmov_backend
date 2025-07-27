// Helper script to extract proper connection string from Neon psql command
const psqlCommand = "psql 'postgresql://neondb_owner:npg_bVja4omx1QID@ep-polished-unit-a2w6q3p3-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'";

// Extract the actual connection string
const connectionString = psqlCommand.match(/postgresql:\/\/[^']+/)[0];

console.log('🔧 Extracted connection string:');
console.log(connectionString);

console.log('\n📋 Use this in your Render DATABASE_URL environment variable:');
console.log(connectionString);

// Test parsing
const url = new URL(connectionString);
console.log('\n📍 Parsed components:');
console.log('Hostname:', url.hostname);
console.log('Port:', url.port || 5432);
console.log('Database:', url.pathname.slice(1));
console.log('Username:', url.username);
console.log('SSL Mode:', url.searchParams.get('sslmode'));
console.log('Channel Binding:', url.searchParams.get('channel_binding')); 