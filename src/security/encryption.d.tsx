export declare class EncryptionService {
  private readonly algorithm;
  private readonly key;
  private readonly iv;
  constructor(secretKey: string);
  encrypt(text: string): Promise<string>;
  decrypt(encryptedData: string): Promise<string>;
}
export default EncryptionService;
