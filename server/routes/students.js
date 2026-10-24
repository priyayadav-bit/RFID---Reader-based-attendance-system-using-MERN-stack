const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const state = require('../state');

// GET /api/students - List all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().sort({ rollNo: 1 });
    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server error fetching students' });
  }
});

// GET /api/students/last-unknown - Get last unregistered UID scanned
router.get('/last-unknown', (req, res) => {
  const lastUnknown = state.getLastUnknown();
  res.json({
    success: true,
    data: lastUnknown,
  });
});

// POST /api/students - Register a new student
router.post('/', async (req, res) => {
  try {
    let { name, rollNo, cardUid } = req.body;

    if (!name || !rollNo || !cardUid) {
      return res.status(400).json({
        success: false,
        message: 'Name, roll number, and card UID are all required',
      });
    }

    name = name.trim();
    rollNo = rollNo.trim().toUpperCase();
    cardUid = cardUid.trim().toUpperCase();

    // Check if rollNo already exists
    const existingRoll = await Student.findOne({ rollNo });
    if (existingRoll) {
      return res.status(409).json({
        success: false,
        message: `Student with roll number "${rollNo}" already exists`,
      });
    }

    // Check if cardUid already registered
    const existingCard = await Student.findOne({ cardUid });
    if (existingCard) {
      return res.status(409).json({
        success: false,
        message: `RFID card "${cardUid}" is already assigned to ${existingCard.name} (${existingCard.rollNo})`,
      });
    }

    const student = await Student.create({ name, rollNo, cardUid });

    // If this card was the last unknown scan, clear it
    if (state.getLastUnknown().uid === cardUid) {
      state.clearLastUnknown();
    }

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: student,
    });
  } catch (error) {
    console.error('Error registering student:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry detected for roll number or card UID',
      });
    }
    res.status(500).json({ success: false, message: 'Server error registering student' });
  }
});

// DELETE /api/students/:id - Remove a student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    await Student.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Student ${student.name} removed successfully`,
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Server error deleting student' });
  }
});

module.exports = router;
