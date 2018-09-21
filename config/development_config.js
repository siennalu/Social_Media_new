require('dotenv').config();
//console.log(process.env.DB_URI);

module.exports = {
  mongo: {
    db: process.env.DB_URI
  }
};