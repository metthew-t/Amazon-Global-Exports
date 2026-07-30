import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
const needsSsl = process.env.NODE_ENV === 'production' || 
  dbUrl.includes('render.com') || 
  dbUrl.includes('azure') || 
  dbUrl.includes('sslmode=require') ||
  dbUrl.includes('neon.tech') ||
  dbUrl.includes('.com');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

// Helper to convert SQLite '?' to PostgreSQL '$1, $2, ...'
const convertSql = (sql) => {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
};

const flattenArgs = (args) => {
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  return args;
};

const db = {
  get: async (sql, ...params) => {
    const res = await pool.query(convertSql(sql), flattenArgs(params));
    return res.rows[0];
  },
  all: async (sql, ...params) => {
    const res = await pool.query(convertSql(sql), flattenArgs(params));
    return res.rows;
  },
  run: async (sql, ...params) => {
    const res = await pool.query(convertSql(sql), flattenArgs(params));
    return res;
  },
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const txDb = {
        get: async (sql, ...params) => (await client.query(convertSql(sql), flattenArgs(params))).rows[0],
        all: async (sql, ...params) => (await client.query(convertSql(sql), flattenArgs(params))).rows,
        run: async (sql, ...params) => await client.query(convertSql(sql), flattenArgs(params)),
      };
      
      txDb.prepare = (sql) => {
        return {
          get: async (...params) => await txDb.get(sql, ...params),
          all: async (...params) => await txDb.all(sql, ...params),
          run: async (...params) => await txDb.run(sql, ...params),
        };
      };
      
      const result = await callback(txDb);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
  prepare: (sql) => {
    return {
      get: async (...params) => await db.get(sql, ...params),
      all: async (...params) => await db.all(sql, ...params),
      run: async (...params) => await db.run(sql, ...params),
    };
  }
};

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

console.log('Connected to PostgreSQL Database via pool');

export default db;
