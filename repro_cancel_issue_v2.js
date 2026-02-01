const knex = require('./config/knex');
const UserSubscription = require('./models/UserSubscription');

async function testMultipleCancellations() {
    try {
        console.log('Testing multiple cancellations for same user and tier...');

        const userId = '1a881e6b-01d4-45e8-8a06-eaa38b205e25';
        const tier = await knex('subscription_tiers').first();

        // 1. Create first subscription and cancel it
        console.log('--- Step 1: First Cancellation ---');
        const [sub1] = await knex('user_subscriptions').insert({
            user_id: userId,
            tier_id: tier.id,
            status: 'pending',
            metadata: null
        }).returning('*');
        console.log('Created sub1:', sub1.id);

        await UserSubscription.cancelSubscription(sub1.id, 'First cancellation reason');
        console.log('Sub1 cancelled successfully');

        // 2. Create second subscription (same user, same tier) and cancel it
        console.log('--- Step 2: Second Cancellation (Should not conflict now) ---');
        const [sub2] = await knex('user_subscriptions').insert({
            user_id: userId,
            tier_id: tier.id,
            status: 'pending',
            metadata: null
        }).returning('*');
        console.log('Created sub2:', sub2.id);

        const result2 = await UserSubscription.cancelSubscription(sub2.id, 'Second cancellation reason');
        console.log('Sub2 cancelled successfully!');
        console.log('Metadata content:', result2.metadata);

        // Cleanup
        await knex('user_subscriptions').whereIn('id', [sub1.id, sub2.id]).del();
        console.log('Cleanup done');

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.message.includes('unique constraint')) {
            console.log('FAIL: Unique constraint conflict still exists');
        }
    } finally {
        await knex.destroy();
    }
}

testMultipleCancellations();
