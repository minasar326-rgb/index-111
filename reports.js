const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

router.get('/word', (req, res) => {
  try {
    const { week } = req.query;
    const students = db.getStudents();
    const attendance = db.getAttendance();
    
    let records = attendance;
    if (week) {
      records = attendance.filter(a => a.week === parseInt(week));
    }
    
    const weeks = [...new Set(records.map(r => r.week))].sort((a, b) => a - b);
    
    let html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>تقرير الحضور والغياب</title>
    <style>
        body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
        h1 { text-align: center; color: #2c3e50; }
        h2 { color: #3498db; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
        th { background-color: #3498db; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .present { color: green; font-weight: bold; }
        .absent { color: red; font-weight: bold; }
        .summary { background-color: #ecf0f1; padding: 10px; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>📋 تقرير الحضور والغياب</h1>
    <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>`;
    
    weeks.forEach(w => {
      const weekRecords = records.filter(r => r.week === w);
      html += `<h2>الأسبوع ${w}</h2>
        <table>
        <tr><th>اسم الطالب</th><th>الكود</th><th>اليوم</th><th>الجزء</th><th>التاريخ</th><th>الوقت</th><th>الحالة</th></tr>`;
      
      weekRecords.forEach(r => {
        const statusClass = r.status === 'present' ? 'present' : 'absent';
        const statusText = r.status === 'present' ? 'حاضر' : 'غائب';
        html += `<tr><td>${r.studentName}</td><td>${r.studentCode}</td><td>${r.day}</td><td>${r.partName}</td><td>${r.date}</td><td>${r.time}</td><td class="${statusClass}">${statusText}</td></tr>`;
      });
      
      html += `</table>`;
      const present = weekRecords.filter(r => r.status === 'present').length;
      const absent = weekRecords.filter(r => r.status === 'absent').length;
      html += `<div class="summary"><strong>ملخص الأسبوع ${w}:</strong> عدد الحضور: ${present} | عدد الغياب: ${absent}</div>`;
    });
    
    html += `</body></html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=تقرير_الحضور.html');
    res.send(html);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/weeks', (req, res) => {
  try {
    const attendance = db.getAttendance();
    const weeks = [...new Set(attendance.map(r => r.week))].sort((a, b) => b - a);
    res.json({ success: true, data: weeks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/all', (req, res) => {
  try {
    const attendance = db.getAttendance();
    const students = db.getStudents();
    const enrichedRecords = attendance.map(r => {
      if (!r.studentName) {
        const student = students.find(s => s._id === r.studentId);
        return { ...r, studentName: student?.name || 'غير معروف', studentCode: student?.code || '' };
      }
      return r;
    });
    res.json({ success: true, data: enrichedRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
