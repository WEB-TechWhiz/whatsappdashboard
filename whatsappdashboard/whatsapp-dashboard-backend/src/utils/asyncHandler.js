// Wraps async route handlers so rejected promises reach Express's error handler
// instead of becoming unhandled rejections.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
