const { Sequelize, DataTypes } = require("sequelize");


module.exports = (sequelize, DataTypes) => {
  const Entry = sequelize.define(
    "Entry",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      contest_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Contests",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      image_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      rank: {
        type: DataTypes.ENUM("1st", "2nd", "3rd"),
        allowNull: true,
      },
      aspect_ratio: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      votes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      final_result: {
        type: DataTypes.ENUM("Won", "Lost"),
        allowNull: true,
      },
      impressions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      tableName: "Entries",
    }
  );

  Entry.associate = function (models) {
    Entry.belongsTo(models.User, { foreignKey: "user_id", onDelete: "CASCADE" });
    Entry.belongsTo(models.Contest, { foreignKey: "contest_id", onDelete: "CASCADE" });
  };

  return Entry;
};
