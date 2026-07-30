const db = require('./config/db');

async function updateSample() {
  try {
    const sampleText = `Google AI Pro (Gemini Advanced) 5 TB Storage Access\n100% Genuine Private Account / Family Plan\n24/7 Instant Activation Support & Guarantee`;
    await db.query("UPDATE products SET highlighted_text = ? WHERE id = 11 OR name LIKE '%Google AI Pro%'", [sampleText]);
    console.log('Successfully updated sample product (Google AI Pro) with highlighted_text!');
    process.exit(0);
  } catch (e) {
    console.error('Error updating sample:', e);
    process.exit(1);
  }
}

updateSample();
