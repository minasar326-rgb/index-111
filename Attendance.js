const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentCode: {
    type: String,
    required: true
  },
  day: {
    type: String,
    required: true
  },
  part: {
    type: String,
    required: true
  },
  partName: {
    type: String
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String
  },
  week: {
    type: Number
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    default: 'present'
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
attendanceSchema.index({ studentId: 1, date: 1, part: 1 });
attendanceSchema.index({ date: 1, part: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

