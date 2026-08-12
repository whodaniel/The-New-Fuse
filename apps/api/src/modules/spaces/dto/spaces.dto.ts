export class CreateSpaceDto {
  name!: string;
  subdomain!: string;
  plan?: 'free' | 'basic' | 'pro' | 'ultra';
}

export class UpdateSpaceDto {
  name?: string;
  plan?: 'free' | 'basic' | 'pro' | 'ultra';
  status?: 'active' | 'suspended';
  customDomains?: string[];
}

export class UpsertSpaceRouteDto {
  path!: string;
  routeType!: 'page' | 'api';
  code!: string;
  public?: boolean;
}

export class RegisterSpaceAssetDto {
  assetPath!: string;
  fileSize!: number;
  mimeType!: string;
  storageKey!: string;
}
