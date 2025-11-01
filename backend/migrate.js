#!/usr/bin/env node

/**
 * SQL Migration Runner
 * Applies SQL migrations to the PostgreSQL database
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'sql');

async function runMigration(client, filePath) {
    const fileName = path.basename(filePath);
    console.log(`\n🔄 Applying: ${fileName}`);
    
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`✓ Successfully applied: ${fileName}`);
        return true;
    } catch (error) {
        console.error(`✗ Failed to apply ${fileName}:`, error.message);
        return false;
    }
}

async function migrate(specificFile = null) {
    if (!process.env.DATABASE_URL) {
        console.error('✗ DATABASE_URL not found in environment variables');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✓ Connected to database\n');

        if (specificFile) {
            // Run specific migration
            const filePath = path.join(MIGRATIONS_DIR, specificFile);
            if (!fs.existsSync(filePath)) {
                console.error(`✗ Migration file not found: ${specificFile}`);
                process.exit(1);
            }
            const success = await runMigration(client, filePath);
            if (!success) process.exit(1);
        } else {
            // Run all migrations in order
            const files = fs.readdirSync(MIGRATIONS_DIR)
                .filter(f => f.endsWith('.sql'))
                .sort();

            if (files.length === 0) {
                console.log('ℹ No migration files found in sql/');
                process.exit(0);
            }

            console.log(`Found ${files.length} migration(s):\n`);
            files.forEach(f => console.log(`  - ${f}`));

            let allSuccess = true;
            for (const file of files) {
                const filePath = path.join(MIGRATIONS_DIR, file);
                const success = await runMigration(client, filePath);
                if (!success) {
                    allSuccess = false;
                    break;
                }
            }

            if (!allSuccess) {
                console.error('\n✗ Migration process failed');
                process.exit(1);
            }
        }

        console.log('\n✅ All migrations completed successfully!');
        console.log('📊 Radio stations table is ready!\n');
        
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const specificFile = args[0] || null;

migrate(specificFile);
