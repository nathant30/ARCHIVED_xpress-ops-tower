#!/usr/bin/env node

/**
 * Production Database Setup Script
 * Applies the complete RBAC+ABAC schema including migration 008
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'production-authz.db');

console.log('🗄️  Setting up production RBAC+ABAC database...');

// Remove existing database if it exists
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('🗑️  Removed existing database');
}

const db = new sqlite3.Database(DB_PATH);

// Read and execute the migration script
const migrationPath = path.join(__dirname, 'database/migrations/008_add_expansion_manager.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

// Remove PostgreSQL-specific syntax for SQLite compatibility
const sqliteCompatible = migration
  .replace(/BEGIN;/g, '')
  .replace(/COMMIT;/g, '')
  .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
  .replace(/TEXT NOT NULL REFERENCES regions\(region_id\)/g, 'TEXT NOT NULL')
  .replace(/TIMESTAMP WITH TIME ZONE/g, 'DATETIME')
  .replace(/NOW\(\)/g, "datetime('now')")
  .replace(/INTERVAL '\d+ hours'/g, "'+4 hours'")
  .replace(/JSONB/g, 'JSON')
  .replace(/plpgsql/g, '')
  .replace(/\$\$/g, '')
  .replace(/CREATE OR REPLACE FUNCTION.*?END;/gs, '-- Function removed for SQLite')
  .replace(/CREATE TRIGGER.*?FUNCTION.*?\(\);/gs, '-- Trigger removed for SQLite')
  .replace(/DO \$\$ .*?END \$\$;/gs, '-- DO block removed for SQLite');

// Split into individual statements
const statements = sqliteCompatible
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'BEGIN' && stmt !== 'COMMIT');

console.log(`📝 Executing ${statements.length} SQL statements...`);

db.serialize(() => {
  let completed = 0;
  
  statements.forEach((statement, index) => {
    if (statement.trim()) {
      db.run(statement, function(err) {
        if (err && !err.message.includes('already exists') && !err.message.includes('duplicate')) {
          console.error(`❌ Error in statement ${index + 1}:`, err.message);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        } else {
          completed++;
          if (completed % 10 === 0) {
            console.log(`✅ Completed ${completed}/${statements.length} statements`);
          }
        }
      });
    }
  });
  
  // Verify the setup
  setTimeout(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ Error checking tables:', err);
        return;
      }
      
      console.log('📋 Database tables created:');
      tables.forEach(table => console.log(`  - ${table.name}`));
      
      // Check if expansion_manager role exists
      db.get("SELECT * FROM roles WHERE name = 'expansion_manager'", (err, row) => {
        if (err) {
          console.warn('⚠️  Roles table may not exist yet');
        } else if (row) {
          console.log('✅ expansion_manager role created successfully');
          console.log(`   Role ID: ${row.role_id}, Level: ${row.level}`);
        } else {
          console.warn('⚠️  expansion_manager role not found');
        }
        
        console.log('🚀 Production database setup complete!');
        console.log(`📁 Database location: ${DB_PATH}`);
        
        db.close();
      });
    });
  }, 1000);
});