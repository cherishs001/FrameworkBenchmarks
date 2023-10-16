const h = require('../helper');
const Mongoose = require('mongoose');
const connection = Mongoose.createConnection('mongodb://tfb-database/hello_world', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

/**
 * Note! The benchmarks say we should use "id" as a property name.
 * However, Mongo provides a default index on "_id", so to be equivalent to the other tests, we use
 * the same, default index provided by the database.
 *
 */

// Mongoose Setup
const WorldSchema = new Mongoose.Schema({
  _id: Number,
  randomNumber: Number
}, {
  collection: 'world'
});
const FortuneSchema = new Mongoose.Schema({
  _id: Number,
  message: String
}, {
  collection: 'fortune'
});

const Worlds = connection.model('World', WorldSchema);
const Fortunes = connection.model('Fortune', FortuneSchema);

const toClientWorld = (world) => {
  if (world) {
    world.id = world._id;
    delete world._id;
  }
  return world;
};

const mongooseRandomWorld = async () => {
  return toClientWorld(await Worlds.findOne({
    _id: h.randomTfbNumber()
  }).lean().exec());
};

const mongooseGetAllFortunes = async () => {
  return (await Fortunes.find({})
    .lean().exec()).map(toClientWorld);
};

async function getUpdateRandomWorld() {
  // it would be nice to use findOneAndUpdate here, but for some reason the test fails with it.
  const world = await Worlds.findOne({ _id: h.randomTfbNumber() }).lean().exec();
  world.randomNumber = h.randomTfbNumber();
  await Worlds.updateOne({
    _id: world._id
  }, {
    $set: {
      randomNumber: world.randomNumber
    }
  }).exec();
  return toClientWorld(world);
}

module.exports = {
  SingleQuery: (req) => {
    mongooseRandomWorld().then((result) => {
      req.sendFastObjectUnchecked(result);
    });
  },

  MultipleQueries: (queryCount, req) => {
    const queryFunctions = [];
    for (let i = 0; i < queryCount; i++) {
      queryFunctions.push(mongooseRandomWorld());
    }
    Promise.all(queryFunctions).then((results) => {
      req.sendFastObjectUnchecked(results);
    });
  },

  Fortunes: (req) => {
    mongooseGetAllFortunes().then((fortunes) => {
      fortunes.push(h.additionalFortune());
      fortunes.sort((a, b) => {
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
      req.sendFastObjectUnchecked(res);
    })
  }
};
