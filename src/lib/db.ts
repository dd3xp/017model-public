import { Sequelize } from 'sequelize';

const sequelize = typeof window === 'undefined' ? new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'text2cad',
  logging: false
}) : null;

export default sequelize; 