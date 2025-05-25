import { Model, DataTypes } from 'sequelize';
import sequelize from '@/lib/db';

class User extends Model {
  declare id: number;
  declare email: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
  },
  {
    sequelize: sequelize!,
    modelName: 'User',
    tableName: 'users',
  }
);

export default User; 