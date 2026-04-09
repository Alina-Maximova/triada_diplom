const db = require('../utils/db');
const fs = require('fs');
const path = require('path');
const fileController = require('./fileController');
const archiver = require('archiver');

// Создание отчета
exports.createReport = async (req, res) => {
  const { task_id, description } = req.body; // file_ids не передаются, файлы будут прикреплены позже

  try {
    // Проверяем, существует ли задача
    const task = await db('tasks').where({ id: task_id }).first();
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Проверяем, что задача имеет статус "completed"
    if (task.status !== 'completed') {
      return res.status(400).json({
        error: 'Отчет можно создать только для выполненной задачи',
        current_status: task.status
      });
    }

    // Проверяем, не создан ли уже отчет для этой задачи
    const existingReport = await db('reports').where({ task_id }).first();
    if (existingReport) {
      return res.status(400).json({ error: 'Отчет для этой задачи уже существует' });
    }

    // Начинаем транзакцию
    const trx = await db.transaction();

    try {
      // Создаем отчет
      const [reportId] = await trx('reports')
        .insert({
          task_id,
          description: description || '',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('id');

      // Обновляем статус задачи
      await trx('tasks')
        .where({ id: task_id })
        .update({
          status: 'report_added',
          updated_at: new Date()
        });

      await trx.commit();

      // Получаем созданный отчет (без файлов)
      const newReport = await db('reports')
        .where({ id: reportId.id || reportId })
        .first();

      res.status(201).json({
        success: true,
        message: 'Отчет создан успешно',
        report: {
          ...newReport,
          files: [] // файлы будут добавлены позже
        }
      });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Ошибка при создании отчета' });
  }
};

// Получение всех отчетов
exports.getReports = async (req, res) => {
  try {
    const reports = await db('reports')
      .select(
        'reports.*',
        'tasks.title as task_title',
        'tasks.customer',
        'tasks.address',
        'tasks.phone',
        'tasks.description as task_description',
        'tasks.start_date',
        'tasks.due_date',
        'tasks.status as task_status'
      )
      .leftJoin('tasks', 'reports.task_id', 'tasks.id')
      .whereIn('tasks.status', ['completed', 'report_added', 'accepted_by_customer'])
      .orderBy('reports.created_at', 'desc');

    // Получаем файлы для каждого отчета из таблицы files
    for (let report of reports) {
      const files = await db('files')
        .select('*')
        .where({ entity_type: 'report', entity_id: report.id })
        .orderBy('created_at', 'desc');

      report.files = files.map(f => ({
        id: f.id,
        filename: f.file_path,
        originalname: f.file_name,
        mimetype: f.file_type,
        size: f.file_size,
        description: f.description,
        type: fileController.getFileType(f.file_path),
        path: fileController.getEntityPath('report', f.file_path),
        uploaded_by: f.uploaded_by,
        created_at: f.created_at
      }));
    }

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Ошибка при получении отчетов' });
  }
};


// Получение отчета по ID задачи
exports.getReportByTaskId = async (req, res) => {
  const { task_id } = req.params;

  try {
    // Сначала проверяем статус задачи
    const task = await db('tasks').where({ id: task_id }).first();
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Если задача не выполнена и нет отчета, не ищем отчет
    if (task.status !== 'completed' && task.status !== 'report_added' && task.status !== 'accepted_by_customer') {
      return res.status(404).json({
        error: 'Отчет не найден (задача не имеет подходящего статуса)',
        task_status: task.status
      });
    }

    const report = await db('reports')
      .select(
        'reports.*',
        'tasks.title as task_title',
        'tasks.customer',
        'tasks.address',
        'tasks.phone',
        'tasks.description as task_description',
        'tasks.start_date',
        'tasks.due_date',
        'tasks.status as task_status'
      )
      .leftJoin('tasks', 'reports.task_id', 'tasks.id')
      .where('reports.task_id', task_id)
      .first();

    if (!report) {
      return res.status(404).json({ error: 'Отчет не найден' });
    }

    // Получаем файлы отчета
    const files = await db('files')
      .select('*')
      .where({ entity_type: 'report', entity_id: report.id })
      .orderBy('created_at', 'desc');

    report.files = files.map(f => ({
      id: f.id,
      filename: f.file_path,
      originalname: f.file_name,
      mimetype: f.file_type,
      size: f.file_size,
      description: f.description,
      type: fileController.getFileType(f.file_path),
      path: fileController.getEntityPath('report', f.file_path),
      uploaded_by: f.uploaded_by,
      created_at: f.created_at
    }));

    res.json(report);
  } catch (error) {
    console.error('Error fetching report by task ID:', error);
    res.status(500).json({ error: 'Ошибка при получении отчета' });
  }
};

// Получение отчета по ID
exports.getReportById = async (req, res) => {
  const { id } = req.params;

  try {
    const report = await db('reports')
      .select(
        'reports.*',
        'tasks.title as task_title',
        'tasks.customer',
        'tasks.address',
        'tasks.addressNote',
        'tasks.phone',
        'tasks.description as task_description',
        'tasks.start_date',
        'tasks.due_date',
        'tasks.status as task_status'
      )
      .leftJoin('tasks', 'reports.task_id', 'tasks.id')
      .where('reports.id', id)
      .first();

    if (!report) {
      return res.status(404).json({ error: 'Отчет не найден' });
    }

    // Проверяем, что связанная задача имеет подходящий статус
    if (report.task_status !== 'completed' && report.task_status !== 'report_added' && report.task_status !== 'accepted_by_customer') {
      return res.status(404).json({
        error: 'Отчет не найден (связанная задача не имеет подходящего статуса)',
        task_status: report.task_status
      });
    }

    // Получаем файлы отчета
    const files = await db('files')
      .select('*')
      .where({ entity_type: 'report', entity_id: report.id })
      .orderBy('created_at', 'desc');

    report.files = files.map(f => ({
      id: f.id,
      filename: f.file_path,
      originalname: f.file_name,
      mimetype: f.file_type,
      size: f.file_size,
      description: f.description,
      type: fileController.getFileType(f.file_path),
      path: fileController.getEntityPath('report', f.file_path),
      uploaded_by: f.uploaded_by,
      created_at: f.created_at
    }));

    res.json(report);
  } catch (error) {
    console.error('Error fetching report by ID:', error);
    res.status(500).json({ error: 'Ошибка при получении отчета' });
  }
};

// Удаление отчета
exports.deleteReport = async (req, res) => {
  const { id } = req.params;

  try {
    // Начинаем транзакцию
    const trx = await db.transaction();

    try {
      // Проверяем существование отчета
      const report = await trx('reports').where({ id }).first();
      if (!report) {
        await trx.rollback();
        return res.status(404).json({ error: 'Отчет не найден' });
      }

      // Удаляем файлы отчета из файловой системы и БД
      await fileController.deleteEntityFiles('report', report.id, trx);

      // Удаляем отчет
      await trx('reports').where({ id }).del();

      // Возвращаем статус задачи на "completed"
      await trx('tasks')
        .where({ id: report.task_id })
        .update({
          status: 'completed',
          updated_at: new Date()
        });

      // Коммитим транзакцию
      await trx.commit();

      res.json({
        success: true,
        message: 'Отчет удален успешно',
        task_status: 'completed'
      });
    } catch (error) {
      // Откатываем транзакцию в случае ошибки
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Ошибка при удалении отчета' });
  }
};

// Обновление отчета (опционально, можно оставить для совместимости, но обычно отчеты не обновляются)
exports.updateReport = async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  try {
    // Проверяем существование отчета
    const existingReport = await db('reports').where({ id }).first();
    if (!existingReport) {
      return res.status(404).json({ error: 'Отчет не найден' });
    }

    // Обновляем описание отчета
    await db('reports')
      .where({ id })
      .update({
        description: description || '',
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'Отчет обновлен успешно'
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Ошибка при обновлении отчета' });
  }
};

// Скачивание отчета в виде архива
exports.downloadReportArchive = async (req, res) => {
  const { id } = req.params;

  try {
    // Получаем отчет с информацией о задаче
    const report = await db('reports')
      .select('reports.*', 'tasks.title as task_title', 'tasks.customer', 'tasks.phone')
      .leftJoin('tasks', 'reports.task_id', 'tasks.id')
      .where('reports.id', id)
      .first();

    if (!report) {
      return res.status(404).json({ error: 'Отчет не найден' });
    }

    // Получаем файлы отчета из таблицы files
    const files = await db('files')
      .select('*')
      .where({ entity_type: 'report', entity_id: id });

    // Создаем архив
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', function(err) {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Ошибка при создании архива' });
      } else {
        res.end();
      }
    });

    // Очищаем имя файла от недопустимых символов
    const cleanFileName = (report.task_title || 'report')
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .substring(0, 100);

    const filename = `отчет_${report.id}_${cleanFileName}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    archive.pipe(res);

    // Добавляем информацию об отчете в текстовый файл
    const reportInfo = `ОТЧЕТ #${report.id}\n\n` +
      `Задача: ${report.task_title}\n` +
      `Заказчик: ${report.customer}\n` +
      `Телефон: ${report.phone}\n` +
      `Описание: ${report.description || 'Нет описания'}\n` +
      `Дата создания: ${report.created_at}\n\n` +
      `Файлов: ${files.length}\n` +
      `Список файлов:\n${files.map((f, i) => `${i + 1}. ${f.file_name} (${(f.file_size / 1024).toFixed(1)} KB) - ${f.description || 'без описания'}`).join('\n')}`;

    archive.append(reportInfo, { name: 'report_info.txt' });

    // Добавляем файлы в архив
    for (const file of files) {
      try {
        const dir = fileController.getEntityDirectory('report');
        const filePath = path.join(dir, file.file_path);
        if (fs.existsSync(filePath)) {
          // Безопасное имя файла внутри архива
          const safeFileName = file.file_name.replace(/[<>:"/\\|?*]/g, '_');
          archive.file(filePath, { name: `media/${safeFileName}` });
        } else {
          archive.append(`Файл ${file.file_name} не найден`, { name: `missing/${file.file_name}.txt` });
        }
      } catch (fileError) {
        console.error('Ошибка при добавлении файла:', fileError.message);
      }
    }

    await archive.finalize();
    console.log('Архив успешно создан');
  } catch (error) {
    console.error('Error creating archive:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка при создании архива' });
    }
  }
};;