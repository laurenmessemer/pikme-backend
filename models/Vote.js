module.exports = (sequelize, DataTypes) => {
    const Vote = sequelize.define("Vote", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      voter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      competition_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Competitions",
          key: "id",
        },
      },
      voted_for: {
        type: DataTypes.ENUM("user1", "user2"),
        allowNull: false,
      },
    }, {
      timestamps: true,
      tableName: "Votes",
    });
  
    Vote.associate = (models) => {
      Vote.belongsTo(models.User, { foreignKey: "voter_id" });
      Vote.belongsTo(models.Competition, { foreignKey: "competition_id" });
    };
  
    return Vote;
  };
  