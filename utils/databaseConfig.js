require('dotenv').config();
const mongoose = require('mongoose');

const { MONGO_URL } = process.env;
mongoose.connect(MONGO_URL);
const con = mongoose.connection;

module.exports = con;
