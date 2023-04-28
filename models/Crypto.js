//  Importamos Mongoose
const mongoose = require("mongoose");
// Declaramos nuestro esquema que nos permite declarar nuestros objetos y crearle restricciones.
const Schema = mongoose.Schema;
// Creamos esquema del crypto
const cryptoSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    marketCap: { type: Number, required: true },
    created_at: { type: Date, required: true },
  },
  { timestamps: true } // Cada vez que se modifique un documento refleja la hora y fecha de modificación
);
// Creamos un modelo para que siempre que creamos un crypto valide contra el Schema que hemos creado para ver si es valido.
const Crypto = mongoose.model("Crypto", cryptoSchema);
//  Exportamos para poder usarlo fuera
module.exports = { Crypto };
