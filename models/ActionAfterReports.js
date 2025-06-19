module.exports = (sequelize, DataTypes) => {
  const ActionAfterReports = sequelize.define(
    'ActionAfterReports',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      reported_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      competition_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      old_image_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      new_image_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          'User Action Pending',
          'Admin Review Pending',
          'Resolved',
          'Resolved By Admin'
        ),
      },
      mail_send_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: 'ActionAfterReports',
    }
  );

  ActionAfterReports.associate = (models) => {
    ActionAfterReports.belongsTo(models.User, {
      foreignKey: 'reported_user_id',
      as: 'ReportedUser',
    });
    ActionAfterReports.belongsTo(models.Competition, {
      foreignKey: 'competition_id',
    });
  };

  return ActionAfterReports;
};
