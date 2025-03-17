const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Contest = sequelize.define(
    "Contest",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      creator_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      theme_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Themes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("Upcoming", "Live", "Complete"),
        allowNull: false,
      },
      entry_fee: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_entries: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      prize_pool: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      winnings: {
        type: DataTypes.JSON, // Stores winnings for 1st, 2nd, and 3rd place
        allowNull: false,
        defaultValue: { first: 0, second: 0, third: 0 },
      },
      contest_live_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      submission_deadline: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      voting_live_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      voting_deadline: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "Contests",
    }
  );

  Contest.associate = (models) => {
    Contest.belongsTo(models.User, { foreignKey: "creator_id", onDelete: "CASCADE" });
    Contest.belongsTo(models.Theme, {
      foreignKey: "theme_id",
      as: "Theme", // ✅ Ensure alias matches the backend query
    });
    Contest.hasMany(models.Entry, { foreignKey: "contest_id", onDelete: "CASCADE" });
    Contest.hasMany(models.Competition, { foreignKey: "contest_id", onDelete: "CASCADE" });
  };

  return Contest;
};
