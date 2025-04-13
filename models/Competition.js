module.exports = (sequelize, DataTypes) => {
  const Competition = sequelize.define(
    "Competition",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      user1_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        allowNull: false,
        onDelete: "CASCADE",
      },
      user2_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        allowNull: true, 
        onDelete: "CASCADE",
      },
      user1_image: {
        type: DataTypes.TEXT,
        allowNull: false, 
      },
      user2_image: {
        type: DataTypes.TEXT,
        allowNull: true, 
      },
      match_type: {
        type: DataTypes.ENUM("pick_random", "invite_friend"),
        allowNull: false, 
      },
      invite_link: {
        type: DataTypes.STRING, 
        allowNull: true,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM("Waiting", "Active", "Complete"),
        defaultValue: "Waiting", 
      },
      votes_user1: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      votes_user2: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      winner_username: {
        type: DataTypes.STRING,
        allowNull: true, 
      },
      winner_earnings: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
    },
    {
      timestamps: true,
      tableName: "Competitions",
    }
  );

  Competition.associate = function (models) {
    Competition.belongsTo(models.Contest, { foreignKey: "contest_id", onDelete: "CASCADE" });
    Competition.belongsTo(models.User, { as: "User1", foreignKey: "user1_id", onDelete: "CASCADE" });
    Competition.belongsTo(models.User, { as: "User2", foreignKey: "user2_id", onDelete: "CASCADE" });
    Competition.hasMany(models.Report, { foreignKey: "competition_id" });
  };

  return Competition;
};
