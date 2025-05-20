export default class PiperTTSClient {
    #private;
    static _instance: any;
    voiceId: string;
    worker: null;
    constructor({ voiceId }?: {
        voiceId: null;
    });
    static voices(): Promise<unknown>;
    static flush(): Promise<unknown>;
    waitForBlobResponse(): Promise<unknown>;
    getAudioBlobForText(textToSpeak: any, voiceId?: null): Promise<any>;
}
