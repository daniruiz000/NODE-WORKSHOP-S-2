// Cargamos variables de entorno
require("dotenv").config();
const DB_CONNECTION = process.env.DB_URL;

// Importamos la librería Mongoose.
const mongoose = require("mongoose");

//  Configuración de la conexión:
const config = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  dbName: "node-s3-workshop", // BBDD a la que tiene que atacar
};
// Nos conectamos a Moongoose
const connect = async () => {
  const database = await mongoose.connect(DB_CONNECTION, config);
  const name = database.connection.name;
  const host = database.connection.host;
  console.log(`Conectado a la base de datos ${name} en el host ${host}`);
};
// Exportamos el archivo
module.exports = { connect };
