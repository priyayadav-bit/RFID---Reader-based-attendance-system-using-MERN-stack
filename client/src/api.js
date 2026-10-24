import axios from 'axios';

// API base URL configuration: uses Vite proxy /api or explicit env var
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

export const api = {
  // Students
  getStudents: async () => {
    const res = await apiClient.get('/students');
    return res.data;
  },

  createStudent: async (studentData) => {
    const res = await apiClient.post('/students', studentData);
    return res.data;
  },

  deleteStudent: async (id) => {
    const res = await apiClient.delete(`/students/${id}`);
    return res.data;
  },

  getLastUnknownScan: async () => {
    const res = await apiClient.get('/students/last-unknown');
    return res.data;
  },

  // Attendance
  getAttendance: async (date) => {
    const url = date ? `/attendance?date=${encodeURIComponent(date)}` : '/attendance';
    const res = await apiClient.get(url);
    return res.data;
  },

  getAttendanceSummary: async (date) => {
    const url = date ? `/attendance/summary?date=${encodeURIComponent(date)}` : '/attendance/summary';
    const res = await apiClient.get(url);
    return res.data;
  },

  // Simulate Scan (useful for testing and demo directly from web browser)
  simulateScan: async (uid, deviceKey = 'esp8266-rfid-secret') => {
    const res = await apiClient.post(
      '/scan',
      { uid },
      {
        headers: {
          'x-device-key': deviceKey,
        },
      }
    );
    return res.data;
  },

  // Health & Server info
  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },
};

export default api;
