const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Date string (YYYY-MM-DD) is required'],
      index: true,
    },
    time: {
      type: String, // Format: HH:mm:ss
      required: [true, 'Time string (HH:mm:ss) is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate attendance on the same day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
