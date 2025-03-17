module.exports = (sequelize, DataTypes) => {
    const Theme = sequelize.define(
      "Theme",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {  // ✅ Renamed from "theme_name" to "name"
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        special_rules: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        cover_image_url: {
          type: DataTypes.TEXT,
          allowNull: true, // Can be NULL if user doesn't upload
        },
        status: {
          type: DataTypes.ENUM("Upcoming", "Live", "Past"),
          allowNull: false,
          defaultValue: "Upcoming",
        },
      },
      {
        timestamps: true,
        tableName: "Themes",
      }
    );
  
    Theme.associate = (models) => {
      Theme.hasMany(models.Contest, { foreignKey: "theme_id", onDelete: "CASCADE" });
      Theme.hasMany(models.ThemeEntry, { foreignKey: "theme_id", onDelete: "CASCADE" });
    };
  
    return Theme;
  };
  