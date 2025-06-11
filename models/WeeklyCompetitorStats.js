module.exports = (sequelize, DataTypes) => {
  const WeeklyCompetitorStats = sequelize.define(
    'WeeklyCompetitorStats',
    {
      weekStart: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        primaryKey: true,
      },
      newCompetitor: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      repeatCompetitor: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: 'WeeklyCompetitorStats',
    }
  );

  return WeeklyCompetitorStats;
};
