const numCPUs = require('os').cpus().length;
const actixjs = require('@kaishens.cn/actixjs');

process.env.NODE_HANDLER = 'mysql-raw';

if (process.env.TFB_TEST_NAME === 'nodejs-mongodb') {
  process.env.NODE_HANDLER = 'mongoose';
} else if (process.env.TFB_TEST_NAME === 'nodejs-mongodb-raw') {
  process.env.NODE_HANDLER = 'mongodb-raw';
} else if (process.env.TFB_TEST_NAME === 'nodejs-mysql') {
  process.env.NODE_HANDLER = 'sequelize';
} else if (process.env.TFB_TEST_NAME === 'nodejs-postgres') {
  process.env.NODE_HANDLER = 'sequelize-postgres';
}

const GREETING = "Hello, World!";
const GREETING_BUFFER = Buffer.from(GREETING, "utf-8");

const Handler = require(`./handlers/${process.env.NODE_HANDLER}`);

actixjs.get("/json", (req) => {
  req.sendFastObjectUnchecked({message: GREETING});
});

actixjs.get("/plaintext", (req) => {
  req.uncheckedSendBytesText(GREETING_BUFFER);
});

actixjs.get("/fortunes", Handler.Fortunes);

actixjs.get("/db", Handler.SingleQuery);

const roleQueries = (queries) => {
  if (queries === '' || queries === 'foo' || queries === 0) {
    return 1;
  }
  if (queries > 500) {
    return 500;
  }
  return queries;
}

actixjs.get("/queries", (req) => {
  let {queries} = req.getQueryParams();
  queries = roleQueries(queries);
  Handler.MultipleQueries(queries, req);
});

actixjs.get("/updates", (req) => {
  let {queries} = req.getQueryParams();
  queries = roleQueries(queries);
  Handler.Updates(queries, req);
});

actixjs.get("/cached", (req) => {
  let {queries} = req.getQueryParams();
  queries = roleQueries(queries);
  Handler.CachedQueries(queries, req);
});

actixjs.startWithWorkerCount("0.0.0.0:8080", numCPUs);
