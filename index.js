require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const reportRoutes = require('./routes/reports');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public/views')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));

app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/dashboard.html'));
});

app.get('/add-student', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/add-student.html'));
});

app.get('/attendance', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/attendance.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/search.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/reports.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'خطأ في الخادم!' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'الصفحة غير موجودة' });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network: http://192.168.100.11:${PORT}`);
  console.log(`📚 Students API: http://192.168.100.11:${PORT}/api/students`);
  console.log(`✅ Attendance API: http://192.168.100.11:${PORT}/api/attendance`);
  console.log(`📄 Reports API: http://192.168.100.11:${PORT}/api/reports`);
});

module.exports = app;
