const Handlebars = require('handlebars');

module.exports = {
  additionalFortune: () => ({
    id: 0,
    message: 'Additional fortune added at request time.'
  }),

  fortunesTemplate: Handlebars.compile([
    "<!DOCTYPE html>",
    "<html>",
    "<head><title>Fortunes</title></head>",
    "<body>",
    "<table>",
    "<tr>",
    "<th>id</th>",
    "<th>message</th>",
    "</tr>",
    "{{#fortunes}}",
    "<tr>",
    "<td>{{id}}</td>",
    "<td>{{message}}</td>",
    "</tr>",
    "{{/fortunes}}",
    "</table>",
    "</body>",
    "</html>"
  ].join('')),

  randomTfbNumber: () => Math.floor(Math.random() * 10000) + 1,

  fillArray: (value, len) => {
    const arr = [];
    for (let i = 0; i < len; i++) {
      arr.push(value);
    }
    return arr;
  },

  responses: {
    routeNotImplemented: (req, res) => {
      res.writeHead(501, { 'Content-Type': 'text/plain; charset=UTF-8' });
      const reason = { reason: "`" + req.url + "` is not an implemented route" };
      res.end(JSON.stringify(reason));
    }
  }
};
