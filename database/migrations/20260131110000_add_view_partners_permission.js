/**
 * Add view.partners permission and assign to super_admin
 */
exports.up = function (knex) {
    return knex.transaction(async trx => {
        // 1. Create permissions
        const permissions = [
            {
                name: 'view.partners',
                resource: 'partnership',
                action: 'view',
                description: 'View partnership inquiries'
            }
        ];

        // Insert permissions if they don't exist
        for (const perm of permissions) {
            const existing = await trx('permissions').where('name', perm.name).first();
            if (!existing) {
                await trx('permissions').insert(perm);
            }
        }

        // 2. Assign to super_admin role
        const superAdminRole = await trx('roles').where('name', 'super_admin').first();

        if (superAdminRole) {
            // Get permission ID
            const viewPartnersPerm = await trx('permissions').where('name', 'view.partners').first();

            if (viewPartnersPerm) {
                // Check if assignment exists
                const existingAssignment = await trx('role_permissions')
                    .where({
                        role_id: superAdminRole.id,
                        permission_id: viewPartnersPerm.id
                    })
                    .first();

                if (!existingAssignment) {
                    await trx('role_permissions').insert({
                        role_id: superAdminRole.id,
                        permission_id: viewPartnersPerm.id
                    });
                }
            }
        }
    });
};

exports.down = function (knex) {
    return knex.transaction(async trx => {
        // Get permission ID
        const viewPartnersPerm = await trx('permissions').where('name', 'view.partners').first();

        if (viewPartnersPerm) {
            // Remove from role_permissions
            await trx('role_permissions').where('permission_id', viewPartnersPerm.id).del();

            // Remove permission
            await trx('permissions').where('id', viewPartnersPerm.id).del();
        }
    });
};
