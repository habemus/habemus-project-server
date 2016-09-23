// native
const util = require('util');

/**
 * Base error constructor
 * @param {String} message
 */
function HProjectManagerError(message) {
  Error.call(this);
  
  this.message = message;
};
util.inherits(HProjectManagerError, Error);
HProjectManagerError.prototype.name = 'HProjectManagerError';
exports.HProjectManagerError = HProjectManagerError;

/**
 * Happens when any required option is invalid
 *
 * error.option should have the option that is invalid
 * error.kind should contain details on the error type
 * 
 * @param {String} option
 * @param {String} kind
 * @param {String} message
 */
function InvalidOption(option, kind, message) {
  HProjectManagerError.call(this, message);

  this.option = option;
  this.kind = kind;
}
util.inherits(InvalidOption, HProjectManagerError);
InvalidOption.prototype.name = 'InvalidOption';
exports.InvalidOption = InvalidOption;

/**
 * Happens whenever an action requested is not authorized
 * by the server
 * @param {String} message
 */
function Unauthorized(message) {
  HProjectManagerError.call(this, message);
}
util.inherits(Unauthorized, HProjectManagerError);
Unauthorized.prototype.name = 'Unauthorized';

/**
 * Happens whenever the token provided for auth is invalid
 */
function InvalidToken() {
  HProjectManagerError.call(this, 'Token provided is invalid');
}
util.inherits(InvalidToken, HProjectManagerError);
InvalidToken.prototype.name = 'InvalidToken';

/**
 * Happens whenever the file is too large for the server
 * @param {Number} maxFilesize Max filesize in bytes.
 */
function MaxFilesizeExceeded(maxFilesize) {
  HProjectManagerError.call(this, 'File is too large');

  this.limit = maxFilesize;
}
util.inherits(MaxFilesizeExceeded, HProjectManagerError);
MaxFilesizeExceeded.prototype.name = 'MaxFilesizeExceeded';

/**
 * Happens whenever an entity is not found in the database
 */
function NotFound(resource, resourceId) {
  HProjectManagerError.call(this, 'item not found');
  
  this.resource = resource;
  this.resourceId = resourceId;
}
util.inherits(NotFound, HProjectManagerError);
NotFound.prototype.name = 'NotFound';

/**
 * Happens whenever a resource is already in use and 
 * thus not available
 * @param {String} resource
 * @param {String} value
 */
function InUse(resource, resourceId) {
  HProjectManagerError.call(this, 'Resource in use');

  this.resource = resource;
  this.resourceId = resourceId;
}
util.inherits(InUse, HProjectManagerError);
InUse.prototype.name = 'InUse';

exports.Unauthorized = Unauthorized;
exports.InvalidToken = InvalidToken;
exports.MaxFilesizeExceeded = MaxFilesizeExceeded;
exports.NotFound = NotFound;
exports.InUse = InUse;
