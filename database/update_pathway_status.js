require('dotenv').config();
const path = require('path');
const knexConfig = require('../knexfile');
const environment = process.env.NODE_ENV || 'development';
const knex = require('knex')(knexConfig[environment]);

async function run() {
    try {
        console.log(`Running in ${environment} environment.`);

        // Fetch all applications
        const apps = await knex('pathway_applications').select('id', 'status');

        console.log(`Found ${apps.length} applications.`);

        if (apps.length > 0) {
            console.log('--- Initial Statuses ---');
            apps.forEach(app => {
                console.log(`ID: ${app.id}, Status: ${app.status}`);
            });
            console.log('------------------------');

            // Update all to approved
            const count = await knex('pathway_applications').update({ status: 'approved' });

            console.log(`Successfully updated ${count} applications to 'approved'.`);
        } else {
            console.log('No applications to update.');
        }

    } catch (error) {
        console.error('Error updating pathway applications:', error);
    } finally {
        await knex.destroy();
    }
}

run();
