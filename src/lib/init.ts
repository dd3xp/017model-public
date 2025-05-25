import sequelize from './db';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';

export async function initDatabase() {
  if (!sequelize) return;
  
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    await User.sync();
    await VerificationCode.sync();
    console.log('Database tables created successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
} 