const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-attendance';

// Middleware
app.use(cors());
app.use(express.json());

// Fast check for MongoDB connection on database-dependent routes
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/students/last-unknown') {
    return next();
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: 'database_unavailable',
      message: 'MongoDB is not connected. Please check your MONGO_URI in server/.env or start MongoDB.',
    });
  }
  next();
});

// Routes
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');

// Mount routes
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Direct /api/scan & alias /scan so NodeMCU requests succeed regardless of path prefix
app.use('/api', attendanceRoutes);
app.use('/', attendanceRoutes);

// Helper function to get local IPv4 addresses (for NodeMCU configuration)
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ interface: name, address: iface.address });
      }
    }
  }
  return ips;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'online',
    system: 'Smart Attendance System API v1.0',
    mongoStatus,
    localIps: getLocalIpAddresses(),
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Smart Attendance System API</title></head>
      <body style="font-family:sans-serif; padding: 2rem;">
        <h2>Smart Attendance System API v1.0 is running</h2>
        <p>Backend server is operational and listening on all interfaces (0.0.0.0:${PORT}).</p>
        <p><strong>Available endpoints:</strong></p>
        <ul>
          <li><code>POST /api/scan</code> - RFID scan endpoint for NodeMCU</li>
          <li><code>GET /api/students</code> - List registered students</li>
          <li><code>POST /api/students</code> - Register new student</li>
          <li><code>GET /api/students/last-unknown</code> - Last unknown card UID</li>
          <li><code>GET /api/attendance</code> - Today's attendance logs</li>
          <li><code>GET /api/attendance/summary</code> - Present/Absent summary</li>
          <li><code>GET /api/health</code> - Server and MongoDB status</li>
        </ul>
      </body>
    </html>
  `);
});

// Connect to MongoDB & Start Server
async function startServer() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');

    // Listen on 0.0.0.0 so external Wi-Fi devices (NodeMCU) can connect
    app.listen(PORT, '0.0.0.0', () => {
      console.log('====================================================');
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
      console.log('Local Network IPs (Use one of these in NodeMCU firmware):');
      const ips = getLocalIpAddresses();
      if (ips.length > 0) {
        ips.forEach((ip) => {
          console.log(`  - http://${ip.address}:${PORT} (${ip.interface})`);
        });
      } else {
        console.log('  - No external IPv4 found. Ensure Wi-Fi is connected.');
      }
      console.log('====================================================');
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    console.log('Server will still start to allow API exploration, but database calls will fail until MongoDB is started.');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running in fallback mode on port ${PORT}`);
    });
  }
}

startServer();
