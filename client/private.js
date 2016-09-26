// constants
const TRAILING_SLASH_RE = /\/$/;

const aux = require('./aux');

function PrivateHProjectClient(options) {
  if (!options.serverURI) { throw new TypeError('serverURI is required'); }

  this.serverURI = options.serverURI.replace(TRAILING_SLASH_RE, '');
  // private api is located at the base route '/_'
  this.serverURI = this.serverURI + '/_';

  /**
   * Private auxiliary method
   * that makes authenticated requests to the server
   * @type {Function}
   * @private
   */
  this._authReq = aux.authReq.bind(this);
}

Object.assign(PrivateHProjectClient.prototype, require('./methods/shared'));
Object.assign(PrivateHProjectClient.prototype, require('./methods/private'));

module.exports = PrivateHProjectClient;
