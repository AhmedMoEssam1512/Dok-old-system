require("dotenv").config();
const { Sequelize } = require('sequelize');


console.log("🔍 DB ENV CONFIG:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  database: process.env.DB_NAME,
  dialect: process.env.DB_DIALECT
});


const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        dialect: process.env.DB_DIALECT || 'postgres',
        logging: console.log, // logs every SQL query
    }
);

module.exports = sequelize;
