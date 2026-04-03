const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: "localhost",
    user: "vansh",
    password: "2608",
    database: "contact_db",
    connectionLimit: 5
});

module.exports = pool;