// Importamos express:
const express = require("express");

// Importamos el modelo que nos sirve tanto para importar datos como para leerlos:
const { Crypto } = require("../models/Crypto.js");

// Router propio de book:
const router = express.Router();

//  Funciones:
const { cryptoSeed } = require("../utils/restCrypto");

const { convertJsonToCsv } = require("../utils/convertToCsv.js");

//  ------------------------------------------------------------------------------------------
//  ---------------------------- ENDPOINTS ---------------------------------------------------
//  ------------------------------------------------------------------------------------------

/*  Endpoint para recuperar todos los books de manera paginada en función de un limite de elementos a mostrar
por página para no saturar al navegador (CRUD: READ):
*/

router.get("/", async (req, res) => {
  // Si funciona la lectura...
  try {
    // Recogemos las query params de esta manera req.query.parametro.
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const cryptoList = await Crypto.find() // Devolvemos los books si funciona. Con modelo.find().
      .limit(limit) // La función limit se ejecuta sobre el .find() y le dice que coga un número limitado de elementos, coge desde el inicio a no ser que le añadamos...
      .skip((page - 1) * limit); // La función skip() se ejecuta sobre el .find() y se salta un número determinado de elementos y con este cálculo podemos paginar en función del limit.

    if (cryptoList.length === 0) {
      return res.status(404).send("No se encontraron monedas que cumplan con los parámetros de búsqueda.");
    }
    //  Creamos una respuesta más completa con info de la API y los datos solicitados por el usuario:
    const totalElements = await Crypto.countDocuments(); //  Esperamos aque realice el conteo del número total de elementos con modelo.countDocuments()
    const totalPagesByLimit = Math.ceil(totalElements / limit); // Para saber el número total de páginas que se generan en función del limit. Math.ceil() nos elimina los decimales.

    // Respuesta Completa:
    const response = {
      totalItems: totalElements,
      totalPages: totalPagesByLimit,
      currentPage: page,
      totalItemPage: limit,
      data: cryptoList,
    };
    // Enviamos la respuesta como un json.
    res.json(response);

    // Si falla la lectura...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código de error 500 y el error.
  }
});

/* Ejemplo de REQ indicando que queremos la página 4 estableciendo un limite de 10 elementos
 por página (limit = 10 , pages = 4):
 http://localhost:3000/book?limit=10&page=4 */

//  ------------------------------------------------------------------------------------------
// Endpoint para recuperar todos los crypto de manera paginada en función dy los query params y del número de monedas en circulación:
router.get("/coins", async (req, res) => {
  try {
    // Recogemos las query params de esta manera req.query.parametro.
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const order = req.query.order || "desc";
    const min = parseInt(req.query.min);
    const max = parseInt(req.query.max);
    let all = false;

    //  Validaciones de query params:
    if (order !== "asc" && order !== "desc") {
      return res.status(400).send("Orden no correcto. Indica el orden con asc || desc");
    }
    if (!min || !max) {
      all = true;
    }
    if (min >= max) {
      return res.status(400).send("Los valores mínimos y deben ser números y el mínimo debe ser menor que el máximo");
    }

    // Leemos los datos:
    const cryptoList = await Crypto.find({}).lean(); //  Con .lean( nos devuelve datos más ligeros de los documentos que solicitamos.

    // Mapeamos los datos y añadimos una nueva propiedad coins a cada uno que calcula las monedas en circulación:
    const formattedCryptoList = cryptoList.map((crypto) => {
      const coins = crypto.marketCap / crypto.price;
      return {
        ...crypto,
        coins,
      };
    });

    // Filtramos los resultados en función del valor de la nueva propiedad coins creada y del min y del max aportado por el usuario:
    let filteredCryptoList = [];
    if (all === false) {
      filteredCryptoList = formattedCryptoList.filter((crypto) => crypto.coins > min && crypto.coins < max);
    } else {
      filteredCryptoList = formattedCryptoList;
    }
    // Si no hay monedas que cumplan con los parámetros de búsqueda, devolvemos un mensaje adecuado:
    if (filteredCryptoList.length === 0) {
      return res.status(404).send("No se encontraron monedas que cumplan con los parámetros de búsqueda.");
    }

    // Ordenamos el array en función de order y del valor de la nueva propiedad coins creada:
    const orderedCryptoList = order === "asc" ? filteredCryptoList.sort((a, b) => a.coins - b.coins) : filteredCryptoList.sort((a, b) => b.coins - a.coins);

    // Obtenemos la lista de criptomonedas correspondiente a la página solicitada:
    const start = (page - 1) * limit;
    const end = page * limit;
    const pagedOrderedCryptoList = orderedCryptoList.slice(start, end);

    // Preparamos una respuesta completa:
    const count = orderedCryptoList.length;
    const totalPages = Math.ceil(count / limit);

    const response = {
      totalItems: count,
      totalPages,
      currentPage: page,
      totalItemPage: pagedOrderedCryptoList.length,
      cryptoList: pagedOrderedCryptoList,
    };
    //  Mandamos la respuesta completa:
    res.json(response);
    //  Si falla...
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

//  ----------------------------------------------------------------------------------------

//  Endpoint para ordenar los datos recibidos de los crypto en funcion de la fecha de creación de la moneda y los query params:

router.get("/sorted-by-date", async (req, res) => {
  // Si funciona ...
  try {
    const page = req.query.page;
    const limit = parseInt(req.query.limit);
    const order = req.query.order;

    //  Validaciones de query params:
    if (order !== "asc" && order !== "desc") {
      res.status(400).json({});
    }

    // Leemos los datos los ordenamos y limitamos los que se enseñan en función del limt y la page y contamos los documentos que existen con los parametros pasados:
    const totalElements = await Crypto.countDocuments();
    const cryptoListOrder = await Crypto.find()
      .sort({ created_at: order })
      .limit(limit)
      .skip((page - 1) * limit);

    // Si no hay monedas que cumplan con los parámetros de búsqueda, devolvemos un mensaje adecuado:
    if (cryptoListOrder.length === 0) {
      return res.status(404).send("No se encontraron monedas que cumplan con los parámetros de búsqueda.");
    }

    //  Preparamos una respuesta completa:
    const totalPagesByLimit = Math.ceil(totalElements / limit);
    const response = {
      totalItems: totalElements,
      totalPages: totalPagesByLimit,
      currentPage: page,
      totalItemPage: limit,
      data: cryptoListOrder,
    };
    //  Enviamos la respuesta completa:
    res.json(response);

    // Si falla ...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código 500 de error si falla el reseteo de datos y el error.
  }
});

//  ------------------------------------------------------------------------------------------

//  Endpoint para ordenar los datos recibidos de los crypto en funcion del marketcap y los query params:

router.get("/sorted-by-marketcap", async (req, res) => {
  // Si funciona ...
  try {
    const page = req.query.page || 1;
    const limit = parseInt(req.query.limit) || 10;
    const order = req.query.order || "desc";
    const min = req.query.min;
    const max = req.query.max;
    const skip = (page - 1) * limit;

    //  Validaciones de query params:
    if (order !== "asc" && order !== "desc") {
      return res.status(400).send("Orden no correcto. Indica el orden con asc || desc");
    }
    if (!min || !max || isNaN(parseInt(min)) || isNaN(parseInt(max))) {
      return res.status(400).send("Los valores mínimos y máximos deben ser proporcionados y deben ser números");
    }

    if (parseInt(min) >= parseInt(max)) {
      return res.status(400).send("El mínimo debe ser menor que el máximo");
    }

    // Leemos los datos y contamos los documentos que existen con los parametros pasados:
    const count = await Crypto.countDocuments({ marketCap: { $gt: min, $lt: max } });
    const cryptoList = await Crypto.find({ marketCap: { $gt: min, $lt: max } })
      .sort({ marketCap: order })
      .skip(skip)
      .limit(limit);

    // Si no hay monedas que cumplan con los parámetros de búsqueda, devolvemos un mensaje adecuado:
    if (cryptoList.length === 0) {
      return res.status(404).send("No se encontraron monedas que cumplan con los parámetros de búsqueda.");
    }
    //  Preparamos una respuesta completa:

    const totalPages = Math.ceil(count / limit);

    const response = {
      totalItems: count,
      totalPages,
      currentPage: parseInt(page),
      totalItemPage: cryptoList.length,
      cryptoList,
    };
    //  Enviamos la respuesta completa:
    res.json(response);
    // Si no existen documentos con esos parámetros...

    //  Si falla...
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

//  ------------------------------------------------------------------------------------------

//  Endpoint para ordenar los datos recibidos de los crypto en función de su price range y los query params:
router.get("/price-range", async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = parseInt(req.query.limit) || 10;
    const order = req.query.order || "desc";
    const min = req.query.min;
    const max = req.query.max;
    const skip = (page - 1) * limit;

    // Validación de query params:
    if (order !== "asc" && order !== "desc") {
      return res.status(400).send("Orden no correcto. Indica el orden con asc || desc");
    }
    if (!min || !max || isNaN(parseInt(min)) || isNaN(parseInt(max))) {
      return res.status(400).send("Los valores mínimos y máximos deben ser proporcionados y deben ser números");
    }
    if (parseInt(min) >= parseInt(max)) {
      return res.status(400).send("El mínimo debe ser menor que el máximo");
    }

    // Leemos los datos y contamos los documentos que existen con los parametros pasados:
    const count = await Crypto.countDocuments({ price: { $gt: min, $lt: max } });
    const cryptoList = await Crypto.find({ price: { $gt: min, $lt: max } })
      .sort({ price: order })
      .skip(skip)
      .limit(limit);

    // Si no hay monedas que cumplan con los parámetros de búsqueda, devolvemos un mensaje adecuado:
    if (cryptoList.length === 0) {
      return res.status(404).send("No se encontraron monedas que cumplan con los parámetros de búsqueda.");
    }
    //  Preparamos una respuesta completa:
    const totalPages = Math.ceil(count / limit);

    const response = {
      totalItems: count,
      totalPages,
      currentPage: parseInt(page),
      totalItemPage: cryptoList.length,
      cryptoList,
    };
    //  Enviamos la respuesta completa:
    res.json(response);

    //  Si falla...
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

//  ------------------------------------------------------------------------------------------

//  Endpoint para transformar los datos recibidos de los crypto de json a formato csv:

router.get("/csv", async (req, res) => {
  // Si funciona el parseo...
  try {
    const cryptoList = await Crypto.find(); // Devolvemos los crypto si funciona. Con modelo.find().
    // Si no hay monedas que cumplan con los parámetros de búsqueda, devolvemos un mensaje adecuado:
    if (cryptoList.length === 0) {
      return res.status(404).send("No se encontraron monedas que cumplan con los parámetros de búsqueda.");
    }
    const response = convertJsonToCsv(cryptoList); // Convertimos a formato csv
    res.send(response); // Enviamos la respuesta.

    // Si falla el parseo...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código 500 de error si falla el parseo de datos y el error.
  }
});

//  ------------------------------------------------------------------------------------------

//  Ruta para recuperar un crypto en concreto a través de su id ( modelo.findById(id)) (CRUD: READ):

router.get("/:id", async (req, res) => {
  // Si funciona la lectura...
  try {
    const id = req.params.id; //  Recogemos el id de los parametros de la ruta.
    const crypto = await Crypto.findById(id); //  Buscamos un book con un id determinado dentro de nuestro modelo con modelo.findById(id a buscar).
    // Si no hay monedas que cumplan con los parámetros de búsqueda, devolvemos un mensaje adecuado:
    if (crypto.length === 0) {
      return res.status(404).send("No se encontraron monedas que cumplan con los parámetros de búsqueda.");
    }
    res.json(crypto); //  Si existe el book lo mandamos como respuesta en modo json.

    // Si falla la lectura...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código de error 500 y el error.
  }
});

// Ejemplo de REQ:
// http://localhost:3000/crypto/id del crypto a buscar

//  ------------------------------------------------------------------------------------------

//  Endpoint para buscar un crypto por el name ( modelo.findById({name: req.params.name})) (CRUD: Operación Custom. No es CRUD):

router.get("/name/:name", async (req, res) => {
  const name = req.params.name;
  // Si funciona la lectura...
  try {
    const crypto = await Crypto.find({ name: new RegExp("^" + name.toLowerCase(), "i") }); //  Esperamos a que realice una busqueda en la que coincida el texto pasado por query params para la propiedad determinada pasada dentro de un objeto, porqué tenemos que pasar un objeto, sin importar mayusc o minusc.
    // Si no hay monedas que cumplan con los parámetros de búsqueda, devolvemos un mensaje adecuado:
    if (crypto.length === 0) {
      return res.status(404).send("No se encontraron monedas que cumplan con los parámetros de búsqueda.");
    }
    res.json(crypto); //  Si existe el crypto lo mandamos en la respuesta como un json.

    // Si falla la lectura...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código de error 500 y el error.
  }
});

// Ejemplo de REQ:
// http://localhost:3000/crypto/name/name del crypto a buscar

//  ------------------------------------------------------------------------------------------

//  Endpoint para añadir elementos (CRUD: CREATE):

router.post("/", async (req, res) => {
  // Si funciona la escritura...
  try {
    const crypto = new Crypto({ name: req.body.name, price: req.body.price, marketCap: req.body.marketCap, created_at: req.body.created_at }); //     Un nuevo crypto es un nuevo modelo de la BBDD que tiene un Scheme que valida la estructura de esos datos que recoge del body de la petición.
    const createdCrypto = await crypto.save(); // Esperamos a que guarde el nuevo crypto creado en caso de que vaya bien. Con el metodo .save().
    return res.status(201).json(createdCrypto); // Devolvemos un código 201 que significa que algo se ha creado y el crypto creado en modo json.

    // Si falla la escritura...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código de error 500 si falla la escritura y el error.
  }
});

/* Petición tipo de POST para añadir un nuevo crypto (añadimos al body el nuevo crypto con sus propiedades que tiene que cumplir con el Scheme de nuestro modelo) identificado por su id:
const newCrypto = {created_at: "2015-07-30T01:26:13.000Z",
marketCap:258082329474,
name:"Ethereum",
price: 2230.16}
 fetch("http://localhost:3000/crypto/",{"body": JSON.stringify(newCrypto),"method":"POST","headers":{"Accept":"application/json","Content-Type":"application/json"}}).then((data)=> console.log(data)) */

//  ------------------------------------------------------------------------------------------

//  Endpoint para resetear los datos ejecutando cryptos:

router.delete("/reset", async (req, res) => {
  // Si funciona el reseteo...
  try {
    const cryptoList = await cryptoSeed();
    res.send("Datos Crypto reseteados");
    res.json(cryptoList);

    // Si falla el reseteo...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código 500 de error si falla el reseteo de datos y el error.
  }
});

//  ------------------------------------------------------------------------------------------

//  Endpoint para eliminar crypto identificado por id (CRUD: DELETE):

router.delete("/:id", async (req, res) => {
  // Si funciona el borrado...
  try {
    const id = req.params.id; //  Recogemos el id de los parametros de la ruta.
    const cryptoDeleted = await Crypto.findByIdAndDelete(id); // Esperamos a que nos devuelve la info del crypto eliminado que busca y elimina con el metodo findByIdAndDelete(id del crypto a eliminar).
    // Si no hay monedas que cumplan con los parámetros de búsqueda, devolvemos un mensaje adecuado:
    if (cryptoDeleted.length === 0) {
      return res.status(404).send("No se encontraron monedas que cumplan con los parámetros de búsqueda.");
    }
    res.json(cryptoDeleted); //  Devolvemos el crypto eliminado en caso de que exista con ese id.

    // Si falla el borrado...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código 500 de error si falla el delete y el error.
  }
});

/* Petición tipo DELETE para eliminar un crypto  identificado por su id (no añadimos body a la busqueda y recogemos el id de los parametros de la ruta):

fetch("http://localhost:3000/crypto/id del crypto a borrar",{"method":"DELETE","headers":{"Accept":"application/json","Content-Type":"application/json"}}).then((data)=> console.log(data))
*/

//  ------------------------------------------------------------------------------------------

//  Endpoint para actualizar un elemento identificado por id (CRUD: UPDATE):

router.put("/:id", async (req, res) => {
  // Si funciona la actualización...
  try {
    const id = req.params.id; //  Recogemos el id de los parametros de la ruta.
    const cryptoUpdated = await Crypto.findByIdAndUpdate(id, req.body, { new: true }); // Esperamos que devuelva la info del crypto actualizado al que tambien hemos pasado un objeto con los campos q tiene que acualizar en la req del body de la petición. {new: true} Le dice que nos mande el crypto actualizado no el antiguo. Lo busca y elimina con el metodo findByIdAndDelete(id del crypto a eliminar).
    // Si no hay monedas que cumplan con los parámetros de búsqueda, devolvemos un mensaje adecuado:
    if (cryptoUpdated.length === 0) {
      return res.status(404).send("No se encontraron monedas que cumplan con los parámetros de búsqueda.");
    }
    res.json(cryptoUpdated); //  Devolvemos el crypto actualizado en caso de que exista con ese id.

    // Si falla la actualización...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código 500 de error si falla el update y el error.
  }
});

/* Petición tipo de PUT para actualizar datos concretos (en este caso el title) recogidos en el body,
de un crypto en concreto (recogemos el id de los parametros de la ruta ):

fetch("http://localhost:3000/crypto/id del crypto a actualizar",{"body": JSON.stringify({name:"Prueba"}),"method":"PUT","headers":{"Accept":"application/json","Content-Type":"application/json"}}).then((data)=> console.log(data))
*/

//  ------------------------------------------------------------------------------------------

// Exportamos
module.exports = { cryptoRouter: router };
