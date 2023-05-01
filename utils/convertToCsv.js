const convertJsonToCsv = (jsonData) => {
  const header = ["name", "price", "marketCap", "created_at"].join(",") + "\n";

  // Generamos las filas del CSV
  const rows = jsonData.map((crypto) => [crypto.name, crypto.price, crypto.marketCap, crypto.created_at].join(",") + "\n").join("");

  // Unimos la cabecera y las filas en un único string
  const csv = header + rows;

  return csv;
};

module.exports = { convertJsonToCsv };
