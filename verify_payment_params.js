
const ps = require('./services/paymentService');

console.log('Verifying Payment Provider Selection Logic:');

const ngnProvider = ps.getProviderForCurrency('NGN');
console.log(`NGN -> ${ngnProvider} (Expected: paystack)`);

const usdProvider = ps.getProviderForCurrency('USD');
console.log(`USD -> ${usdProvider} (Expected: stripe)`);

const eurProvider = ps.getProviderForCurrency('EUR');
console.log(`EUR -> ${eurProvider} (Expected: stripe)`);


if (ngnProvider === 'paystack' && usdProvider === 'stripe') {
    console.log('✅ Payment provider selection logic passed');
} else {
    console.error('❌ Payment provider selection logic failed');
    process.exit(1);
}
