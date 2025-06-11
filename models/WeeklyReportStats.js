module.exports = (sequelize, DataTypes) => {
  const WeeklyReportStats = sequelize.define(
    'WeeklyReportStats',
    {
      weekStart: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        primaryKey: true,
      },
      reportCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalImagesCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: 'WeeklyReportStats',
    }
  );

  return WeeklyReportStats;
};
