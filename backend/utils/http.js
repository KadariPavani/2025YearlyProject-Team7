// Lightweight HTTP response helpers to standardize API outputs

const build = (res, statusCode, payload) => {
  return res.status(statusCode).json(payload);
};

const ok = (res, payload = { success: true }) => build(res, 200, payload);
const created = (res, payload) => build(res, 201, payload);
const noContent = (res) => res.status(204).end();

const badRequest = (res, message, extra = {}) =>
  build(res, 200, { success: false, message, ...extra });
const unauthorized = (res, message = 'Unauthorized', extra = {}) =>
  build(res, 200, { success: false, message, ...extra });
const forbidden = (res, message = 'Forbidden', extra = {}) =>
  build(res, 200, { success: false, message, ...extra });
const notFound = (res, message = 'Not found', extra = {}) =>
  build(res, 200, { success: false, message, ...extra });
const serverError = (res, message = 'Internal server error', extra = {}) =>
  build(res, 500, { success: false, message, ...extra });

module.exports = {
  ok,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
};


