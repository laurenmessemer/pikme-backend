module.exports = (sequelize, DataTypes) => {
  const PendingCompetition = sequelize.define(
    "PendingCompetition",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user1_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        allowNull: false,
        onDelete: "CASCADE",
      },
      contest_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Contests",
          key: "id",
        },
        allowNull: false,
        onDelete: "CASCADE",
      },
      invite_link: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM("waiting", "accepted"),
        defaultValue: "waiting",
      },
      user1_image: {  // ✅ Add this missing field
        type: DataTypes.TEXT,  // Using TEXT since URLs can be long
        allowNull: true,  // Allow null initially
      },
    },
    {
      timestamps: true,
      tableName: "PendingCompetitions",
    }
  );

  PendingCompetition.associate = function (models) {
    PendingCompetition.belongsTo(models.User, { foreignKey: "user1_id", onDelete: "CASCADE" });
    PendingCompetition.belongsTo(models.Contest, { foreignKey: "contest_id", onDelete: "CASCADE" });
  };

  return PendingCompetition;
};
