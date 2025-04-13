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
      referral_code: {
        type: DataTypes.STRING,
        unique: true,
      },
      referral_bonus_awarded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verification_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "Users",
    }
  );

  User.associate = (models) => {
    User.hasOne(models.Wallet, { foreignKey: "user_id", onDelete: "CASCADE" });

    User.hasMany(models.Entry, { foreignKey: "user_id", onDelete: "CASCADE" });
    User.hasMany(models.Contest, { foreignKey: "creator_id", onDelete: "CASCADE" });

    User.hasMany(models.Competition, { foreignKey: "user1_id", onDelete: "CASCADE" });
    User.hasMany(models.Competition, { foreignKey: "user2_id", onDelete: "CASCADE" });

    User.hasMany(models.Report, { foreignKey: "reporter_id", as: "ReportsMade" });
    User.hasMany(models.Report, { foreignKey: "reported_user_id", as: "ReportsReceived" });
  };

  return User;
};
