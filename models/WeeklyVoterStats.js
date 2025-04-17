module.exports = (sequelize, DataTypes) => {
    const WeeklyVoterStats = sequelize.define("WeeklyVoterStats", {
      weekStart: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        primaryKey: true,
      },
      newVoters: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      repeatVoters: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    });
  
    return WeeklyVoterStats;
  };
  