const knex = require('./config/knex');

async function debugPathways() {
    try {
        console.log('Fetching all pathways...');
        const pathways = await knex('pathways').select('*');
        console.log(`Found ${pathways.length} pathways.`);

        pathways.forEach(p => {
            console.log(`- ID: ${p.id}`);
            console.log(`  Title: ${p.title}`);
            console.log(`  Published: ${p.is_published}`);
            console.log(`  Institution ID: ${p.institution_id}`); // This is the key suspicion
            console.log(`  Created By: ${p.created_by}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error querying pathways:', error);
    } finally {
        await knex.destroy();
    }
}

debugPathways();
