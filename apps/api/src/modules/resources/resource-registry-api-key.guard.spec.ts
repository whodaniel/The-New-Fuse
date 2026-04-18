import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { ResourceRegistryApiKeyGuard } from './resource-registry-api-key.guard';

type RequestShape = Pick<Request, 'get'>;

describe('ResourceRegistryApiKeyGuard', () => {
  const makeContext = (headers: Record<string, string | undefined>): ExecutionContext => {
    const request: RequestShape = {
      get(name: string) {
        const key = Object.keys(headers).find((header) => header.toLowerCase() === name.toLowerCase());
        return key ? headers[key] : undefined;
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  const makeConfig = (values: Record<string, string | undefined>): ConfigService =>
    ({
      get: (key: string) => values[key],
    }) as unknown as ConfigService;

  it('allows matching x-api-key values', () => {
    const guard = new ResourceRegistryApiKeyGuard(
      makeConfig({
        RESOURCE_REGISTRY_API_KEY: 'registry-key',
      })
    );

    expect(
      guard.canActivate(
        makeContext({
          'x-api-key': 'registry-key',
        })
      )
    ).toBe(true);
  });

  it('allows matching bearer tokens', () => {
    const guard = new ResourceRegistryApiKeyGuard(
      makeConfig({
        SUPER_ADMIN_TOKEN: 'super-token',
      })
    );

    expect(
      guard.canActivate(
        makeContext({
          authorization: 'Bearer super-token',
        })
      )
    ).toBe(true);
  });

  it('rejects requests when ingest auth is not configured', () => {
    const guard = new ResourceRegistryApiKeyGuard(makeConfig({}));

    expect(() => guard.canActivate(makeContext({}))).toThrow(UnauthorizedException);
  });

  it('rejects mismatched credentials', () => {
    const guard = new ResourceRegistryApiKeyGuard(
      makeConfig({
        API_KEY: 'expected-key',
      })
    );

    expect(
      () =>
        guard.canActivate(
          makeContext({
            'x-api-key': 'wrong-key',
          })
        )
    ).toThrow(UnauthorizedException);
  });
});
