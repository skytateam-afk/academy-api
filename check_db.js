
const knex = require('./config/knex');

async function checkPermissions() {
    try {
        console.log('--- Roles ---');
        const roles = await knex('roles').select('id', 'name');
        console.table(roles);

        const instRole = roles.find(r => r.name === 'institution');
        if (!instRole) {
            console.log('ERROR: "institution" role not found!');
        } else {
            console.log(`\n--- Permissions for "institution" role (ID: ${instRole.id}) ---`);
            const perms = await knex('role_permissions as rp')
                .join('permissions as p', 'rp.permission_id', 'p.id')
                .where('rp.role_id', instRole.id)
                .select('p.name', 'p.resource', 'p.action');
            console.table(perms);
        }

        console.log('\n--- Evaluating "user" counts ---');
        const userCount = await knex('users').count('id as count').first();
        console.log(`Total users: ${userCount.count}`);

        const usersByRole = await knex('users as u')
            .join('roles as r', 'u.role_id', 'r.id')
            .select('r.name as role')
            .count('u.id as count')
            .groupBy('r.name');
        console.table(usersByRole);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        knex.destroy();
    }
}

checkPermissions();
