// models/Report.js
module.exports = (sequelize, DataTypes) => {
    const Report = sequelize.define("Report", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      reporter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reported_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      competition_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      categories: {
        type: DataTypes.ARRAY(DataTypes.STRING), // e.g. ['AI-generated', 'Hate speech']
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    }, {
      timestamps: true,
      tableName: "Reports",
    });
  
    Report.associate = (models) => {
      Report.belongsTo(models.User, { foreignKey: "reporter_id", as: "Reporter" });
      Report.belongsTo(models.User, { foreignKey: "reported_user_id", as: "ReportedUser" });
      Report.belongsTo(models.Competition, { foreignKey: "competition_id" });
    };
  
    return Report;
  };
  