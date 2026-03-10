
const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// Get day name in Arabic
function getDayName(date) {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}

// Check if day is Thursday or Friday
function isValidDay(date) {
  const day = date.getDay();
  return day === 4 || day === 5; // Thursday or Friday
}

// Get current week number
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Mark attendance by student code
router.post('/mark', (req, res) => {
  try {
    const { code, part } = req.body;
    const now = new Date();
    
    // Check if it's Thursday or Friday
    if (!isValidDay(now)) {
      return res.status(400).json({ 
        success: false, 
        message: 'لا يمكن تسجيل الحضور اليوم. أيام التسجيل: الخميس والجمعة فقط' 
      });
    }
    
    if (!part || (part !== '1' && part !== '2')) {
      return res.status(400).json({ 
        success: false, 
        message: 'يرجى اختيار الجزء (1 أو 2)' 
      });
    }
    
    const students = db.getStudents();
    const student = students.find(s => s.code === code);
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'كود الطالب غير صحيح' 
      });
    }
    
    const attendance = db.getAttendance();
    const dateStr = now.toISOString().split('T')[0];
    
    // Check if already marked today for this part
    const existingRecord = attendance.find(
      a => a.studentId === student._id && 
           a.date === dateStr && 
           a.part === part
    );
    
    if (existingRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'تم تسجيل حضور هذا الطالب بالفعل' 
      });
    }
    
    // Create new attendance record
    const newRecord = {
      _id: Date.now().toString(),
      studentId: student._id,
      studentName: student.name,
      studentCode: student.code,
      day: getDayName(now),
      part: part,
      partName: part === '1' ? 'تسبحة + محاضرة 1' : 'قداس + محاضرة 2',
      date: dateStr,
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      fullDate: now.toISOString(),
      week: getWeekNumber(now),
      status: 'present'
    };
    
    attendance.push(newRecord);
    db.saveAttendance(attendance);
    
    res.json({ 
      success: true, 
      data: newRecord,
      message: `تم تسجيل حضور ${student.name} بنجاح` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get today's attendance
router.get('/today', (req, res) => {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const attendance = db.getAttendance();
    
    const todayRecords = attendance.filter(a => a.date === dateStr);
    const presentCount = todayRecords.filter(a => a.status === 'present').length;
    
    res.json({
      success: true,
      data: {
        records: todayRecords,
        present: presentCount,
        isValidDay: isValidDay(now),
        dayName: getDayName(now)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Auto-mark absent students for today
router.post('/auto-absent', (req, res) => {
  try {
    const now = new Date();
    
    if (!isValidDay(now)) {
      return res.status(400).json({ 
        success: false, 
        message: 'اليوم ليس يوم خميس أو جمعة' 
      });
    }
    
    const students = db.getStudents();
    const attendance = db.getAttendance();
    const dateStr = now.toISOString().split('T')[0];
    const dayName = getDayName(now);
    const week = getWeekNumber(now);
    
    let addedCount = 0;
    
    students.forEach(student => {
      // Check for part 1
      const existingPart1 = attendance.find(
        a => a.studentId === student._id && a.date === dateStr && a.part === '1'
      );
      if (!existingPart1) {
        attendance.push({
          _id: Date.now().toString() + '_p1_' + student._id,
          studentId: student._id,
          studentName: student.name,
          studentCode: student.code,
          day: dayName,
          part: '1',
          partName: 'تسبحة + محاضرة 1',
          date: dateStr,
          time: '-',
          fullDate: now.toISOString(),
          week: week,
          status: 'absent'
        });
        addedCount++;
      }
      
      // Check for part 2
      const existingPart2 = attendance.find(
        a => a.studentId === student._id && a.date === dateStr && a.part === '2'
      );
      if (!existingPart2) {
        attendance.push({
          _id: Date.now().toString() + '_p2_' + student._id,
          studentId: student._id,
          studentName: student.name,
          studentCode: student.code,
          day: dayName,
          part: '2',
          partName: 'قداس + محاضرة 2',
          date: dateStr,
          time: '-',
          fullDate: now.toISOString(),
          week: week,
          status: 'absent'
        });
        addedCount++;
      }
    });
    
    db.saveAttendance(attendance);
    
    res.json({ 
      success: true, 
      message: `تم تسجيل ${addedCount} حالة غياب تلقائياً` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all attendance
router.get('/', (req, res) => {
  try {
    const attendance = db.getAttendance();
    res.json({ success: true, data: attendance.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get statistics
router.get('/stats', (req, res) => {
  try {
    const students = db.getStudents();
    const attendance = db.getAttendance();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    const todayPresent = attendance.filter(
      a => a.date === dateStr && a.status === 'present'
    ).length;
    
    const todayAbsent = attendance.filter(
      a => a.date === dateStr && a.status === 'absent'
    ).length;
    
    // Most absent students
    const absentCounts = {};
    attendance.filter(a => a.status === 'absent').forEach(a => {
      absentCounts[a.studentId] = (absentCounts[a.studentId] || 0) + 1;
    });
    
    const sortedAbsent = Object.entries(absentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const mostAbsent = sortedAbsent.map(([id, count]) => {
      const student = students.find(s => s._id === id);
      return student ? { name: student.name, code: student.code, count } : null;
    }).filter(Boolean);
    
    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        todayPresent,
        todayAbsent,
        mostAbsent,
        isValidDay: isValidDay(now),
        dayName: getDayName(now)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance by week
router.get('/week/:week', (req, res) => {
  try {
    const { week } = req.params;
    const attendance = db.getAttendance();
    
    const weekRecords = attendance.filter(a => a.week === parseInt(week));
    res.json({ success: true, data: weekRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
