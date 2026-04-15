export default class FormDataStub {
  append(_key: string, _value: unknown): void {
    throw new Error('form-data (Node) is not supported in browser bundles.');
  }
}
