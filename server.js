const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  // Allow all localhost and 127.0.0.1 ports (5173, 5174, 5000, 3000, etc.)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  // Allow local LAN IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) return true;
  // Allow elitepassbd.com and all subdomains
  if (/^https?:\/\/([a-z0-9-]+\.)*elitepassbd\.com(:\d+)?$/.test(origin)) return true;
  return true; // Graceful fallback for web clients
};

app.use(cors({
  origin: function (origin, callback) {
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!res.getHeader('Access-Control-Allow-Origin')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use((req, res, next) => {
  if (req.url.startsWith('/api/api')) {
    req.url = req.url.replace('/api/api', '/api');
  }
  next();
});



const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const licenseRoutes = require('./routes/licenseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const slideRoutes = require('./routes/slideRoutes');
const pixelRoutes = require('./routes/pixelRoutes');
const couponRoutes = require('./routes/couponRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const backupRoutes = require('./routes/backupRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/slides', slideRoutes);
app.use('/api/pixel', pixelRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/backup', backupRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'E-commerce API is running.' });
});

const path = require('path');

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});



app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error.' });
});

const { initReviewEmailCron } = require('./services/reviewEmailService');
const { initSubscriptionCron } = require('./services/subscriptionCronService');
const { initDatabaseBackupCron } = require('./services/databaseBackupService');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  initReviewEmailCron();
  initSubscriptionCron();
  initDatabaseBackupCron();
});
