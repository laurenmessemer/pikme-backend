const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define(
    "Wallet",
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
      token_balance: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      earnings: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      transaction_history: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
    },
    {
      timestamps: true,
      tableName: "Wallets",
    }
  );

  Wallet.associate = function (models) {
    Wallet.belongsTo(models.User, { foreignKey: "user_id", onDelete: "CASCADE" });
  };

  return Wallet;
};

