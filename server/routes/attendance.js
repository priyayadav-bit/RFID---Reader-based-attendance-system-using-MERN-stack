const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const state = require('../state');

// Helper to format date and time in local format
function getFormattedDateTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return { date, time };
}

// POST /api/scan or /scan - Main RFID scan endpoint
router.post('/scan', async (req, res) => {
  try {
    const configuredKey = process.env.DEVICE_KEY;
    const clientKey = req.headers['x-device-key'];

    // 1. Check x-device-key if configured
    if (configuredKey && clientKey !== configuredKey) {
      console.warn(`[SCAN] Unauthorized scan attempt. Provided key: "${clientKey}"`);
      return res.status(401).json({
        status: 'unauthorized',
        message: 'Invalid or missing device key in x-device-key header',
      });
    }

    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({
        status: 'error',
        message: 'UID is required in request body: { "uid": "CARD_HEX" }',
      });
    }

    const cleanUid = uid.toString().trim().toUpperCase();

    // 2. Find student by cardUid
    const student = await Student.findOne({ cardUid: cleanUid });

    // 3. If not found, save UID as last-unknown and return 404
    if (!student) {
      state.setLastUnknown(cleanUid);
      console.log(`[SCAN] Unknown card scanned: ${cleanUid}`);
      return res.status(404).json({
        status: 'unknown',
        message: 'Card is not registered in the system',
        uid: cleanUid,
      });
    }

    // 4. Get today's date and current time on the server
    const { date, time } = getFormattedDateTime();

    // 5. Try to create the Attendance record
    try {
      const attendance = await Attendance.create({
        student: student._id,
        date,
        time,
      });

      console.log(`[SCAN] Attendance marked: ${student.name} (${student.rollNo}) at ${time}`);
      return res.status(201).json({
        status: 'marked',
        message: 'Attendance recorded successfully',
        name: student.name,
        rollNo: student.rollNo,
        cardUid: cleanUid,
        date,
        time,
        attendanceId: attendance._id,
      });
    } catch (createErr) {
      // Check if duplicate key error (code 11000)
      if (createErr.code === 11000) {
        console.log(`[SCAN] Duplicate scan ignored: ${student.name} (${student.rollNo}) already marked for ${date}`);
        return res.status(200).json({
          status: 'duplicate',
          message: 'Attendance already marked for today',
          name: student.name,
          rollNo: student.rollNo,
          cardUid: cleanUid,
          date,
        });
      }
      throw createErr;
    }
  } catch (error) {
    console.error('[SCAN] Server error processing scan:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error processing scan',
    });
  }
});

// GET /api/attendance?date=YYYY-MM-DD - Get attendance logs for a specific date
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || getFormattedDateTime().date;

    const records = await Attendance.find({ date: targetDate })
      .populate('student', 'name rollNo cardUid')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      date: targetDate,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, message: 'Server error fetching attendance' });
  }
});

// GET /api/attendance/summary?date=YYYY-MM-DD - Get Present/Absent summary for all students
router.get('/summary', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || getFormattedDateTime().date;

    const allStudents = await Student.find().sort({ rollNo: 1 });
    const attendances = await Attendance.find({ date: targetDate });

    // Map attendance by student ID string
    const attendanceMap = new Map();
    attendances.forEach((att) => {
      attendanceMap.set(att.student.toString(), att);
    });

    let presentCount = 0;
    const summary = allStudents.map((student) => {
      const attRecord = attendanceMap.get(student._id.toString());
      const isPresent = !!attRecord;
      if (isPresent) presentCount++;

      return {
        studentId: student._id,
        name: student.name,
        rollNo: student.rollNo,
        cardUid: student.cardUid,
        status: isPresent ? 'Present' : 'Absent',
        time: isPresent ? attRecord.time : null,
        attendanceId: isPresent ? attRecord._id : null,
      };
    });

    res.json({
      success: true,
      date: targetDate,
      totalStudents: allStudents.length,
      presentCount,
      absentCount: allStudents.length - presentCount,
      attendancePercentage:
        allStudents.length > 0 ? Math.round((presentCount / allStudents.length) * 100) : 0,
      records: summary,
    });
  } catch (error) {
    console.error('Error generating attendance summary:', error);
    res.status(500).json({ success: false, message: 'Server error generating summary' });
  }
});

module.exports = router;
