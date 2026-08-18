// 404 handler middleware
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.originalUrl}`,
    },
  });
};
