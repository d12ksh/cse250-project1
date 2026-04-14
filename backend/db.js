const mariadb = require("mariadb");

const pool = mariadb.createPool(process.env.DATABASE_URL);

module.exports = pool;