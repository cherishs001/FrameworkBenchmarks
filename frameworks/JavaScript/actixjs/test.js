const numCPUs = require('os').cpus().length;
const actixjs = require('@kaishens.cn/actixjs');

actixjs.get("/json", (req) => {
  req.sendFastObjectUnchecked([1, 2, 3]);
});

actixjs.startWithWorkerCount("0.0.0.0:8080", numCPUs);
