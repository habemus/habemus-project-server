function HProjectClient(options) {
  if (!options.serverURI) { throw new TypeError('serverURI is required'); }

  this.serverURI = options.serverURI.replace(TRAILING_SLASH_RE, '');
}

Object.assign(HProjectClient.prototype, require('./methods/shared'));
Object.assign(HProjectClient.prototype, require('./methods/public'));

module.exports = HProjectClient;
