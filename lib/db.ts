import { Pool, types } from 'pg';
import bcrypt from 'bcryptjs';

// Configure pg-types to parse NUMERIC (OID 1700) as float automatically in JavaScript
types.setTypeParser(types.builtins.NUMERIC, (val: string) => parseFloat(val));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('WARNING: DATABASE_URL is not set. Database operations will fail.');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: false },
});

let seeded = false;

async function seedIfEmpty() {
  if (seeded) return;
  try {
    const client = await pool.connect();
    try {
      // Check if users table has any entries
      const res = await client.query('SELECT COUNT(*) FROM users');
      const count = parseInt(res.rows[0].count, 10);
      
      if (count === 0) {
        console.log('Database users table is empty. Seeding default Admin and Seller accounts...');
        
        // Hashing passwords
        const adminHash = await bcrypt.hash('admin123', 10);
        const sellerHash = await bcrypt.hash('seller123', 10);
        
        // Insert admin
        await client.query(
          `INSERT INTO users (name, email, password, role) 
           VALUES ($1, $2, $3, $4)`,
          ['Admin User', 'admin@aasamedchem.com', adminHash, 'ADMIN']
        );
        
        // Insert seller
        await client.query(
          `INSERT INTO users (name, email, password, role) 
           VALUES ($1, $2, $3, $4)`,
          ['Seller User', 'seller@aasamedchem.com', sellerHash, 'SELLER']
        );
        
        // Let's seed some initial products as well for instant usage
        const productsCountRes = await client.query('SELECT COUNT(*) FROM products');
        const productsCount = parseInt(productsCountRes.rows[0].count, 10);
        
        if (productsCount === 0) {
          console.log('Database products table is empty. Seeding initial chemical inventory products...');
          const initialProducts = [
            {
              sku: "ETH-99-1L",
              name: "Ethanol 99% Pure",
              description: "High-grade ethanol solvent for research and industrial cleaning.",
              category: "Solvents",
              base_unit: "L",
              base_price: 180.0000,
              stock_quantity: 50.00000000
            },
            {
              sku: "SOD-CHL-1K",
              name: "Sodium Chloride (Lab Grade)",
              description: "High purity NaCl for buffer preparations and general chemical assays.",
              category: "Reagents",
              base_unit: "kg",
              base_price: 320.0000,
              stock_quantity: 12.50000000
            },
            {
              sku: "ASP-ACD-500G",
              name: "Acetylsalicylic Acid (Aspirin Powder)",
              description: "API grade powder for formulation testing and laboratory research.",
              category: "APIs",
              base_unit: "g",
              base_price: 2.5000, // 2.50 INR per gram = 2500 per kg
              stock_quantity: 2500.00000000
            },
            {
              sku: "METH-SOL-500M",
              name: "Methanol anhydrous",
              description: "Solvent for HPLC and analytical chromatography applications.",
              category: "Solvents",
              base_unit: "mL",
              base_price: 0.1500, // 0.15 INR per mL = 150 per Litre
              stock_quantity: 10000.00000000
            },
            {
              sku: "GLASS-BEAK-250",
              name: "Borosilicate Glass Beaker 250mL",
              description: "Heavy-duty lab glass beaker with dual graduation scale.",
              category: "Labware",
              base_unit: "item",
              base_price: 125.0000,
              stock_quantity: 45.00000000
            }
          ];
          
          for (const prod of initialProducts) {
            await client.query(
              `INSERT INTO products (sku, name, description, category, base_unit, base_price, stock_quantity)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [prod.sku, prod.name, prod.description, prod.category, prod.base_unit, prod.base_price, prod.stock_quantity]
            );
          }
        }
        
        console.log('Seeding successfully completed.');
      }
      seeded = true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

export async function query(text: string, params?: any[]) {
  // Ensure the database is seeded before running any query
  if (!seeded && connectionString) {
    await seedIfEmpty();
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient() {
  if (!seeded && connectionString) {
    await seedIfEmpty();
  }
  return await pool.connect();
}
