const { cryptoSeed } = require("../utils/restCrypto");
const { connect } = require("../db.js");
const { default: mongoose } = require("mongoose");

const seedFunction = async () => {
  await connect();
  await cryptoSeed();
  await mongoose.disconnect();
};

seedFunction();
