// constants
const TRAILING_SLASH_RE = /\/$/;

function PrivateHProjectClient(options) {
  if (!options.serverURI) { throw new TypeError('serverURI is required'); }

  this.serverURI = options.serverURI.replace(TRAILING_SLASH_RE, '');
  // private api is located at the base route '/_'
  this.serverURI = this.serverURI + '/_';
}

Object.assign(PrivateHProjectClient.prototype, require('./methods/shared'));
Object.assign(PrivateHProjectClient.prototype, require('./methods/private'));

module.exports = PrivateHProjectClient;
