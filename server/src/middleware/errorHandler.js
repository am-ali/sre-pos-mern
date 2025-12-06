function errorHandler(err, req, res, _next) {
  // Centralized error handler for predictable JSON errors.
  console.error(err); // eslint-disable-line no-console
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Unexpected error' });
}

module.exports = errorHandler;
