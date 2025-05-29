const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Winners = sequelize.define(
    'Winners',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      contest_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Contests',
          key: 'id',
        },
        allowNull: false,
        onDelete: 'CASCADE',
      },
      competition_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Competitions',
          key: 'id',
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      winning_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      position: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      tableName: 'Winners',
    }
  );

  Winners.associate = (models) => {
    Winners.belongsTo(models.Contest, {
      foreignKey: 'contest_id',
      onDelete: 'CASCADE',
    });
    Winners.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
    });
    Winners.belongsTo(models.Competition, { foreignKey: 'competition_id' });
  };

  return Winners;
};
