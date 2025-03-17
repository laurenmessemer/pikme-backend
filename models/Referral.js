const { Sequelize, DataTypes } = require("sequelize");


module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define(
    "Referral",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      referrer_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Allows `SET NULL` on delete
        references: {
          model: "Users",
          key: "id",
        },
      },
      referred_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      timestamps: true,
      tableName: "Referrals",
    }
  );

  // ✅ Define Relationships
  Referral.associate = (models) => {
    Referral.belongsTo(models.User, { foreignKey: "referrer_id", as: "Referrer", onDelete: "SET NULL" });
    Referral.belongsTo(models.User, { foreignKey: "referred_id", as: "ReferredUser", onDelete: "CASCADE" });
  };

  return Referral;
};
