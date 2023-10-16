const h = require('../helper');

const Sequelize = require('sequelize');
const sequelize = new Sequelize('hello_world', 'benchmarkdbuser', 'benchmarkdbpass', {
  host: 'tfb-database',
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 50,
    min: 0,
    idle: 10000
  }
});

const Worlds = sequelize.define('world', {
  id: {
    type: 'Sequelize.INTEGER',
    primaryKey: true
  },
  randomnumber: { type: 'Sequelize.INTEGER' }
}, {
    timestamps: false,
    freezeTableName: true
  });

const Fortunes = sequelize.define('fortune', {
  id: {
    type: 'Sequelize.INTEGER',
    primaryKey: true
  },
  message: { type: 'Sequelize.STRING' }
}, {
    timestamps: false,
    freezeTableName: true
  });

const randomWorldPromise = () => {
  return Worlds.findOne({
    where: { id: h.randomTfbNumber() }
  }).then((results) => {
    return results;
  }).catch((err) => process.exit(1));
};

module.exports = {

  SingleQuery: (req) => {
    randomWorldPromise().then((world) => {
      req.sendFastObjectUnchecked(world);
    });
  },

  MultipleQueries: (queries, req) => {
    const worldPromises = [];

    for (let i = 0; i < queries; i++) {
      worldPromises.push(randomWorldPromise());
    }

    Promise.all(worldPromises).then((worlds) => {
      req.sendFastObjectUnchecked(worlds);
    });
  },

  Fortunes: (req) => {
    Fortunes.findAll().then((fortunes) => {
      fortunes.push(h.additionalFortune());
      fortunes.sort((a, b) => a.message.localeCompare(b.message));

      req.addHeader("Content-Type", "text/html; charset=UTF-8")
      req.uncheckedSendBytesText(Buffer.from(h.fortunesTemplate({
        fortunes: fortunes
      }), "utf-8"));
    }).catch((err) => process.exit(1));
  },

  Updates: (queries, req) => {
    const worldPromises = [];

    for (let i = 0; i < queries; i++) {
      worldPromises.push(randomWorldPromise());
    }

    const worldUpdate = (world) => {
      world.randomnumber = h.randomTfbNumber();

      return Worlds.update({
        randomnumber: world.randomnumber
      },
        {
          where: { id: world.id }
        }).then((results) => {
          return world;
        }).catch((err) => process.exit(1));
    };

    Promise.all(worldPromises).then((worlds) => {
      const updates = worlds.map((e) => worldUpdate(e));

      Promise.all(updates).then((updated) => {
        req.sendFastObjectUnchecked(updated);
      });
    });
  }

};
