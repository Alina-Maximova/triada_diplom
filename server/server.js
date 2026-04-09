const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const fileRoutes = require('./routes/file');
const reportRoutes = require('./routes/reports');
const commonRoutes = require('./routes/comments');
const materialRoutes = require('./routes/material');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS настройки (оставляем как есть)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
    'X-Requested-With',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Дополнительный middleware для CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent'
  );
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// API маршруты
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/reports', reportRoutes);
app.use('/files', fileRoutes);
app.use('/comments', commonRoutes);
app.use('/materials', materialRoutes);
app.use('/uploads', express.static('uploads'));

// Тестовый endpoint для мобильных устройств
app.get('/mobile-test', (req, res) => {
  res.json({ 
    success: true,
    message: '✅ Mobile connection successful!',
    timestamp: new Date().toISOString(),
    client: {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin
    }
  });
});

// Корневой маршрут (для информации)
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running successfully!',
    status: 'OK',
    mobile: 'Mobile support enabled',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/auth',
      '/tasks',
      '/files',
      '/reports',
      '/comments',
      '/materials',
      '/mobile-test'
    ]
  });
});

// Статические файлы сборки React
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// Catch-all: для всех остальных запросов отдаём index.html (для клиентского роутинга)
// Используем app.use, который не требует параметра пути с *
app.use((req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Запуск
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Network: http://0.0.0.0:${PORT}`);
  console.log(`📱 Mobile test: http://194.87.238.237:${PORT}/mobile-test`);
  console.log(`🌐 CORS: Enabled for all domains`);
});