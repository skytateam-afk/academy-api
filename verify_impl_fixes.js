
const UserSubscription = require('./models/UserSubscription');
const SubscriptionController = require('./modules/subscription_management/controllers/subscriptionController');
const PaymentService = require('./services/paymentService');

console.log('Modules loaded successfully after review fixes');
console.log('UserSubscription.getById:', typeof UserSubscription.getById);
console.log('SubscriptionController.subscribe:', typeof SubscriptionController.subscribe);
console.log('PaymentService.verifyPayment:', typeof PaymentService.verifyPayment);
