const db = require('../config/db');
const { sendEmailDetailed } = require('../utils/mailer');
let cron;
try {
  cron = require('node-cron');
} catch (err) {
  console.warn('[DatabaseBackupService] node-cron module not available.');
}

const DEFAULT_CRON_EXPRESSION = '5 17 * * *'; // Daily at 17:05 (5:05 PM BST)
const TIMEZONE = 'Asia/Dhaka';

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getDhakaTimeString = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(date);
};

const getDhakaFileTimestamp = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  return `${map.year}${map.month}${map.day}_${map.hour}${map.minute}${map.second}`;
};

const ensureSettingsTable = async (pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

/**
 * Generate a full SQL Dump of all tables and data
 */
const generateSqlDump = async () => {
  const pool = db.getPool();
  if (!pool) {
    throw new Error('Database pool not initialized.');
  }

  const [tables] = await pool.query('SHOW TABLES');
  const dbName = process.env.DB_NAME || 'elitepass_db';
  const keyName = `Tables_in_${dbName}`;

  const dhakaTimestamp = getDhakaTimeString(new Date());

  let sqlDump = `-- ========================================================\n`;
  sqlDump += `-- ElitePassBD Automated Database Backup\n`;
  sqlDump += `-- Generated At (BST / Asia/Dhaka): ${dhakaTimestamp}\n`;
  sqlDump += `-- Database: ${dbName}\n`;
  sqlDump += `-- ========================================================\n\n`;
  sqlDump += `SET NAMES utf8mb4;\n`;
  sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n`;
  sqlDump += `SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";\n\n`;

  let totalRows = 0;
  let tableCount = 0;

  for (const tableRow of tables) {
    const tableName = tableRow[keyName] || Object.values(tableRow)[0];
    if (!tableName) continue;
    tableCount++;

    const [createTableResult] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createTableSql = createTableResult[0]['Create Table'];

    sqlDump += `-- --------------------------------------------------------\n`;
    sqlDump += `-- Table structure for: \`${tableName}\`\n`;
    sqlDump += `-- --------------------------------------------------------\n`;
    sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    sqlDump += `${createTableSql};\n\n`;

    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
    if (rows && rows.length > 0) {
      totalRows += rows.length;
      sqlDump += `-- Dumping data for table: \`${tableName}\` (${rows.length} rows)\n`;

      for (const row of rows) {
        const columns = Object.keys(row).map(c => `\`${c}\``).join(', ');
        const values = Object.values(row).map(val => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return isNaN(val) ? 'NULL' : val;
          if (typeof val === 'boolean') return val ? 1 : 0;
          if (Buffer.isBuffer(val)) return `X'${val.toString('hex')}'`;
          if (val instanceof Date) {
            const formattedDate = val.toISOString().slice(0, 19).replace('T', ' ');
            return `'${formattedDate}'`;
          }
          if (typeof val === 'object') {
            const jsonStr = JSON.stringify(val);
            return `'${jsonStr.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          }

          const escaped = val.toString()
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\r\n/g, '\\r\\n')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
          return `'${escaped}'`;
        }).join(', ');

        sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
      }
      sqlDump += `\n`;
    }
  }

  sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;
  sqlDump += `-- End of backup dump (${tableCount} tables, ${totalRows} rows)\n`;

  const sizeBytes = Buffer.byteLength(sqlDump, 'utf8');
  const formattedSize = formatBytes(sizeBytes);

  return {
    sqlDump,
    dbName,
    tableCount,
    totalRows,
    sizeBytes,
    formattedSize,
    generatedAt: dhakaTimestamp
  };
};

/**
 * Get automated backup settings
 */
const getBackupSettings = async () => {
  const pool = db.getPool();
  if (!pool) {
    return {
      enabled: true,
      email: '',
      scheduleTime: '17:05 (5:05 PM BST)',
      lastRun: null,
      lastStatus: 'Not executed yet',
      lastSize: null,
      lastTables: null,
      lastRows: null
    };
  }

  try {
    await ensureSettingsTable(pool);
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM site_settings WHERE setting_key LIKE 'auto_backup_%'"
    );

    const map = {};
    rows.forEach(r => { map[r.setting_key] = r.setting_value; });

    return {
      enabled: map.auto_backup_enabled !== 'false',
      email: map.auto_backup_email || '',
      scheduleTime: map.auto_backup_time || '17:05 (5:05 PM BST)',
      lastRun: map.auto_backup_last_run || null,
      lastStatus: map.auto_backup_last_status || 'Pending first run',
      lastSize: map.auto_backup_last_size || null,
      lastTables: map.auto_backup_last_tables ? parseInt(map.auto_backup_last_tables, 10) : null,
      lastRows: map.auto_backup_last_rows ? parseInt(map.auto_backup_last_rows, 10) : null
    };
  } catch (err) {
    console.error('[DatabaseBackupService] Error fetching settings:', err.message);
    return {
      enabled: true,
      email: '',
      scheduleTime: '17:05 (5:05 PM BST)',
      lastRun: null,
      lastStatus: 'Error reading settings',
      lastSize: null,
      lastTables: null,
      lastRows: null
    };
  }
};

/**
 * Update automated backup settings
 */
const updateBackupSettings = async ({ enabled, email }) => {
  const pool = db.getPool();
  if (!pool) throw new Error('Database connection unavailable.');

  await ensureSettingsTable(pool);

  const updates = [];
  if (enabled !== undefined) {
    updates.push(['auto_backup_enabled', enabled === true || enabled === 'true' ? 'true' : 'false']);
  }
  if (email !== undefined) {
    updates.push(['auto_backup_email', (email || '').trim()]);
  }

  for (const [key, val] of updates) {
    await pool.query(`
      INSERT INTO site_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP
    `, [key, val]);
  }

  return await getBackupSettings();
};

/**
 * Record backup execution status in site_settings
 */
const recordBackupRun = async ({ status, size, tables, rows }) => {
  try {
    const pool = db.getPool();
    if (!pool) return;
    await ensureSettingsTable(pool);

    const now = getDhakaTimeString(new Date());
    const records = [
      ['auto_backup_last_run', now],
      ['auto_backup_last_status', status],
      ['auto_backup_last_size', size || '0 Bytes'],
      ['auto_backup_last_tables', String(tables || 0)],
      ['auto_backup_last_rows', String(rows || 0)]
    ];

    for (const [k, v] of records) {
      await pool.query(`
        INSERT INTO site_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP
      `, [k, v]);
    }
  } catch (err) {
    console.error('[DatabaseBackupService] Error recording backup run:', err.message);
  }
};

/**
 * Build professional email HTML for backup
 */
const buildBackupEmailHtml = ({ dbName, tableCount, totalRows, formattedSize, generatedAt, filename, isManualTest }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Backup</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%); padding: 32px 28px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255,255,255,0.18); border-radius: 50%; padding: 12px; margin-bottom: 12px;">
                <span style="font-size: 32px; line-height: 1;">💾</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                ElitePassBD Database Backup
              </h1>
              <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">
                ${isManualTest ? '⚡ ম্যানুয়াল টেস্ট ব্যাকআপ রিপোর্ট' : '🕒 দৈনিক স্বয়ংক্রিয় বিকেল ৫:০৫ ব্যাকআপ ফাইল'}
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 22px;">
                <p style="margin: 0; color: #166534; font-size: 13px; font-weight: 700; line-height: 1.5;">
                  ✅ ডেটাবেজ সফলভাবে ব্যাকআপ করা হয়েছে এবং সম্পূর্ণ SQL ফাইলটি এই ইমেইলের সাথে সংযুক্ত (Attached) করা হয়েছে।
                </p>
              </div>

              <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                📊 ব্যাকআপ বিবরণী (Backup Summary)
              </h2>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 11px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; width: 40%;">টাইমস্ট্যাম্প (BST)</td>
                  <td style="padding: 11px 16px; font-size: 13px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${generatedAt}</td>
                </tr>
                <tr>
                  <td style="padding: 11px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">ডেটাবেজ নাম</td>
                  <td style="padding: 11px 16px; font-size: 13px; color: #4f46e5; font-weight: 700; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${dbName}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 11px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">মোট টেবিল সংখ্যা</td>
                  <td style="padding: 11px 16px; font-size: 13px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${tableCount} টি টেবিল</td>
                </tr>
                <tr>
                  <td style="padding: 11px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">মোট ডাটা রেকর্ড</td>
                  <td style="padding: 11px 16px; font-size: 13px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${totalRows.toLocaleString()} টি রো</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 11px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">ফাইল সাইজ</td>
                  <td style="padding: 11px 16px; font-size: 13px; color: #059669; font-weight: 800; border-bottom: 1px solid #e2e8f0;">${formattedSize}</td>
                </tr>
                <tr>
                  <td style="padding: 11px 16px; font-size: 13px; color: #64748b; font-weight: 600;">সংযুক্ত ফাইল নাম</td>
                  <td style="padding: 11px 16px; font-size: 12px; color: #334155; font-weight: 600; font-family: monospace;">${filename}</td>
                </tr>
              </table>

              <!-- Safe Storage Notice -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
                <p style="margin: 0; color: #1e40af; font-size: 12px; line-height: 1.6;">
                  🔒 <strong>নিরাপত্তা বার্তা:</strong> এই ব্যাকআপ ফাইলে ওয়েবসাইটের সকল প্রোডাক্ট, কাস্টমার অর্ডার, সাবস্ক্রিপশন ও সেটিংস রয়েছে। ফাইলটি ডাউনলোড করে গুগল ড্রাইভ বা অফলাইনে নিরাপদে সংরক্ষণ করুন।
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 28px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                ElitePassBD Automated Backup System • Delivered to <strong>${recipient || 'Configured Admin Email'}</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Send backup file as attachment via email
 */
const sendBackupEmail = async ({ targetEmail, isManualTest = false } = {}) => {
  const currentSettings = await getBackupSettings();
  const recipient = (targetEmail || currentSettings.email || '').trim();

  if (!recipient) {
    const errorMsg = 'কোনো ব্যাকআপ ইমেইল সেট করা নেই। দয়া করে এডমিন ড্যাশবোর্ড থেকে ব্যাকআপ ইমেইল এড্রেস সেট করুন (No backup recipient email configured).';
    console.warn(`[DatabaseBackupService] ${errorMsg}`);
    await recordBackupRun({
      status: 'Failed: No recipient email configured',
      size: '0 Bytes',
      tables: 0,
      rows: 0
    });
    return {
      success: false,
      error: errorMsg
    };
  }

  console.log(`[DatabaseBackupService] Initiating database backup email to ${recipient}... (Manual: ${isManualTest})`);

  try {
    const dumpResult = await generateSqlDump();
    const { sqlDump, dbName, tableCount, totalRows, formattedSize, generatedAt } = dumpResult;

    const fileDateStr = getDhakaFileTimestamp(new Date());
    const filename = `elitepass_db_backup_${fileDateStr}.sql`;

    const emailSubject = isManualTest
      ? `⚡ [Manual Test] ElitePassBD Database Backup - ${generatedAt}`
      : `🛡️ [Daily Auto-Backup] ElitePassBD Database Backup - ${generatedAt}`;

    const emailText = `ElitePassBD Database Backup Report\n\n` +
      `Date & Time: ${generatedAt} (BST)\n` +
      `Database: ${dbName}\n` +
      `Tables: ${tableCount}\n` +
      `Total Records: ${totalRows}\n` +
      `File Size: ${formattedSize}\n` +
      `Filename: ${filename}\n\n` +
      `Attached to this email is the full .sql backup dump file.`;

    const emailHtml = buildBackupEmailHtml({
      dbName,
      tableCount,
      totalRows,
      formattedSize,
      generatedAt,
      filename,
      recipient,
      isManualTest
    });

    const mailResult = await sendEmailDetailed({
      to: recipient,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      attachments: [
        {
          filename,
          content: sqlDump,
          contentType: 'application/sql'
        }
      ]
    });

    if (mailResult && mailResult.success) {
      console.log(`[DatabaseBackupService] ✅ Backup email sent successfully to ${recipient} (Size: ${formattedSize}, Tables: ${tableCount}, Rows: ${totalRows})`);
      await recordBackupRun({
        status: `Success (${formattedSize}, ${tableCount} tables)`,
        size: formattedSize,
        tables: tableCount,
        rows: totalRows
      });

      return {
        success: true,
        message: `Database backup email successfully sent to ${recipient}!`,
        stats: {
          recipient,
          filename,
          tableCount,
          totalRows,
          formattedSize,
          generatedAt
        }
      };
    } else {
      const errorMsg = (mailResult && mailResult.error) || 'Failed to dispatch email via SMTP server';
      console.error(`[DatabaseBackupService] ❌ Failed sending backup email:`, errorMsg);
      await recordBackupRun({
        status: `Failed: ${errorMsg}`,
        size: formattedSize,
        tables: tableCount,
        rows: totalRows
      });

      return {
        success: false,
        error: errorMsg,
        stats: {
          recipient,
          tableCount,
          totalRows,
          formattedSize
        }
      };
    }
  } catch (err) {
    console.error(`[DatabaseBackupService] Backup generation/sending error:`, err);
    await recordBackupRun({
      status: `Failed: ${err.message}`,
      size: '0 Bytes',
      tables: 0,
      rows: 0
    });

    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * Initialize daily backup cron job
 * Runs every day at 17:05 (5:05 PM BST)
 */
const initDatabaseBackupCron = () => {
  if (!cron) {
    console.warn('[DatabaseBackupService] cron is not available. Scheduled backup will not run.');
    return;
  }

  console.log(`[DatabaseBackupService] ⏰ Initializing Daily Database Backup Cron (${DEFAULT_CRON_EXPRESSION} BST - Asia/Dhaka)...`);

  cron.schedule(
    DEFAULT_CRON_EXPRESSION,
    async () => {
      console.log('[DatabaseBackupService] ⏰ Daily 5:05 PM auto-backup cron triggered!');
      try {
        const settings = await getBackupSettings();
        if (settings.enabled) {
          if (!settings.email || !settings.email.trim()) {
            console.warn('[DatabaseBackupService] Daily auto-backup skipped: No backup email configured in site_settings. Please configure one from the Admin Dashboard.');
            await recordBackupRun({
              status: 'Skipped: No backup email configured',
              size: '0 Bytes',
              tables: 0,
              rows: 0
            });
            return;
          }
          console.log(`[DatabaseBackupService] Running automated daily backup to ${settings.email}...`);
          await sendBackupEmail({ targetEmail: settings.email, isManualTest: false });
        } else {
          console.log('[DatabaseBackupService] Auto-backup is currently disabled in site_settings. Skipping scheduled run.');
        }
      } catch (cronErr) {
        console.error('[DatabaseBackupService] Error during scheduled backup cron execution:', cronErr);
      }
    },
    {
      scheduled: true,
      timezone: TIMEZONE
    }
  );
};

module.exports = {
  generateSqlDump,
  getBackupSettings,
  updateBackupSettings,
  sendBackupEmail,
  initDatabaseBackupCron
};
