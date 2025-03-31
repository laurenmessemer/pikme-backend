const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Contact = sequelize.define(
    "Contact",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      timestamps: false,           // 🔥 You created the timestamp manually
      tableName: "Contacts",       // 🔥 Matches your quoted Postgres table name
      freezeTableName: true,       // Prevent Sequelize from pluralizing to "Contacts" (extra safeguard)
    }
  );

  return Contact;
};
