const { cryptoSeed } = require("../utils/restCrypto");
const { connect } = require("../db.js");
const { default: mongoose } = require("mongoose");

const seedFunction = async () => {
  try {
    await connect();
    await cryptoSeed();
  } catch (error) {
    console(error);
  } finally {
    await mongoose.disconnect();
  }
};

seedFunction();
