/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // 1. Add new permissions
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
            name: 'institution.pathways.manage',
            resource: 'institution',
            action: 'pathways.manage',
            description: 'Manage pathways within an institution'
        }
    ];

    await knex('permissions').insert(permissions).onConflict(['resource', 'action']).ignore();

    // 2. Add institution role
    const [role] = await knex('roles').insert({
        name: 'institution',
        description: 'Administrator for a specific institution',
        is_system_role: true
    }).onConflict('name').ignore().returning('*');

    // If the role already existed and ignore() worked, we need to fetch the ID
    const roleId = role?.id || (await knex('roles').where('name', 'institution').first())?.id;

    if (roleId) {
        // 3. Assign permissions to the role
        const newPerms = await knex('permissions')
            .whereIn('name', permissions.map(p => p.name))
            .select('id');

        const rolePermissions = newPerms.map(p => ({
            role_id: roleId,
            permission_id: p.id
        }));

        // Also give some existing permissions to institution
        const additionalPermissionNames = [
            'user.read',
            'course.read',
            'pathway.read',
            'pathway.create',
            'pathway.update',
            'pathway.delete',
            'pathway.publish'
        ];

        const additionalPerms = await knex('permissions')
            .whereIn('name', additionalPermissionNames)
            .select('id');

        const allRolePermissions = [
            ...rolePermissions,
            ...additionalPerms.map(p => ({
                role_id: roleId,
                permission_id: p.id
            }))
        ];

        await knex('role_permissions').insert(allRolePermissions).onConflict(['role_id', 'permission_id']).ignore();
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    const role = await knex('roles').where('name', 'institution').first();
    if (role) {
        await knex('role_permissions').where('role_id', role.id).del();
        await knex('roles').where('id', role.id).del();
    }

    await knex('permissions')
        .whereIn('name', [
            'institution.dashboard.view',
            'institution.students.manage',
            'institution.pathways.manage'
        ])
        .del();
};

