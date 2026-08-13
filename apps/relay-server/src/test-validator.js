const koffi = require('koffi');
const path = require('path');

const libPath = path.resolve(__dirname, '../../../packages/relay-core/native/envelope-validator/target/release/libenvelope_validator.dylib');
const lib = koffi.load(libPath);
const validate = lib.func('validate_envelope_json', 'bool', ['str']);

const validJson = JSON.stringify({
  id: "550e8400-e29b-41d4-a716-446655440000",
  version: "1.0",
  traceId: "trace-123",
  timestamp: new Date().toISOString(),
  type: "command",
  from: {
    agentId: "agent-1"
  },
  to: {
    broadcast: true
  },
  payload: {}
});

const invalidJson = JSON.stringify({
  invalid: true
});

console.log("Valid JSON:", validate(validJson));
console.log("Invalid JSON:", validate(invalidJson));
