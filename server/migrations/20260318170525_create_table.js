/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Создаем таблицу roles
  await knex.schema.createTable('roles', function (table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. Создаем таблицу users
  await knex.schema.createTable('users', function (table) {
    table.increments('id').primary();
    table.string('surname').notNullable();
    table.string('name').notNullable();
    table.string('patronymic').notNullable();
    table.string('username').notNullable();
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.integer('role_id').unsigned().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('role_id').references('roles.id').onDelete('CASCADE');
  });

  // 3. Создаем таблицу tasks
  await knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('phone', 20).notNullable();
    table.string('customer', 255).notNullable();
    table.timestamp('start_date').notNullable();
    table.timestamp('due_date').notNullable();

    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.text('address');
    table.text('addressNote');

    table.enu('status', ['new', 'in_progress', 'paused', 'completed', 'report_added', 'accepted_by_customer', 'rejected'])
      .defaultTo('new')
      .notNullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.check('due_date >= start_date', [], 'chk_dates');
  });

  // Индексы для tasks
  await knex.schema.raw(`
    CREATE INDEX idx_tasks_status ON tasks(status);
    CREATE INDEX idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX idx_tasks_created_at ON tasks(created_at);
  `);

  // 4. Создаем таблицу available_materials
  await knex.schema.createTable('available_materials', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('unit').notNullable();
    table.text('description').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('name');
  });

  // 5. Создаем таблицу task_materials
  await knex.schema.createTable('task_materials', function(table) {
    table.increments('id').primary();
    table.integer('task_id').unsigned().notNullable();
    table.integer('material_id').unsigned().nullable();
    table.decimal('quantity', 10, 2).notNullable();
    table.string('custom_name').nullable();
    table.string('custom_unit').nullable();
    table.text('note').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.foreign('material_id').references('id').inTable('available_materials').onDelete('SET NULL');
    table.index('task_id');
    table.index('material_id');
    table.check('material_id IS NOT NULL OR custom_name IS NOT NULL');
  });

  // 6. Создаем таблицу reports
  await knex.schema.createTable('reports', (table) => {
    table.increments('id').primary();
    table.integer('task_id').unsigned().notNullable();
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.unique('task_id');
  });

  // Индексы для reports
  await knex.schema.raw(`
    CREATE INDEX idx_reports_task_id ON reports(task_id);
    CREATE INDEX idx_reports_created_at ON reports(created_at);
  `);

  // 7. Создаем таблицу files (сразу с нужными колонками)
  await knex.schema.createTable('files', (table) => {
    table.increments('id').primary();

    table.string('entity_type').notNullable(); // 'report', 'invoice', 'comment', 'info' и т.д.
    table.integer('entity_id').unsigned().notNullable();

    table.string('file_name', 255).notNullable();
    table.string('file_path', 255).notNullable();
    table.string('file_type', 50).notNullable();
    table.integer('file_size').unsigned();
    table.text('description');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.integer('uploaded_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.integer('task_id').unsigned().references('id').inTable('tasks').onDelete('SET NULL');

    table.index(['entity_type', 'entity_id']);
    table.index('created_at');
    table.index('task_id');
  });

  // 8. Создаем таблицу comments
  await knex.schema.createTable('comments', function (table) {
    table.increments('id').primary();
    table.integer('task_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.text('content').notNullable();
    table.string('comment_type').defaultTo('general');
    table.timestamps(true, true);

    table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });

  // Индексы для comments
  await knex.schema.raw(`
    CREATE INDEX idx_comments_task_id ON comments(task_id);
    CREATE INDEX idx_comments_user_id ON comments(user_id);
  `);

  // 9. Удаляем старую таблицу report_photos (если существовала)
  await knex.schema.dropTableIfExists('report_photos');

  // 10. Добавляем начальные роли
  await knex('roles').insert([
    { name: 'Admin' },
    { name: 'Employee' }
  ]);

  // 11. Добавляем начальные материалы
  await knex('available_materials').insert([
    { name: 'Цемент', unit: 'кг', description: 'Цемент строительный' },
    { name: 'Песок', unit: 'кг', description: 'Песок строительный' },
    { name: 'Щебень', unit: 'кг', description: 'Щебень гравийный' },
    { name: 'Доска', unit: 'шт', description: 'Доска обрезная' },
    { name: 'Брус', unit: 'шт', description: 'Брус деревянный' },
    { name: 'Гипсокартон', unit: 'шт', description: 'Гипсокартонный лист' },
    { name: 'Краска', unit: 'л', description: 'Краска водоэмульсионная' },
    { name: 'Клей', unit: 'кг', description: 'Клей строительный' },
    { name: 'Гвозди', unit: 'кг', description: 'Гвозди строительные' },
    { name: 'Саморезы', unit: 'шт', description: 'Саморезы по дереву' },
    { name: 'Провод', unit: 'м', description: 'Провод электрический' },
    { name: 'Труба', unit: 'м', description: 'Труба ПВХ' },
    { name: 'Арматура', unit: 'шт', description: 'Арматура металлическая' },
    { name: 'Шпаклевка', unit: 'кг', description: 'Шпаклевка финишная' },
    { name: 'Грунтовка', unit: 'л', description: 'Грунтовка глубокого проникновения' },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {

};