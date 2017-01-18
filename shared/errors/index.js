// native
const util = require('util');

/**
 * Base error constructor
 * @param {String} message
 */
function HProjectError(message) {
  Error.call(this);
  
  this.message = message;
};
util.inherits(HProjectError, Error);
HProjectError.prototype.name = 'HProjectError';
exports.HProjectError = HProjectError;

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
  HProjectError.call(this, message);

  this.option = option;
  this.kind = kind;
}
util.inherits(InvalidOption, HProjectError);
InvalidOption.prototype.name = 'InvalidOption';
exports.InvalidOption = InvalidOption;

/**
 * Happens whenever an action requested is not authorized
 * by the server
 * @param {String} message
 */
function Unauthorized(message) {
  HProjectError.call(this, message);
}
util.inherits(Unauthorized, HProjectError);
Unauthorized.prototype.name = 'Unauthorized';

/**
 * Happens whenever the token provided for auth is invalid
 */
function InvalidToken() {
  HProjectError.call(this, 'Token provided is invalid');
}
util.inherits(InvalidToken, HProjectError);
InvalidToken.prototype.name = 'InvalidToken';

/**
 * Happens whenever the file is too large for the server
 * @param {Number} maxFilesize Max filesize in bytes.
 */
function MaxFilesizeExceeded(maxFilesize) {
  HProjectError.call(this, 'File is too large');

  this.limit = maxFilesize;
}
util.inherits(MaxFilesizeExceeded, HProjectError);
MaxFilesizeExceeded.prototype.name = 'MaxFilesizeExceeded';

/**
 * Happens whenever an upload fails
 * @param {String} message
 */
function UploadFailed(message) {
  HProjectError.call(this, message);
}
util.inherits(UploadFailed, HProjectError);
UploadFailed.prototype.name = 'UploadFailed';

/**
 * Happens whenever an entity is not found in the database
 */
function NotFound(resource, resourceId) {
  HProjectError.call(this, 'item not found');
  
  this.resource = resource;
  this.resourceId = resourceId;
}
util.inherits(NotFound, HProjectError);
NotFound.prototype.name = 'NotFound';

/**
 * Happens whenever a resource is already in use and 
 * thus not available
 * @param {String} resource
 * @param {String} value
 */
function InUse(resource, resourceId) {
  HProjectError.call(this, 'Resource in use');

  this.resource = resource;
  this.resourceId = resourceId;
}
util.inherits(InUse, HProjectError);
InUse.prototype.name = 'InUse';

exports.Unauthorized = Unauthorized;
exports.InvalidToken = InvalidToken;
exports.MaxFilesizeExceeded = MaxFilesizeExceeded;
exports.UploadFailed = UploadFailed;
exports.NotFound = NotFound;
exports.InUse = InUse;
