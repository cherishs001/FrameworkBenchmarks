const h = require('../helper');
const MongoClient = require('mongodb').MongoClient;
let collectionsMaybe = null, connecting = false, connectionCallbacks = [];

const mongoUrl = 'mongodb://tfb-database:27017';
const dbName = 'hello_world';

/**
 * Note! The benchmarks say we should use "id" as a property name.
 * However, Mongo provides a default index on "_id", so to be equivalent to the other tests, we use
 * the same, default index provided by the database.
 *
 */

const getCollections = async () => {
  // mongoose creates a queue of requests during connection, so we don't have to wait.
  // however, with the raw driver we need to connect first, or sometimes the test will fail randomly
  if (collectionsMaybe) {
    return collectionsMaybe;
  }
  if (connecting) {
    const promise = new Promise((resolve) => {
      connectionCallbacks.push(resolve);
    });
    return await promise;
  }
  connecting = true;
  const client = await MongoClient.connect(mongoUrl);
  collectionsMaybe = {
    World: null,
    Fortune: null
  };
  collectionsMaybe.World = client.db(dbName).collection('world');
  collectionsMaybe.Fortune = client.db(dbName).collection('fortune');

  // resolve pending requests in buffer
  for (const callback of connectionCallbacks) {
    callback(collectionsMaybe);
  }

  return collectionsMaybe;
}

const toClientWorld = (world) => {
  if (world) {
    world.id = world._id;
    delete world._id;
  }
  return world;
};


const mongodbRandomWorld = async () => {
  const collections = await getCollections();
  return toClientWorld(await collections.World.findOne({
    _id: h.randomTfbNumber()
  }));
};

const mongodbGetAllFortunes = async () => {
  const collections = await getCollections();
  return (await collections.Fortune.find({}).toArray()).map(toClientWorld);
};

async function getUpdateRandomWorld() {
  const collections = await getCollections();
  const world = await collections.World.findOne({
    _id: h.randomTfbNumber()
  });
  world.randomNumber = h.randomTfbNumber();
  await collections.World.updateOne({
    _id: world._id
  }, {
    $set: {
      randomNumber: world.randomNumber
    }
  })
  return toClientWorld(world);
}

module.exports = {
  SingleQuery: (req) => {
    mongodbRandomWorld().then(result => {
      req.sendFastObjectUnchecked(result);
    });
  },

  MultipleQueries: (queryCount, req) => {
    const queryFunctions = [];
    for (let i = 0; i < queryCount; i++) {
      queryFunctions.push(mongodbRandomWorld());
    }
    Promise.all(queryFunctions).then((results) => {
      req.sendStringifiedObject(JSON.stringify(results));
    });
  },

  Fortunes: (req) => {
    mongodbGetAllFortunes().then((fortunes) => {
      fortunes.push(h.additionalFortune());
      fortunes.sort(function (a, b) {
        return a.message.localeCompare(b.message);
      });
      req.addHeader("Content-Type", "text/html; charset=UTF-8")
      req.uncheckedSendBytesText(Buffer.from(h.fortunesTemplate({
        fortunes: fortunes
      }), "utf-8"));
    });
  },

  Updates: (queryCount, req) => {
    const promises = [];

    for (let i = 1; i <= queryCount; i++) {
      promises.push(getUpdateRandomWorld());
    }

    Promise.all(promises).then((res) => {
      req.sendStringifiedObject(JSON.stringify(res));
    })
  }
};
