const dotenv = require("dotenv");
dotenv.config();

const knex = require("knex");
const config = require("../../knexfile"); // not used

const db = knex({
  client: "pg",
  connection: process.env.POSTGRES_URL,
});

module.exports = db;
