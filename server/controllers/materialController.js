const db = require('../utils/db');
const ExcelJS = require('exceljs');

// Получить все доступные материалы
exports.getAvailableMaterials = async (req, res) => {
  try {
console.log(":lkjhg")
    const materials = await db('available_materials')
      .select('*')
      .orderBy('name', 'asc');

    res.json(materials);
  } catch (error) {
    console.error('Error fetching available materials:', error);
    res.status(500).json({ error: 'Ошибка при получении списка материалов' });
  }
};

// Создать новый материал
exports.createMaterial = async (req, res) => {
  try {
    const { name, unit, description } = req.body;

    // Валидация данных
    if (!name || !unit) {
      return res.status(400).json({ 
        error: 'Название и единица измерения обязательны' 
      });
    }

    // Проверяем нет ли уже материала с таким названием
    const existingMaterial = await db('available_materials')
      .where('name', 'ilike', name)
      .first();

    if (existingMaterial) {
      return res.status(400).json({ 
        error: 'Материал с таким названием уже существует' 
      });
    }

    // Создаем материал
    const [material] = await db('available_materials')
      .insert({
        name,
        unit,
        description: description || null,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('*');

    res.status(201).json(material);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ error: 'Ошибка при создании материала' });
  }
};

// Обновить материал
exports.updateMaterial = async (req, res) => {
  try {
    console.log(req.body)
    const { id } = req.params;
    const { name, unit, description } = req.body;

    console.log('Updating material with ID:', id);
    console.log('Update data:', { name, unit, description });

    // Валидация данных
    if (!name || !unit) {
      return res.status(400).json({ 
        error: 'Название и единица измерения обязательны' 
      });
    }

    // Проверяем существование материала
    const existingMaterial = await db('available_materials')
      .where({ id })
      .first();

    if (!existingMaterial) {
      console.log('Material not found with ID:', id);
      return res.status(404).json({ 
        error: 'Материал не найден' 
      });
    }

    console.log('Found existing material:', existingMaterial);

    // Проверяем нет ли другого материала с таким же названием (исключая текущий)
    if (name !== existingMaterial.name) {
      const duplicateMaterial = await db('available_materials')
        .where('name', 'ilike', name)
        .whereNot({ id })
        .first();

      if (duplicateMaterial) {
        console.log('Duplicate material found:', duplicateMaterial);
        return res.status(400).json({ 
          error: 'Материал с таким названием уже существует' 
        });
      }
    }

    // Обновляем материал
    const [updatedMaterial] = await db('available_materials')
      .where({ id })
      .update({
        name,
        unit,
        description: description || null,
        updated_at: db.fn.now()
      })
      .returning('*');

    console.log('Material updated successfully:', updatedMaterial);
    res.json(updatedMaterial);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Ошибка при обновлении материала' });
  }
};

// Удалить материал
exports.deleteMaterial = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Проверяем существует ли материал
    const material = await db('available_materials')
      .where({ id })
      .first();
      
    if (!material) {
      return res.status(404).json({ error: 'Материал не найден' });
    }

    // Проверяем, используется ли материал в задачах
    const usedInTasks = await db('task_materials')
      .where({ material_id: id })
      .first();

    if (usedInTasks) {
      return res.status(400).json({ 
        error: 'Нельзя удалить материал, который используется в задачах' 
      });
    }

    // Удаляем материал
    await db('available_materials')
      .where({ id })
      .del();
    
    res.status(200).json({ 
      success: true, 
      message: 'Материал успешно удален' 
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Ошибка при удалении материала' });
  }
};

// Получить материалы задачи
exports.getTaskMaterials = async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log(taskId)
    
    // Проверяем существует ли задача
    const task = await db('tasks').where({ id: taskId }).first();
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Получаем материалы задачи с информацией о материале
    const materials = await db('task_materials as tm')
      .select(
        'tm.*',
        'am.name as material_name',
        'am.unit as material_unit',
        'am.description as material_description'
      )
      .leftJoin('available_materials as am', 'tm.material_id', 'am.id')
      .where('tm.task_id', taskId)
      .orderBy('tm.created_at', 'desc');

    // Получаем все доступные материалы
    const availableMaterials = await db('available_materials')
      .select('*')
      .orderBy('name', 'asc');

    res.json({
      materials,
      available_materials: availableMaterials
    });
  } catch (error) {
    console.error('Error fetching task materials:', error);
    res.status(500).json({ error: 'Ошибка при получении материалов' });
  }
};

// Добавить материал к задаче
exports.addMaterialToTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { material_id, custom_name, custom_unit, quantity, note } = req.body;

    // Проверяем существует ли задача
    const task = await db('tasks').where({ id: taskId }).first();
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Проверяем что задача в работе
    if (task.status !== 'in_progress') {
      return res.status(400).json({ 
        error: 'Материалы можно добавлять только к задачам в работе' 
      });
    }

    // Валидация данных
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        error: 'Укажите количество материала' 
      });
    }

    // Проверяем что указан либо material_id, либо custom_name
    if (!material_id && !custom_name) {
      return res.status(400).json({ 
        error: 'Укажите материал или введите название кастомного материала' 
      });
    }

    // Если указан material_id, проверяем существует ли материал
    if (material_id) {
      const material = await db('available_materials').where({ id: material_id }).first();
      if (!material) {
        return res.status(404).json({ error: 'Материал не найден' });
      }
    }

    // Если кастомный материал, проверяем unit
    if (custom_name && !custom_unit) {
      return res.status(400).json({ 
        error: 'Для кастомного материала укажите единицу измерения' 
      });
    }

    // Добавляем материал к задаче
    const [taskMaterial] = await db('task_materials')
      .insert({
        task_id: taskId,
        material_id: material_id || null,
        custom_name: custom_name || null,
        custom_unit: custom_unit || null,
        quantity,
        note: note || null,
        created_at: db.fn.now()
      })
      .returning('*');

    // Получаем полную информацию о материале
    let result = taskMaterial;
    if (material_id) {
      const material = await db('available_materials').where({ id: material_id }).first();
      result = {
        ...taskMaterial,
        material_name: material.name,
        material_unit: material.unit,
        material_description: material.description
      };
    } else {
      result = {
        ...taskMaterial,
        material_name: custom_name,
        material_unit: custom_unit
      };
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding material to task:', error);
    res.status(500).json({ error: 'Ошибка при добавлении материала' });
  }
};

// Удалить материал из задачи
exports.removeMaterialFromTask = async (req, res) => {
  try {
    const { taskMaterialId } = req.params;

    // Удаляем материал из задачи
    const deleted = await db('task_materials')
      .where({ id: taskMaterialId })
      .del();

    if (!deleted) {
      return res.status(404).json({ error: 'Материал не найден' });
    }

    res.json({ success: true, message: 'Материал удален из задачи' });
  } catch (error) {
    console.error('Error removing material from task:', error);
    res.status(500).json({ error: 'Ошибка при удалении материала' });
  }
};

// Обновить количество материала
exports.updateMaterialQuantity = async (req, res) => {
  try {
    const { taskMaterialId } = req.params;
    const { quantity } = req.body;
    console.log(taskMaterialId+quantity)

    // Валидация данных
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        error: 'Укажите количество материала' 
      });
    }

    // Обновляем количество
    const [updated] = await db('task_materials')
      .where({ id: taskMaterialId })
      .update({ 
        quantity
      })
      .returning('*');

    if (!updated) {
      return res.status(404).json({ error: 'Материал не найден' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating material quantity:', error);
    res.status(500).json({ error: 'Ошибка при обновлении количества' });
  }
};
exports.exportTaskMaterials = async (req, res) => {
  const { taskId } = req.params;
  try {
    // Проверяем существование задачи
    const task = await db('tasks').where({ id: taskId }).first();
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Получаем материалы задачи
    const materials = await db('task_materials as tm')
      .select(
        'tm.*',
        'am.name as material_name',
        'am.unit as material_unit',
        'am.description as material_description'
      )
      .leftJoin('available_materials as am', 'tm.material_id', 'am.id')
      .where('tm.task_id', taskId)
      .orderBy('tm.created_at', 'asc');

    // Создаём рабочую книгу и лист
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Материалы задачи');

    // Определяем колонки
    worksheet.columns = [
      { header: '№', key: 'index', width: 5 },
      { header: 'Материал', key: 'material_name', width: 30 },
      { header: 'Единица измерения', key: 'unit', width: 15 },
      { header: 'Количество', key: 'quantity', width: 12 },
      { header: 'Примечание', key: 'note', width: 30 },
    ];

    // Заполняем данными
    materials.forEach((material, idx) => {
      worksheet.addRow({
        index: idx + 1,
        material_name: material.material_name || material.custom_name || 'Кастомный',
        unit: material.material_unit || material.custom_unit || '-',
        quantity: material.quantity,
        note: material.note || '',
      });
    });

    // Стилизуем заголовок
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEF8810' },
    };

    // Устанавливаем заголовки ответа
    const filename = `материалы_задачи_${task.title}_${taskId}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    // Отправляем файл
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting task materials:', error);
    res.status(500).json({ error: 'Ошибка при экспорте материалов' });
  }
};