const h = require('../helper');
const async = require('async');
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'tfb-database',
  user: 'benchmarkdbuser',
  password: 'benchmarkdbpass',
  database: 'hello_world'
});
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

let cachePopulated = false;

connection.connect();

const queries = {
  GET_RANDOM_WORLD: () => "SELECT * FROM world WHERE id = " + h.randomTfbNumber(),
  ALL_FORTUNES: "SELECT * FROM fortune",
  ALL_WORLDS: "SELECT * FROM world",
  UPDATE_WORLD: (rows) => {
    return [
      "UPDATE world SET randomNumber = ", rows[0].randomNumber,
      " WHERE id = ", rows[0]['id']
    ].join('');
  }
};

const populateCache = (callback) => {
  if (cachePopulated) return callback();
  connection.query(queries.ALL_WORLDS, (err, rows) => {
    rows.forEach(r =>
      myCache.set(r.id, { id: r.id, randomNumber: r.randomNumber }));
    cachePopulated = true;
    callback();
  });
};

const mysqlRandomWorld = (callback) =>
  connection.query(queries.GET_RANDOM_WORLD(), (err, rows, fields) => {
    callback(err, rows[0]);
  });

const mysqlGetAllFortunes = (callback) =>
  connection.query(queries.ALL_FORTUNES, (err, rows, fields) => {
    callback(err, rows);
  });

const mysqlUpdateQuery = (callback) =>
  connection.query(queries.GET_RANDOM_WORLD(), (err, rows, fields) => {
    if (err) { return process.exit(1); }

    rows[0].randomNumber = h.randomTfbNumber();
    const updateQuery = queries.UPDATE_WORLD(rows);

    connection.query(updateQuery, (err, result) => {
      callback(err, rows[0]);
    });
  });

module.exports = {

  SingleQuery: (req) => {
    mysqlRandomWorld((err, result) => {
      if (err) { return process.exit(1); }

      req.sendFastObjectUnchecked(result);
    });
  },

  MultipleQueries: (queries, req) => {
    const queryFunctions = h.fillArray(mysqlRandomWorld, queries);

    async.parallel(queryFunctions, (err, results) => {
      if (err) { return process.exit(1); }

      req.sendStringifiedObject(JSON.stringify(results));
    });
  },

  CachedQueries: (queries, req) => {
    populateCache(() => {
      let worlds = [];
      for (let i = 0; i < queries; i++) {
        const key = h.randomTfbNumber() + '';
        worlds.push(myCache.get(key));
      }

      req.sendStringifiedObject(JSON.stringify(worlds));
    });
  },

  Fortunes: (req) => {
    mysqlGetAllFortunes((err, fortunes) => {
      if (err) { return process.exit(1); }

      fortunes.push(h.additionalFortune());
      fortunes.sort((a, b) => a.message.localeCompare(b.message));
      
      req.addHeader("Content-Type", "text/html; charset=UTF-8")
      req.uncheckedSendBytesText(Buffer.from(h.fortunesTemplate({
        fortunes: fortunes
      }), "utf-8"));
    });
  },

  Updates: (queries, req) => {
    const queryFunctions = h.fillArray(mysqlUpdateQuery, queries);

    async.parallel(queryFunctions, (err, results) => {
      if (err) { return process.exit(1); }

      req.sendStringifiedObject(JSON.stringify(results));
    });
  }

};
