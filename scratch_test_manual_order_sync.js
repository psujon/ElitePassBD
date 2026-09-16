const db = require('./config/db');
const { createSubscription } = require('./controllers/subscriptionController');

console.log('Testing manual subscription order sync imports...');
if (typeof createSubscription === 'function') {
  console.log('subscriptionController exports createSubscription correctly.');
} else {
  console.error('Failed to export createSubscription.');
}

setTimeout(() => process.exit(0), 500);
