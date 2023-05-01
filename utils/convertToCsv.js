const convertJsonToCsv = (jsonData) => {
  const header = ["name", "price", "marketCap", "created_at", "_id", "createdAt", "updatedAt"].join(",") + "\n";

  // Generamos las filas del CSV
  const rows = jsonData.map((crypto) => [crypto.id, crypto.name, crypto.price, crypto.marketCap, crypto.created_at, crypto.createdAt, crypto.updatedAt].join(",") + "\n").join("");

  // Unimos la cabecera y las filas en un único string
  const csv = header + rows;

  return csv;
};

module.exports = { convertJsonToCsv };
