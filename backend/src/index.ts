import express from 'express';
import cors from 'cors';
import { initDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import gymRoutes from './routes/gymRoutes';
import planRoutes from './routes/planRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import auditRoutes from './routes/auditRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import { scheduleExpiryJob } from './jobs/expiryJob';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', authRoutes);
app.use('/api', gymRoutes);
app.use('/api', planRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', notificationRoutes);
app.use('/api', auditRoutes);
app.use('/api', attendanceRoutes);

// Initialize and start server
async function startServer() {
  await initDatabase();
  scheduleExpiryJob();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);

export default app;
