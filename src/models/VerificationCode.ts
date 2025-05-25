import { Model, DataTypes } from 'sequelize';
import sequelize from '@/lib/db';

class VerificationCode extends Model {
  declare id: number;
  declare email: string;
  declare code: string;
  declare expires: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

if (sequelize) {
  VerificationCode.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expires: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'VerificationCode',
      tableName: 'verification_codes',
    }
  );
}

export default VerificationCode; 