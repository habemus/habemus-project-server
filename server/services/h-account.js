// third-party
const Bluebird = require('bluebird');

const PrivateHAccount = require('h-account-client/private');

module.exports = function (app, options) {

  var hAccount = new PrivateHAccount({
    serverURI: options.hAccountURI,
  });

  return new Bluebird((resolve, reject) => {
    resolve(hAccount);
  });
};
