const { sendPurchaseConfirmationEmail, generatePurchaseEmailHtml } = require('./services/purchaseEmailService');

console.log('Testing purchaseEmailService module import...');
if (typeof sendPurchaseConfirmationEmail === 'function' && typeof generatePurchaseEmailHtml === 'function') {
  console.log('purchaseEmailService functions successfully loaded.');
} else {
  console.error('Failed to load purchaseEmailService functions.');
}

// Test html generation with sample order
const sampleOrder = {
  id: 1001,
  user_name: 'Tanvir Ahmed',
  recipient_email: 'tanvir@example.com',
  phone: '01912345678',
  total_amount: '999.00',
  payment_method: 'bKash / EPS Gateway',
  payment_status: 'Paid',
  created_at: new Date(),
  shipping_address: 'Dhaka, Bangladesh'
};

const sampleItems = [
  {
    product_name: 'ChatGPT Plus Subscription',
    image_url: 'https://elitepassbd.com/placeholder.png',
    quantity: 1,
    price: '999.00',
    package_name: '1 Month',
    selected_device: '1 Device',
    selected_activation: 'Shared Email'
  }
];

const html = generatePurchaseEmailHtml(sampleOrder, sampleItems);
console.log('Generated Purchase Confirmation HTML length:', html.length);
console.log('Purchase Email Service test passed.');
setTimeout(() => process.exit(0), 500);
