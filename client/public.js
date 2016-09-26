function HProject(options) {
  if (!options.serverURI) { throw new TypeError('serverURI is required'); }

  this.serverURI = options.serverURI.replace(TRAILING_SLASH_RE, '');
}

Object.assign(HProject.prototype, require('./methods/shared'));
Object.assign(HProject.prototype, require('./methods/public'));

module.exports = HProject;
