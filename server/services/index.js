// third-party
const Bluebird = require('bluebird');

module.exports = function (app, options) {
  
  return Bluebird.all([
    require('./mongoose')(app, options),
    require('./log')(app, options),
    require('./gcs')(app, options),
    require('./rabbit-mq')(app, options),
    require('./message-api')(app, options),
    require('./h-account')(app, options),
  ])
  .then((services) => {

    app.services = {};

    app.services.mongoose = services[0];
    app.services.log      = services[1];
    app.services.gcs      = services[2];
    app.services.rabbitMQ = services[3];
    app.services.messageAPI = services[4];
    app.services.hAccount = services[5];

    // second batch of services
    return Bluebird.all([
      require('./h-builder-html5')(app, options),
      require('./h-website-deployer')(app, options),
    ]);
  })
  .then((services) => {
    app.services.hBuilderHTML5 = services[0];
    app.services.hWebsiteDeployer = services[1];

    return;
  });
};