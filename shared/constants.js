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

exports.BUILD_STATUSES = {
  NOT_SCHEDULED: 'not-scheduled',
  SCHEDULED: 'scheduled',
  STARTED: 'started',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
};

exports.VALID_BUILD_STATUSES = _objValues(exports.BUILD_STATUSES);

exports.DEPLOY_STATUSES = {
  NOT_SCHEDULED: 'not-scheduled',
  SCHEDULED: 'scheduled',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
};

exports.VALID_DEPLOY_STATUSES = _objValues(exports.DEPLOY_STATUSES);
