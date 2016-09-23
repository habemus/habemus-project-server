// third-party
const Bluebird = require('bluebird');

module.exports = function (app, options) {
  
  // instantiate services
  app.services = {};
  
  return Bluebird.all([
    require('./mongoose')(app, options),
    require('./log')(app, options),
    require('./gcs')(app, options),
    // require('./rabbit-mq')(app, options),
  ])
  .then((services) => {

    app.services = {};

    app.services.mongoose = services[0];
    app.services.log      = services[1];
    app.services.gcs      = services[2];
    // app.services.rabbitMQ = services[2];

    return;
  });
};