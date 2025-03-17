module.exports = (sequelize, DataTypes) => {
    const Incident = sequelize.define(
      "Incident",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        flagged_by_user: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: "Users",
            key: "id",
          },
          onDelete: "SET NULL",
        },
      },
      {
        timestamps: true,
        tableName: "Incidents",
      }
    );
  
    // ✅ Define Relationship
    Incident.associate = (models) => {
      Incident.belongsTo(models.User, { foreignKey: "flagged_by_user", onDelete: "SET NULL" });
    };
  
    return Incident;
  };
  