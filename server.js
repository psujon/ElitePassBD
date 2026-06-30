const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middlewares
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://elitepassbd.com",
  "https://www.elitepassbd.com",
];

// 2. CORS and Preflight Setup
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS Policy Blocked'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
}));

app.options('*', cors());

// ==========================================
// 3. PARSERS MUST GO HERE (BEFORE YOUR ROUTES)
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Custom Middleware / Fallback Headers (Safe position)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Normalize double /api/api prefixes in case of old cache or config mismatch
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api')) {
    req.url = req.url.replace('/api/api', '/api');
  }
  next();
});



// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const licenseRoutes = require('./routes/licenseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const slideRoutes = require('./routes/slideRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/slides', slideRoutes);

// Database Backup API Route (Admins Only)
const { authenticateToken, authorizeAdmin } = require('./middleware/auth');
const db = require('./config/db');

app.get('/api/admin/backup', authenticateToken, authorizeAdmin, async (req, res, next) => {
  try {
    const pool = db.getPool();
    const [tables] = await pool.query('SHOW TABLES');
    const dbName = process.env.DB_NAME;
    const keyName = `Tables_in_${dbName}`;

    let sqlDump = `-- ElitePassBD Database Backup\n`;
    sqlDump += `-- Date: ${new Date().toISOString()}\n\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

    for (const tableRow of tables) {
      const tableName = tableRow[keyName] || Object.values(tableRow)[0];

      // Get Create Table statement
      const [createTableResult] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createTableSql = createTableResult[0]['Create Table'];

      sqlDump += `-- Table structure for table \`${tableName}\`\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlDump += `${createTableSql};\n\n`;

      // Get Rows
      const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        sqlDump += `-- Dumping data for table \`${tableName}\`\n`;
        for (const row of rows) {
          const columns = Object.keys(row).map(c => `\`${c}\``).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) {
              const formattedDate = val.toISOString().slice(0, 19).replace('T', ' ');
              return `'${formattedDate}'`;
            }
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

            // Escape backslashes first, then escape single quotes
            const escaped = val.toString().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            return `'${escaped}'`;
          }).join(', ');

          sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
        }
        sqlDump += `\n`;
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${dbName}-${new Date().toISOString().slice(0, 10)}.sql`);
    res.send(sqlDump);
  } catch (error) {
    next(error);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'E-commerce API is running.' });
});

const path = require('path');

// Serve static React build files
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all non-API GET requests to React client SPA router
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error.' });
});

// Start Server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
