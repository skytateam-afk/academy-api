
const knex = require('./config/knex');

async function checkInstitutionStudents() {
    try {
        const institutionId = '59e5bd07-84e4-4d53-8ac0-6cce8ec6ad7d';
        console.log(`Checking students for institution: ${institutionId}`);

        // 1. Count students with this institution_id
        const count = await knex('users as u')
            .join('roles as r', 'u.role_id', 'r.id')
            .where('r.name', 'student')
            .andWhere('u.institution_id', institutionId)
            .count('u.id as count')
            .first();

        console.log(`\nFound ${count.count} students strictly linked to this institution.`);

        // 2. Sample comparison: Count ALL students
        const allCount = await knex('users as u')
            .join('roles as r', 'u.role_id', 'r.id')
            .where('r.name', 'student')
            .count('u.id as count')
            .first();

        console.log(`Total students in system: ${allCount.count}`);

        // 3. Inspect a few students to see their institution_id
        const sample = await knex('users as u')
            .join('roles as r', 'u.role_id', 'r.id')
            .where('r.name', 'student')
            .select('u.username', 'u.institution_id')
            .limit(5);

        console.table(sample);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        knex.destroy();
    }
}

checkInstitutionStudents();
