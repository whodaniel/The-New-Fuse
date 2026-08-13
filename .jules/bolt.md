## 2024-08-08: Asynchronous I/O Optimization

- Replaced synchronous `fs` operations (`mkdirSync`, `writeFileSync`,
  `existsSync`) with asynchronous `fs.promises` equivalents in `LibraryImporter`
  to prevent blocking the Node.js event loop during bulk file operations.
- Discovered that `fs.existsSync` doesn't have a direct asynchronous equivalent
  returning a boolean in `fs.promises`; the standard pattern is to use
  `await fs.promises.access(path)` inside a `try/catch` block.
