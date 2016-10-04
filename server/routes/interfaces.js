exports.VERSION_DATA = {
  _id: true,
  createdAt: true,
  code: true,
  number: true,
  author: true,
  srcSignedURL: true,
  distSignedURL: true,

  'buildStatus.value': true,
  'buildStatus.updatedAt': true,

  'deployStatus.value': true,
  'deployStatus.updatedAt': true,
};

exports.PROJECT_DATA = {
  _id: true,
  name: true,
  code: true,
  createdAt: true,
  updatedAt: true,

  'billingStatus.value': true,
};
