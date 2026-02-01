const knex = require('./config/knex');

async function testMetadataUpdate() {
    try {
        console.log('Testing metadata update with knex.raw...');

        // 1. Create a dummy subscription with null metadata
        const [sub] = await knex('user_subscriptions').insert({
            user_id: '1a881e6b-01d4-45e8-8a06-eaa38b205e25', // Valid user ID
            tier_id: (await knex('subscription_tiers').first()).id,
            status: 'pending',
            metadata: null
        }).returning('*');

        console.log('Created subscription with null metadata:', sub.id);

        const reason = 'Test cancellation';
        const now = new Date();
        const metadataJson = JSON.stringify({ cancellation_reason: reason, cancelled_at: now });

        const UserSubscription = require('./models/UserSubscription');

        try {
            const result = await UserSubscription.cancelSubscription(sub.id, reason);

            console.log('Update result metadata:', result.metadata);
            if (result.metadata === null) {
                console.log('FAIL: Metadata is still null after update (null || jsonb = null)');
            }
        } catch (error) {
            console.error('Update failed with error:', error.message);
            if (error.message.includes('operator does not exist')) {
                console.log('CONFIRMED: Operator || does not exist for jsonb || text');
            }
        }

        // Cleanup
        await knex('user_subscriptions').where({ id: sub.id }).del();

    } catch (error) {
        console.error('Test script failed:', error);
    } finally {
        await knex.destroy();
    }
}

testMetadataUpdate();
