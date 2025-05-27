import { Model, DataTypes } from 'sequelize';
import sequelize from '@/lib/db';

export default class TempWork extends Model {
  declare id: number;
  declare userId: string;
  declare description: string;
  declare scadPath: string;
  declare status: string;
  declare stlPath: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

TempWork.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    scadPath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    stlPath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize!,
    modelName: 'TempWork',
    tableName: 'tempworks',
  }
); 