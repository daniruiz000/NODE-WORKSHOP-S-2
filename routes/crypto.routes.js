// Importamos express:
const express = require("express");

// Importamos el modelo que nos sirve tanto para importar datos como para leerlos:
const { Crypto } = require("../models/Crypto.js");

// Router propio de book:
const router = express.Router();

const { cryptoSeed } = require("../utils/restCrypto");

const { convertJsonToCsv } = require("../utils/convertToCsv.js");
//  ------------------------------------------------------------------------------------------

/*  Ruta para recuperar todos los books de manera paginada en función de un limite de elementos a mostrar
por página para no saturar al navegador (CRUD: READ):
*/

router.get("/", async (req, res) => {
  // Si funciona la lectura...
  try {
    // Recogemos las query params de esta manera req.query.parametro.
    const page = req.query.page;
    const limit = parseInt(req.query.limit);

    const cryptoList = await Crypto.find() // Devolvemos los books si funciona. Con modelo.find().
      .limit(limit) // La función limit se ejecuta sobre el .find() y le dice que coga un número limitado de elementos, coge desde el inicio a no ser que le añadamos...
      .skip((page - 1) * limit); // La función skip() se ejecuta sobre el .find() y se salta un número determinado de elementos y con este cálculo podemos paginar en función del limit.

    //  Creamos una respuesta más completa con info de la API y los datos solicitados por el usuario:
    const totalElements = await Crypto.countDocuments(); //  Esperamos aque realice el conteo del número total de elementos con modelo.countDocuments()
    const totalPagesByLimit = Math.ceil(totalElements / limit); // Para saber el número total de páginas que se generan en función del limit. Math.ceil() nos elimina los decimales.

    // Respuesta Completa:
    const response = {
      totalItems: totalElements,
      totalPages: totalPagesByLimit,
      currentPage: page,
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

//  ------------------------------------------------------------------------------------------

//  Endpoint para ordenar los datos recibidos de los crypto en funcion del marketcap:

router.get("/sorted-by-date", async (req, res) => {
  // Si funciona ...

  try {
    const order = req.query.order;
    const cryptoList = await Crypto.find();
    if (order && order !== "asc" && order !== "desc") {
      res.status(400).json({});
    } else {
      if (cryptoList?.length) {
        const cryptoListOrder = cryptoList.sort((a, b) => a.created_at - b.created_at);
        switch (order) {
          case "asc":
            res.json(cryptoListOrder);
            break;
          case "desc":
            res.json(cryptoListOrder.reverse());
            break;
          default:
            res.json(cryptoListOrder);
            break;
        }
      } else {
        res.status(404).json([]);
      }
    }

    // Si falla ...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código 500 de error si falla el reseteo de datos y el error.
  }
});
//  ------------------------------------------------------------------------------------------
//  ------------------------------------------------------------------------------------------

//  Endpoint para ordenar los datos recibidos de los crypto en funcion del marketcap:

router.get("/sorted-by-marketcap", async (req, res) => {
  // Si funciona ...

  try {
    const order = req.query.order;
    const cryptoList = await Crypto.find();
    if (order && order !== "asc" && order !== "desc") {
      res.status(400).json({});
    } else {
      if (cryptoList?.length) {
        const cryptoListOrder = cryptoList.sort((a, b) => a.marketCap - b.marketCap);
        switch (order) {
          case "asc":
            res.json(cryptoListOrder);
            break;
          case "desc":
            res.json(cryptoListOrder.reverse());
            break;
          default:
            res.json(cryptoListOrder);
            break;
        }
      } else {
        res.status(404).json([]);
      }
    }
    // Si falla ...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código 500 de error si falla el reseteo de datos y el error.
  }
});
//  ------------------------------------------------------------------------------------------

//  Endpoint para ordenar los datos recibidos de los crypto en función de su price range:

router.get("/price-range", async (req, res) => {
  // Si funciona ...
  try {
    const min = parseInt(req.query.min);
    const max = parseInt(req.query.max);
    // console.log(min, max);
    // res.send("datos price order ---- min= " + min + " max= " + max);
    const cryptoList = await Crypto.find();
    // res.json(cryptoList);
    if (cryptoList?.length > 1) {
      const sortedCryptoListPriceRange = cryptoList.filter((element) => min < element.price && element.price < max);
      res.json(sortedCryptoListPriceRange);
      console.log(sortedCryptoListPriceRange, min, max);
    } else {
      res.status(404).json([]);
    }
    // Si falla ...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código 500 de error si falla el reseteo de datos y el error.
  }
});

//  Endpoint para transformar los datos recibidos de los crypto de json a formato csv:

router.get("/csv", async (req, res) => {
  // Si funciona el parseo...
  try {
    const cryptoList = await Crypto.find(); // Devolvemos los crypto si funciona. Con modelo.find().
    if (cryptoList?.length) {
      const response = convertJsonToCsv(cryptoList); // Convertimos a formato csv
      res.send(response); // Enviamos la respuesta.
    }

    // Si falla el parseo...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código 500 de error si falla el parseo de datos y el error.
  }
});
//  ------------------------------------------------------------------------------------------
//  ------------------------------------------------------------------------------------------

//  Ruta para recuperar un crypto en concreto a través de su id ( modelo.findById(id)) (CRUD: READ):

router.get("/:id", async (req, res) => {
  // Si funciona la lectura...
  try {
    const id = req.params.id; //  Recogemos el id de los parametros de la ruta.
    const crypto = await Crypto.findById(id); //  Buscamos un book con un id determinado dentro de nuestro modelo con modelo.findById(id a buscar).
    if (crypto) {
      res.json(crypto); //  Si existe el book lo mandamos como respuesta en modo json.
    } else {
      res.status(404).json({}); //    Si no existe el book se manda un json vacio y un código 400.
    }

    // Si falla la lectura...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código de error 500 y el error.
  }
});

// Ejemplo de REQ:
// http://localhost:3000/crypto/id del crypto a buscar

//  ------------------------------------------------------------------------------------------

//  Ruta para buscar un crypto por el name ( modelo.findById({name: req.params.name})) (CRUD: Operación Custom. No es CRUD):

router.get("/name/:name", async (req, res) => {
  const name = req.params.name;
  // Si funciona la lectura...
  try {
    const crypto = await Crypto.find({ name: new RegExp("^" + name.toLowerCase(), "i") }); //  Esperamos a que realice una busqueda en la que coincida el texto pasado por query params para la propiedad determinada pasada dentro de un objeto, porqué tenemos que pasar un objeto, sin importar mayusc o minusc.
    if (crypto?.length) {
      res.json(crypto); //  Si existe el crypto lo mandamos en la respuesta como un json.
    } else {
      res.status(404).json([]); //   Si no existe el crypto se manda un json con un array vacio porque la respuesta en caso de haber tenido resultados hubiera sido un array y un mandamos un código 404.
    }

    // Si falla la lectura...
  } catch (error) {
    console.error(error);
    res.status(500).json(error); //  Devolvemos un código de error 500 y el error.
  }
});

// Ejemplo de REQ:
// http://localhost:3000/crypto/name/name del crypto a buscar

//  ------------------------------------------------------------------------------------------

//  Ruta para añadir elementos (CRUD: CREATE):

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

//  Endpoint para resetear los datos ejecutando cryptos:
router.delete("/reset", async (req, res) => {
  // Si funciona el reseteo...
  try {
    await cryptoSeed();
    res.send("Datos Crypto reseteados");

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
    if (cryptoDeleted) {
      res.json(cryptoDeleted); //  Devolvemos el crypto eliminado en caso de que exista con ese id.
    } else {
      res.status(404).json({}); //  Devolvemos un código 404 y un objeto vacio en caso de que no exista con ese id.
    }

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
    if (cryptoUpdated) {
      res.json(cryptoUpdated); //  Devolvemos el crypto actualizado en caso de que exista con ese id.
    } else {
      res.status(404).json({}); //  Devolvemos un código 404 y un objeto vacio en caso de que no exista con ese id.
    }

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
