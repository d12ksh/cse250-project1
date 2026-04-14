const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    connectionLimit: 20,
    acquireTimeout: 20000,
    waitForConnections: true,
    queueLimit: 0,

    // 🔥 IMPORTANT FIXES
    ssl: {
        rejectUnauthorized: false
    },
    allowPublicKeyRetrieval: true
});

module.exports = pool;