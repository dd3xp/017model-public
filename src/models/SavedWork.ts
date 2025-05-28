import { Model, DataTypes } from 'sequelize';
import sequelize from '@/lib/db';

export default class SavedWork extends Model {
  declare id: number;
  declare userId: number;
  declare name: string;
  declare description: string;
  declare stlPath: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

SavedWork.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    stlPath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize!,
    modelName: 'SavedWork',
    tableName: 'savedworks',
  }
); 