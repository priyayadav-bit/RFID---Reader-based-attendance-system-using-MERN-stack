const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Student = require('./models/Student');
const Attendance = require('./models/Attendance');

const sampleStudents = [
  { name: 'Rahul Sharma', rollNo: 'CS-101', cardUid: 'A1B2C3D4' },
  { name: 'Priya Yadav', rollNo: 'CS-102', cardUid: 'E5F6A7B8' },
  { name: 'Amit Kumar', rollNo: 'CS-103', cardUid: '99887766' },
  { name: 'Sneha Patel', rollNo: 'CS-104', cardUid: '33445566' },
  { name: 'Vikram Singh', rollNo: 'CS-105', cardUid: '11223344' },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-attendance';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing students & attendance...');
    await Student.deleteMany({});
    await Attendance.deleteMany({});

    console.log('Inserting sample students...');
    const createdStudents = await Student.insertMany(sampleStudents);
    console.log(`Created ${createdStudents.length} sample students.`);

    // Add 1 sample attendance record for today
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    await Attendance.create({
      student: createdStudents[0]._id,
      date,
      time,
    });
    console.log(`Created sample attendance for ${createdStudents[0].name} for today (${date} at ${time}).`);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
