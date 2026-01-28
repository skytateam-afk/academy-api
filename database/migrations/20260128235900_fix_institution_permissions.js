/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // 1. Ensure the 'institution.students.manage' permission exists
    const permissions = [
        {
            name: 'institution.dashboard.view',
            resource: 'institution',
            action: 'dashboard.view',
            description: 'View institution dashboard'
        },
        {
            name: 'institution.students.manage',
            resource: 'institution',
            action: 'students.manage',
            description: 'Manage students within an institution'
        },
        {
            name: 'institution.view',
            resource: 'institution',
            action: 'view',
            description: 'View institution information'
        }
    ];

    await knex('permissions').insert(permissions).onConflict(['resource', 'action']).ignore();

    // 2. Get role IDs
    const instRole = await knex('roles').where('name', 'institution').first();
    const adminRole = await knex('roles').where('name', 'super_admin').first();

    if (instRole) {
        // 3. Fetch IDs for the specific permissions we want to grant
        const permsToGrant = await knex('permissions')
            .whereIn('name', [
                'institution.students.manage',
                'institution.dashboard.view',
                'institution.view',
                'user.read'
            ])
            .select('id');

        const rolePermissions = permsToGrant.map(p => ({
            role_id: instRole.id,
            permission_id: p.id
        }));

        // Insert into role_permissions
        await knex('role_permissions').insert(rolePermissions).onConflict(['role_id', 'permission_id']).ignore();
    }

    if (adminRole) {
        // Super admin should also have the new student management permission
        const managePerm = await knex('permissions').where('name', 'institution.students.manage').first();
        if (managePerm) {
            await knex('role_permissions').insert({
                role_id: adminRole.id,
                permission_id: managePerm.id
            }).onConflict(['role_id', 'permission_id']).ignore();
        }
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // We don't want to revert these permissions as they are core to the fix, 
    // but standard practice is to provide a down migration.
    // In this case, we'd just leave them.
};
