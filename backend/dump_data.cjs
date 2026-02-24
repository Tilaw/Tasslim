const db = require('better-sqlite3')('inventory.db');
const fs = require('fs');

const products = db.prepare("SELECT * FROM products").all();
const mechanics = db.prepare("SELECT * FROM mechanics").all();
const suppliers = db.prepare("SELECT * FROM suppliers").all();

let output = '=== Products ===\n';
products.forEach(p => output += `${p.id} - ${p.name} - ${p.sku}\n`);

output += '\n=== Mechanics ===\n';
mechanics.forEach(m => output += `${m.id} - ${m.name}\n`);

output += '\n=== Suppliers ===\n';
suppliers.forEach(s => output += `${s.id} - ${s.name}\n`);

fs.writeFileSync('db_out.txt', output);
console.log('Done writing db_out.txt');
