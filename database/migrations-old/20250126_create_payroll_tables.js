exports.up = function(knex) {
    return knex.schema
        // Staff bank account information
        .createTable('staff_accounts', table => {
            table.increments('id').primary();
            table.integer('staff_id').unsigned().notNullable().references('id').inTable('staff').onDelete('CASCADE');
            table.string('bank_name', 100).notNullable();
            table.string('account_number', 20).notNullable();
            table.string('account_name', 200).notNullable();
            table.string('account_type', 50).defaultTo('savings'); // savings, current, etc.
            table.boolean('is_primary').defaultTo(true);
            table.timestamps(true, true);
            
            table.index('staff_id');
        })
        
        // Staff salary information
        .createTable('staff_salaries', table => {
            table.increments('id').primary();
            table.integer('staff_id').unsigned().notNullable().references('id').inTable('staff').onDelete('CASCADE');
            table.decimal('basic_salary', 15, 2).notNullable();
            table.decimal('housing_allowance', 15, 2).defaultTo(0);
            table.decimal('transport_allowance', 15, 2).defaultTo(0);
            table.decimal('meal_allowance', 15, 2).defaultTo(0);
            table.decimal('other_allowances', 15, 2).defaultTo(0);
            table.decimal('pension_percentage', 5, 2).defaultTo(8.00); // Employee pension contribution %
            table.decimal('tax_percentage', 5, 2).defaultTo(0); // Tax percentage
            table.string('payment_frequency', 20).defaultTo('monthly'); // monthly, bi-weekly, weekly
            table.date('effective_from').notNullable();
            table.date('effective_to');
            table.boolean('is_active').defaultTo(true);
            table.text('notes');
            table.timestamps(true, true);
            
            table.index('staff_id');
            table.index('is_active');
        })
        
        // Payroll runs (monthly payroll processing)
        .createTable('payroll_runs', table => {
            table.increments('id').primary();
            table.string('payroll_month', 7).notNullable(); // Format: YYYY-MM
            table.string('payroll_period', 100).notNullable(); // e.g., "January 2025"
            table.date('payment_date').notNullable();
            table.enum('status', ['draft', 'approved', 'paid', 'cancelled']).defaultTo('draft');
            table.decimal('total_gross', 15, 2).defaultTo(0);
            table.decimal('total_deductions', 15, 2).defaultTo(0);
            table.decimal('total_net', 15, 2).defaultTo(0);
            table.integer('staff_count').defaultTo(0);
            table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
            table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
            table.timestamp('approved_at');
            table.text('notes');
            table.timestamps(true, true);
            
            table.unique('payroll_month');
            table.index('status');
        })
        
        // Individual payroll items for each staff member in a payroll run
        .createTable('payroll_items', table => {
            table.increments('id').primary();
            table.integer('payroll_run_id').unsigned().notNullable().references('id').inTable('payroll_runs').onDelete('CASCADE');
            table.integer('staff_id').unsigned().notNullable().references('id').inTable('staff').onDelete('CASCADE');
            
            // Earnings
            table.decimal('basic_salary', 15, 2).notNullable();
            table.decimal('housing_allowance', 15, 2).defaultTo(0);
            table.decimal('transport_allowance', 15, 2).defaultTo(0);
            table.decimal('meal_allowance', 15, 2).defaultTo(0);
            table.decimal('other_allowances', 15, 2).defaultTo(0);
            table.decimal('bonus', 15, 2).defaultTo(0);
            table.decimal('overtime', 15, 2).defaultTo(0);
            table.decimal('gross_pay', 15, 2).notNullable();
            
            // Deductions
            table.decimal('pension', 15, 2).defaultTo(0);
            table.decimal('tax', 15, 2).defaultTo(0);
            table.decimal('insurance', 15, 2).defaultTo(0);
            table.decimal('loan_repayment', 15, 2).defaultTo(0);
            table.decimal('other_deductions', 15, 2).defaultTo(0);
            table.decimal('total_deductions', 15, 2).defaultTo(0);
            
            // Net pay
            table.decimal('net_pay', 15, 2).notNullable();
            
            // Working days
            table.integer('working_days').defaultTo(0);
            table.integer('days_worked').defaultTo(0);
            table.integer('days_absent').defaultTo(0);
            
            table.text('notes');
            table.timestamps(true, true);
            
            table.index('payroll_run_id');
            table.index('staff_id');
            table.unique(['payroll_run_id', 'staff_id']);
        });
};

exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('payroll_items')
        .dropTableIfExists('payroll_runs')
        .dropTableIfExists('staff_salaries')
        .dropTableIfExists('staff_accounts');
};
