const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    connectionLimit: 25,
    acquireTimeout: 20000,
    waitForConnections: true,
    queueLimit: 0
});

module.exports = pool;