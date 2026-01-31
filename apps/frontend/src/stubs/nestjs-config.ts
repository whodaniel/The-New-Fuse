export class ConfigService {
  get(key: string) {
    return (window as any).process?.env?.[key] || null;
  }
}

export class ConfigModule {
  static forRoot() {
    return {
      module: ConfigModule,
      providers: [ConfigService],
      exports: [ConfigService],
    };
  }
}

export default { ConfigService, ConfigModule };
