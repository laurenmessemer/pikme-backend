module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "participant",
      },
      referred_by_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
    },
    {
      timestamps: true,
      tableName: "Users",
    }
  );

  // ✅ Define Associations
  User.associate = (models) => {
    // ✅ Simplified Wallet Relationship (One-to-One)
    User.hasOne(models.Wallet, { foreignKey: "user_id", onDelete: "CASCADE" });

    // ✅ Self-Referencing Referral Association (Only One Direction)
    // User.belongsTo(models.User, { foreignKey: "referred_by_id", as: "Referrer" });
    // User.hasMany(models.User, { foreignKey: "referred_by_id", as: "Referrals" });

    // ✅ Simplified Relationships
    User.hasMany(models.Entry, { foreignKey: "user_id", onDelete: "CASCADE" });
    User.hasMany(models.Contest, { foreignKey: "creator_id", onDelete: "CASCADE" });

    // ✅ Removed unnecessary relationships like "Alert" and simplified "Competition" & "Incident"
    User.hasMany(models.Competition, { foreignKey: "user1_id", onDelete: "CASCADE" });
    User.hasMany(models.Competition, { foreignKey: "user2_id", onDelete: "CASCADE" });
  };

  return User;
};
