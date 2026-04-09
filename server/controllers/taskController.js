const db = require('../utils/db');
const fileController = require('./fileController');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const archiver = require('archiver');

// Получение списка задач
exports.getTasks = async (req, res) => {
  try {
    const tasks = await db('tasks')
      .leftJoin('files as invoice_file', function () {
        this.on('invoice_file.entity_type', '=', db.raw("'invoice'"))
          .andOn('invoice_file.entity_id', '=', 'tasks.id');
      })
      .select(
        'tasks.*',
        'invoice_file.id as invoice_id',
        'invoice_file.file_path as invoice_filename',
        'invoice_file.file_name as invoice_originalname',
        'invoice_file.file_type as invoice_type',
        'invoice_file.description as invoice_description',
        db.raw('(SELECT COUNT(*) FROM comments WHERE comments.task_id = tasks.id) as comments_count'),
        db.raw('(SELECT COUNT(*) FROM files WHERE files.task_id = tasks.id) as files_count')
      )
      .orderBy('tasks.created_at', 'desc');

    const tasksWithInvoiceInfo = tasks.map(task => {
      const hasInvoice = !!task.invoice_id;
      let invoice = null;
      if (hasInvoice) {
        invoice = {
          id: task.invoice_id,
          filename: task.invoice_filename,
          originalname: task.invoice_originalname,
          type: task.invoice_type,
          description: task.invoice_description,
          path: fileController.getEntityPath('invoice', task.invoice_filename),
          url: `/api/files/invoices/${task.invoice_filename}`
        };
      }

      // Удаляем временные поля, чтобы не загрязнять ответ
      delete task.invoice_id;
      delete task.invoice_filename;
      delete task.invoice_originalname;
      delete task.invoice_type;
      delete task.invoice_description;

      return {
        ...task,
        has_invoice: hasInvoice,
        invoice
      };
    });

    res.json(tasksWithInvoiceInfo);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получение задачи по ID
exports.getTask = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Некорректный ID задачи' });
    }

    const task = await db('tasks')
      .select('*')
      .where("id", id)
      .first();

    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Получаем накладную из таблицы files
    const invoice = await db('files')
      .where({
        entity_type: 'invoice',
        entity_id: task.id
      })
      .first();

    if (invoice) {
      task.has_invoice = true;
      task.invoice = {
        id: invoice.id,
        filename: invoice.file_path,
        originalname: invoice.file_name,
        type: invoice.file_type,
        description: invoice.description,
        path: `/files/invoice/${invoice.file_path}`, // или через fileController.getEntityPath
        url: `/api/files/invoice/${invoice.file_path}`
      };
    } else {
      task.has_invoice = false;
    }
    console.log(task)

    res.json(task);
  } catch (error) {
    console.error('Ошибка при получении задачи:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении задачи' });
  }
};

// Создание новой задачи
exports.addTask = async (req, res) => {
  console.log(req.body)
  const {
    title,
    description,
    phone,
    customer,
    start_date,
    due_date,
    location,
    addressNote
  } = req.body;

  try {
    const taskData = {
      title: title || '',
      description: description || '',
      phone: phone || '',
      customer: customer || '',
      start_date: start_date || new Date(),
      due_date: due_date || new Date(),
      addressNote: addressNote || '',
      status: 'new',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Добавляем координаты если есть
    if (location) {
      taskData.latitude = location.latitude;
      taskData.longitude = location.longitude;
      taskData.address = location.address;
    }

    const [id] = await db('tasks')
      .insert(taskData)
      .returning('id');

    res.status(201).json({
      success: true,
      message: 'Задача успешно создана',
      taskId: id.id || id
    });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Ошибка при создании задачи' });
  }
};

// Обновление задачи
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    phone,
    customer,
    start_date,
    due_date,
    location,
    addressNote
  } = req.body;

  try {
    const updateData = {
      title: title || '',
      description: description || '',
      phone: phone || '',
      customer: customer || '',
      start_date: start_date || null,
      due_date: due_date || null,
      addressNote: addressNote || '',
      updated_at: new Date()
    };

    // Добавляем координаты если есть
    if (location) {
      updateData.latitude = location.latitude;
      updateData.longitude = location.longitude;
      updateData.address = location.address;
    }

    const result = await db('tasks')
      .where({ id })
      .update(updateData);

    if (result === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    res.status(200).json({
      success: true,
      message: 'Задача успешно обновлена'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Ошибка при обновлении задачи' });
  }
};

// Обновление статуса задачи
exports.updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Проверяем существование задачи
    const task = await db('tasks').where({ id }).first();
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Проверяем валидность статуса
    const validStatuses = ['new', 'in_progress', 'completed', 'report_added', 'accepted_by_customer', 'rejected', 'cancelled','paused'];
  console.log(validStatuses.includes(status));

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Неверный статус',
        valid_statuses: validStatuses
      });
    }

    // Проверяем, можно ли изменить статус
    const validStatusTransitions = {
      'new': ['in_progress', 'completed', 'cancelled'],
      'in_progress': ['completed', 'cancelled', 'paused'],
      'paused': ['in_progress', ],
      'completed': ['report_added'],
      'report_added': ['accepted_by_customer', 'rejected'],
      'accepted_by_customer': [],
      'rejected': ['in_progress'],
      'cancelled': []
    };

    if (!validStatusTransitions[task.status]?.includes(status)) {
      return res.status(400).json({
        error: `Невозможно изменить статус с "${task.status}" на "${status}"`,
        current_status: task.status,
        allowed_statuses: validStatusTransitions[task.status] || []
      });
    }

    // Начинаем транзакцию, чтобы гарантировать целостность при удалении отчета
    const trx = await db.transaction();

    try {
      // Если статус меняется на 'rejected', нужно удалить отчет и его файлы
      if (status === 'rejected') {
        // Проверяем, есть ли отчет для этой задачи
        const report = await trx('reports')
          .where({ task_id: id })
          .first();

        if (report) {
          // Удаляем все файлы, связанные с отчетом, из таблицы files и файловой системы
          // Используем вспомогательную функцию из fileController
          await fileController.deleteEntityFiles('report', report.id, trx);

          // Удаляем сам отчет
          await trx('reports')
            .where({ id: report.id })
            .del();
        }
      }

      // Обновляем статус задачи
      const result = await trx('tasks')
        .where({ id })
        .update({
          status,
          updated_at: new Date()
        });

      // Коммитим транзакцию
      await trx.commit();

      res.status(200).json({
        success: true,
        message: 'Статус задачи успешно обновлен',
        old_status: task.status,
        new_status: status
      });
    } catch (error) {
      // Откатываем транзакцию при любой ошибке
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса задачи' });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const trx = await db.transaction();

    try {
      // Получаем задачу
      const task = await trx('tasks')
        .where({ id })
        .first();

      if (!task) {
        await trx.rollback();
        return res.status(404).json({ error: 'Задача не найдена' });
      }

      const files = await trx('files')
        .where({ task_id: id })
        .select('*');

      for (const file of files) {
        const filePath = path.join(fileController.getEntityDirectory(file.entity_type), file.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      await trx('files')
        .where({ task_id: id })
        .del();

      const report = await trx('reports')
        .where({ task_id: id })
        .first();

      if (report) {
        await fileController.deleteEntityFiles('report', report.id, trx);
        await trx('reports')
          .where({ id: report.id })
          .del();
      }

      await trx('comments')
        .where({ task_id: id })
        .del();

      await trx('task_materials')
        .where({ task_id: id })
        .del();

      await trx('tasks')
        .where({ id })
        .del();

      await trx.commit();

      res.status(200).json({
        success: true,
        message: 'Задача и все связанные данные успешно удалены'
      });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Ошибка при удалении задачи' });
  }
};

exports.downloadTaskArchive = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get task details
    const task = await db('tasks').where({ id }).first();
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // 2. Get materials
    const materials = await db('task_materials as tm')
      .select(
        'tm.*',
        'am.name as material_name',
        'am.unit as material_unit'
      )
      .leftJoin('available_materials as am', 'tm.material_id', 'am.id')
      .where('tm.task_id', id)
      .orderBy('tm.created_at', 'asc');

    // 3. Get comments with user names
    const comments = await db('comments')
      .select('comments.*', 'users.username as user_name')
      .leftJoin('users', 'comments.user_id', 'users.id')
      .where('comments.task_id', id)
      .orderBy('comments.created_at', 'asc');

    // 4. Get all files associated with this task
    const files = await db('files')
      .select('*')
      .where({ task_id: id })
      .orderBy('created_at', 'asc');

    // Group files by comment ID (for comments.txt)
    const filesByComment = {};
    files.forEach(file => {
      if (file.entity_type === 'comment' && file.entity_id) {
        if (!filesByComment[file.entity_id]) filesByComment[file.entity_id] = [];
        filesByComment[file.entity_id].push(file);
      }
    });

    // Create a temporary directory for Excel file
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const excelPath = path.join(tempDir, `materials_${id}.xlsx`);

    // 5. Generate Excel for materials
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Материалы');
    worksheet.columns = [
      { header: '#', key: 'index', width: 5 },
      { header: 'Материал', key: 'name', width: 30 },
      { header: 'Ед. изм.', key: 'unit', width: 15 },
      { header: 'Количество', key: 'quantity', width: 12 },
      { header: 'Примечание', key: 'note', width: 30 },
    ];
    materials.forEach((m, idx) => {
      worksheet.addRow({
        index: idx + 1,
        name: m.material_name || m.custom_name || 'Кастомный',
        unit: m.material_unit || m.custom_unit || '-',
        quantity: m.quantity,
        note: m.note || '',
      });
    });
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEF8810' },
    };
    await workbook.xlsx.writeFile(excelPath);

    // 6. Prepare archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const zipFilename = `task_${task.id}_${task.title.replace(/[^a-zа-я0-9]/gi, '_')}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFilename)}"`);
    archive.pipe(res);

    // Add task info as text
    const taskInfo = `
=== ИНФОРМАЦИЯ О ЗАДАЧЕ ===
ID: ${task.id}
Название: ${task.title}
Клиент: ${task.customer}
Телефон: ${task.phone}
Адрес: ${task.address || 'Не указан'}
Примечание к адресу: ${task.addressNote || 'Нет'}
Дата начала: ${new Date(task.start_date).toLocaleString()}
Дата окончания: ${new Date(task.due_date).toLocaleString()}
Статус: ${task.status}
Создана: ${new Date(task.created_at).toLocaleString()}
Обновлена: ${new Date(task.updated_at).toLocaleString()}
Описание: ${task.description || 'Нет'}
`;
    archive.append(taskInfo, { name: 'task_info.txt' });

    // Build comments text with attached files info
    const commentsText = comments.map(c => {
      const commentFiles = filesByComment[c.id] || [];
      let filesInfo = '';
      if (commentFiles.length) {
        filesInfo = '\n\nПрикреплённые файлы:\n' + commentFiles.map(f => {
          const displayName = f.description || f.file_name;
          return `  - ${displayName}`;
        }).join('\n');
      }
      return `[${new Date(c.created_at).toLocaleString()}] ${c.user_name || 'Пользователь'}:\n${c.content}${filesInfo}\n${'-'.repeat(40)}`;
    }).join('\n\n');
    archive.append(commentsText || 'Нет комментариев', { name: 'comments.txt' });

    // Add materials Excel
    archive.file(excelPath, { name: `materials.xlsx` });

    // 7. Add all files with duplicate name handling
    const nameCounters = {}; // { folderPath: { baseName: count } }

    for (const file of files) {
      try {
        const dir = fileController.getEntityDirectory(file.entity_type);
        const filePath = path.join(dir, file.file_path);
        if (fs.existsSync(filePath)) {
          // Determine display name (description if exists, else file_name)
          const displayName = file.description || file.file_name;
          const ext = path.extname(file.file_name);
          const baseName = displayName.replace(/\.[^/.]+$/, ''); // remove existing extension

          // Determine folder path
          let folder;
          if (file.entity_type === 'comment') {
            folder = `comments/comment_${file.entity_id}`;
          } else {
            folder = file.entity_type === 'report' ? 'reports' :
                     file.entity_type === 'invoice' ? 'invoices' : 'other';
          }

          // Initialize counter for this folder if needed
          if (!nameCounters[folder]) nameCounters[folder] = {};

          // Get current count for this base name
          const counter = nameCounters[folder][baseName] || 0;
          const newCounter = counter + 1;
          nameCounters[folder][baseName] = newCounter;

          // Determine final name: if counter > 1, add _counter; first file gets no suffix
          const finalName = baseName + (newCounter > 1 ? `_${newCounter}` : '') + ext;

          // Add file to archive
          archive.file(filePath, { name: `${folder}/${finalName}` });
        } else {
          archive.append(`Файл ${file.file_name} не найден на сервере`, { name: `missing/${file.file_name}.txt` });
        }
      } catch (err) {
        console.error(`Error adding file ${file.file_path}:`, err.message);
        archive.append(`Ошибка добавления файла ${file.file_name}`, { name: `errors/${file.file_name}.txt` });
      }
    }

    // Finalize archive
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Ошибка при создании архива' });
      else res.end();
    });
    archive.finalize();

    // Cleanup temporary Excel file after archiving
    archive.on('finish', () => {
      if (fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
    });

  } catch (error) {
    console.error('Error creating task archive:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка при создании архива' });
    }
  }
};