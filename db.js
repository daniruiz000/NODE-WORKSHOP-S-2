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

// Nos conectamos a Mongoose
const connect = async (retries = 5) => {
  try {
    const database = await mongoose.connect(DB_CONNECTION, config);
    const name = database.connection.name;
    const host = database.connection.host;
    console.log(`Conectado a la base de datos ${name} en el host ${host}`);
  } catch (error) {
    console.error(`Error al conectar a la base de datos: ${error.message}`);

    if (retries > 0) {
      console.log(`Reintentando conexión en ${config.serverSelectionTimeoutMS}ms...`);
      setTimeout(() => {
        connect(retries - 1);
      }, config.serverSelectionTimeoutMS);
    } else {
      console.error("No se pudo establecer la conexión a la base de datos");
    }
  }
};

// Exportamos el archivo
module.exports = { connect };
