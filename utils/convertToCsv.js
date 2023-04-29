const createCsvStringifier = require("csv-writer").createObjectCsvStringifier;

function convertJsonToCsv(jsonData) {
  if (jsonData !== undefined) {
    const csvStringifier = createCsvStringifier({
      header: [
        { id: "name", title: "Name" },
        { id: "price", title: "Price" },
        { id: "marketCap", title: "Market Cap" },
        { id: "created_at", title: "Created At" },
      ],
    });

    const csvData = jsonData.map((element) => {
      const values = {
        name: element.name,
        price: element.price,
        marketCap: element.marketCap,
        created_at: element.created_at,
      };
      return values;
    });

    const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData);

    return csv;
  }
}

module.exports = { convertJsonToCsv };
