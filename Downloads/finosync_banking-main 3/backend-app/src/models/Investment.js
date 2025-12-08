// src/models/Investment.js
module.exports = (sequelize, DataTypes) => {
    const Investment = sequelize.define(
        'Investment',
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            account_id: { type: DataTypes.INTEGER, allowNull: true },
            type: { type: DataTypes.STRING, allowNull: false },
            product_name: { type: DataTypes.STRING, allowNull: false },
            category: { type: DataTypes.STRING },
            risk_level: { type: DataTypes.STRING },
            amount_invested: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
            current_value: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
            cagr_3y: { type: DataTypes.DECIMAL(5, 2) },
            status: { type: DataTypes.STRING, defaultValue: 'ACTIVE' },
            started_on: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        },
        {
            tableName: 'investments',
            underscored: true,
        }
    );

    Investment.associate = (models) => {
        Investment.belongsTo(models.User, { foreignKey: 'user_id' });
        Investment.belongsTo(models.Account, { foreignKey: 'account_id' });
    };

    return Investment;
};
