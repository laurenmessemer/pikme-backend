module.exports = (sequelize, DataTypes) => {
    const ThemeEntry = sequelize.define(
      "ThemeEntry",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        theme_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Themes", // Ensure this matches your DB
            key: "id",
          },
        },
        image_url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        },
      },
      {
        tableName: "ThemeEntries",
        timestamps: false, // Disable Sequelize's automatic `createdAt` and `updatedAt`
        underscored: true, // Use snake_case for columns
      }
    );
  
    ThemeEntry.associate = (models) => {
      ThemeEntry.belongsTo(models.Theme, {
        foreignKey: "theme_id",
        onDelete: "CASCADE",
      });
    };
  
    return ThemeEntry;
  };
  