const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../utils/db');


// ------------------------------------------------------------
// 1. Настройка директорий (абсолютные пути)
// ------------------------------------------------------------
const uploadDir = path.resolve(__dirname, '../uploads'); // абсолютный путь
const reportsDir = path.join(uploadDir, 'reports');
const invoicesDir = path.join(uploadDir, 'invoices');
const commentsDir = path.join(uploadDir, 'comments');
const materialsDir = path.join(uploadDir, 'materials');
const infoDir = path.join(uploadDir, 'infos');


const directories = [uploadDir, reportsDir, invoicesDir, commentsDir, materialsDir];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ------------------------------------------------------------
// 2. Вспомогательные функции
// ------------------------------------------------------------
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.3gp', '.mpeg', '.mkv'];
  const documentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.rtf'];
  
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (documentExts.includes(ext)) return 'document';
  return 'other';
};

const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.3gp': 'video/3gpp',
    '.mpeg': 'video/mpeg',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

const getEntityDirectory = (entityType) => {
  switch (entityType) {
    case 'report': return reportsDir;
    case 'invoice': return invoicesDir;
    case 'comment': return commentsDir;
    case 'material': return materialsDir;
    case 'info': return infoDir;

    default: return uploadDir;
  }
};

const getEntityPath = (entityType, filename) => {
  switch (entityType) {
    case 'report': return `/files/reports/${filename}`;
    case 'invoice': return `/files/invoices/${filename}`;
    case 'comment': return `/files/comments/${filename}`;
    case 'material': return `/files/materials/${filename}`;
    case 'material': return `/files/info/${filename}`;

    default: return `/files/${filename}`;
  }
};

const allowedEntityTypes = ['report', 'invoice', 'comment', 'material', 'info'];

// ------------------------------------------------------------
// 3. Универсальные методы загрузки (с памятью и записью в БД)
// ------------------------------------------------------------
exports.uploadFile = (req, res) => {
  const upload = multer({ storage: multer.memoryStorage() }).single('file');

  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(500).json({ error: err.message });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const { entity_type, entity_id, description, task_id } = req.body;
    if (!entity_type) {
      return res.status(400).json({ error: 'entity_type обязателен' });
    }

    try {
      const dir = getEntityDirectory(entity_type);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname);
      const filename = uniqueSuffix + ext;
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      const fileData = {
        entity_type,
        entity_id: entity_id || null,
        task_id,
        file_name: req.file.originalname,
        file_path: filename,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        description: description || null,
        uploaded_by: req.user?.id || null,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [fileId] = await db('files').insert(fileData).returning('id');

      const file = {
        id: fileId.id || fileId,
        filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        type: getFileType(filename),
        entity_type,
        entity_id,
        description: description || null,
        path: getEntityPath(entity_type, filename),
        uploaded_by: req.user?.id || null,
        created_at: new Date()
      };

      res.status(200).json({ success: true, file });
    } catch (dbError) {
      console.error('Database error:', dbError);
      const filePath = path.join(getEntityDirectory(entity_type), filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.status(500).json({ error: 'Ошибка при сохранении информации о файле' });
    }
  });
};

exports.uploadMultipleFiles = (req, res) => {
  const upload = multer({ storage: multer.memoryStorage() }).array('files', 10);

  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(500).json({ error: err.message });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файлы не загружены' });
    }

    const { entity_type, entity_id, descriptions, task_id } = req.body;
    if (!entity_type) {
      return res.status(400).json({ error: 'entity_type обязателен' });
    }

    try {
      const dir = getEntityDirectory(entity_type);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const savedFiles = [];
      const descriptionsArray = descriptions ? JSON.parse(descriptions) : [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileDescription = descriptionsArray[i] || null;

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = uniqueSuffix + ext;
        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, file.buffer);

        const fileData = {
          entity_type,
          task_id ,
          entity_id: entity_id || null,
          file_name: file.originalname,
          file_path: filename,
          file_type: file.mimetype,
          file_size: file.size,
          description: fileDescription,
          uploaded_by: req.user?.id || null,
          created_at: new Date(),
          updated_at: new Date()
        };

        const [fileId] = await db('files').insert(fileData).returning('id');

        savedFiles.push({
          id: fileId.id || fileId,
          filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          type: getFileType(filename),
          entity_type,
          entity_id,
          description: fileDescription,
          path: getEntityPath(entity_type, filename)
        });
      }

      res.status(200).json({ success: true, files: savedFiles, count: savedFiles.length });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Упрощённо: не удаляем файлы при ошибке, можно добавить очистку
      res.status(500).json({ error: 'Ошибка при сохранении информации о файлах' });
    }
  });
};

// ------------------------------------------------------------
// 4. Получение файлов
// ------------------------------------------------------------
exports.getFile = async (req, res) => {
  const { entity_type, filename } = req.params;

  if (!allowedEntityTypes.includes(entity_type)) {
    return res.status(400).json({ error: 'Неверный тип сущности' });
  }

  try {
    const dir = getEntityDirectory(entity_type);
    const safeFilename = path.basename(filename);
    const filePath = path.join(dir, safeFilename); // абсолютный путь

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const fileType = getFileType(filename);
    const mimeType = getMimeType(filename);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    if (fileType === 'video') {
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mimeType,
        });
        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
        });
        fs.createReadStream(filePath).pipe(res);
      }
    } else {
      // Для изображений и документов используем sendFile с абсолютным путём
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Ошибка при отправке файла' });
          }
        }
      });
    }
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Ошибка при получении файла' });
  }
};

exports.downloadFile = async (req, res) => {
  const { entity_type, filename } = req.params;

  try {
    const dir = getEntityDirectory(entity_type);
    const filePath = path.join(dir, path.basename(filename));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const fileInfo = await db('files').where({ file_path: filename }).first();
    const mimeType = getMimeType(filename);
    const originalName = fileInfo?.file_name || filename;

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.setHeader('Content-Type', mimeType);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Ошибка при скачивании файла' });
  }
};

exports.getEntityFiles = async (req, res) => {
  const { entity_type, entity_id } = req.params;

  try {
    const files = await db('files')
      .select('*')
      .where({ entity_type, entity_id })
      .orderBy('created_at', 'desc');

    const formattedFiles = files.map(file => ({
      id: file.id,
      filename: file.file_path,
      originalname: file.file_name,
      mimetype: file.file_type,
      size: file.file_size,
      type: getFileType(file.file_path),
      entity_type: file.entity_type,
      entity_id: file.entity_id,
      description: file.description,
      uploaded_by: file.uploaded_by,
      created_at: file.created_at,
      path: getEntityPath(file.entity_type, file.file_path)
    }));

    res.json(formattedFiles);
  } catch (error) {
    console.error('Error getting entity files:', error);
    res.status(500).json({ error: 'Ошибка при получении файлов' });
  }
};
exports.getTaskFiles = async (req, res) => {
  const { task_id } = req.params;

  try {
    const files = await db('files')
      .select('*')
      .where({ task_id})
      .orderBy('created_at', 'desc');

    const formattedFiles = files.map(file => ({
      id: file.id,
      filename: file.file_path,
      originalname: file.file_name,
      mimetype: file.file_type,
      size: file.file_size,
      type: getFileType(file.file_path),
      entity_type: file.entity_type,
      entity_id: file.entity_id,
      description: file.description,
      uploaded_by: file.uploaded_by,
      created_at: file.created_at,
      path: getEntityPath(file.entity_type, file.file_path)
    }));

    res.json(formattedFiles);
  } catch (error) {
    console.error('Error getting entity files:', error);
    res.status(500).json({ error: 'Ошибка при получении файлов' });
  }
};




exports.getFileInfo = async (req, res) => {
  const { id } = req.params;

  try {
    const file = await db('files').where({ id }).first();
    if (!file) return res.status(404).json({ error: 'Файл не найден' });

    res.json({
      id: file.id,
      filename: file.file_path,
      originalname: file.file_name,
      mimetype: file.file_type,
      size: file.file_size,
      type: getFileType(file.file_path),
      entity_type: file.entity_type,
      entity_id: file.entity_id,
      description: file.description,
      uploaded_by: file.uploaded_by,
      created_at: file.created_at,
      path: getEntityPath(file.entity_type, file.file_path)
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: 'Ошибка при получении информации о файле' });
  }
};

// ------------------------------------------------------------
// 5. Обновление и удаление
// ------------------------------------------------------------
exports.updateFile = async (req, res) => {
  const { id } = req.params;
  const { entity_id, description } = req.body;

  try {
    const file = await db('files').where({ id }).first();
    if (!file) return res.status(404).json({ error: 'Файл не найден' });

    const updateData = {};
    if (entity_id !== undefined) updateData.entity_id = entity_id;
    if (description !== undefined) updateData.description = description;
    updateData.updated_at = new Date();

    await db('files').where({ id }).update(updateData);
    const updated = await db('files').where({ id }).first();

    res.json({ success: true, message: 'Файл обновлен', file: updated });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Ошибка при обновлении файла' });
  }
};

exports.deleteFile = async (req, res) => {
  const { id } = req.params;

  try {
    const file = await db('files').where({ id }).first();
    if (!file) return res.status(404).json({ error: 'Файл не найден' });

    const filePath = path.join(getEntityDirectory(file.entity_type), file.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db('files').where({ id }).del();

    res.json({ success: true, message: 'Файл успешно удален' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Ошибка при удалении файла' });
  }
};

exports.deleteEntityFiles = async (entity_type, entity_id, trx = db) => {
  try {
    const files = await trx('files').where({ entity_type, entity_id }).select('*');
    for (const file of files) {
      const filePath = path.join(getEntityDirectory(entity_type), file.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await trx('files').where({ entity_type, entity_id }).del();
    return files.length;
  } catch (error) {
    console.error('Error deleting entity files:', error);
    throw error;
  }
};



// ------------------------------------------------------------
// 7. Экспорт вспомогательных функций (для использования в других контроллерах)
// ------------------------------------------------------------
exports.getFileType = getFileType;
exports.getMimeType = getMimeType;
exports.getEntityPath = getEntityPath; 
exports.getEntityDirectory = getEntityDirectory;