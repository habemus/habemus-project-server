function _objValues(obj) {
  return Object.keys(obj).map((key) => {
    return obj[key];
  });
}

exports.PROJECT_STATUSES = {
  ACTIVE: 'active',
  SCHEDULED_FOR_REMOVAL: 'scheduled-for-removal',
};

exports.VALID_PROJECT_STATUSES = _objValues(exports.PROJECT_STATUSES);

exports.PROJECT_PERMISSIONS = {
  READ: 'read',
  UPDATE: 'update',
  WRITE: 'write',
  DELETE: 'delete',
};

exports.VALID_PROJECT_PERMISSIONS = _objValues(exports.PROJECT_PERMISSIONS);
