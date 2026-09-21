const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const {
  generateSqlDump,
  getBackupSettings,
  updateBackupSettings,
  sendBackupEmail
} = require('../services/databaseBackupService');

router.use(authenticateToken);
router.use(authorizeAdmin);

// GET /api/admin/backup -> Direct download SQL dump
router.get('/', async (req, res, next) => {
  try {
    const { sqlDump, dbName } = await generateSqlDump();
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${dbName}-${dateStr}.sql`);
    res.send(sqlDump);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/backup/settings -> Retrieve current auto-backup configuration
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await getBackupSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/backup/settings -> Update auto-backup settings
router.put('/settings', async (req, res, next) => {
  try {
    const { enabled, email } = req.body;
    const updated = await updateBackupSettings({ enabled, email });
    res.json({
      message: 'Automated database backup settings saved successfully!',
      settings: updated
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/backup/send-email -> Immediate test backup dispatch
router.post('/send-email', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    const result = await sendBackupEmail({ targetEmail: email, isManualTest: true });
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({
        message: result.error || 'Failed to dispatch backup email.',
        error: result.error,
        stats: result.stats
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
