/**
 * Tests for utils/config.ts
 * - Bypasses the global config mock in setup.ts using requireActual
 * - Mocks dotenv to avoid reading real .env
 */

jest.mock('dotenv', () => ({ config: jest.fn() })); // don't read .env

type ConfigModule = typeof import('../../utils/config.js');

// helper: run fn with temporary env vars, then restore
function withEnv(vars: Record<string, string | undefined>, fn: () => void | Promise<void>) {
  const prev = { ...process.env };
  Object.assign(process.env, vars);
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      process.env = prev;
    });
}

// NOTE: Don't import ../../utils/config.js at top-level; we want fresh module state per test.

describe('utils/config', () => {
  beforeEach(() => {
    jest.resetModules(); // clear module cache (important for cachedConfig)
    jest.clearAllMocks();
  });

  it('loadConfig returns validated config from env', async () => {
    await withEnv(
      {
        PORT: '3001',
        HOST: 'localhost',
        LOG_LEVEL: 'error',
        ENABLE_HEALTH_CHECK: 'true',
        MAX_REQUEST_SIZE: '10mb',
        CORS_ORIGINS: 'http://a.com, http://b.com',
        NODE_ENV: 'test',
      },
      () => {
        jest.isolateModules(() => {
          const mod = jest.requireActual('../../utils/config.js') as ConfigModule;
          mod.resetConfigCache();
          const cfg = mod.loadConfig();

          // Basic shape assertions (match your fields)
          expect(cfg.port).toBe(3001);
          expect(cfg.host).toBe('localhost');
          expect(cfg.logLevel).toBe('error');
          expect(cfg.enableHealthCheck).toBe(true);
          expect(cfg.maxRequestSize).toBe('10mb');
          expect(cfg.environment).toBe('test');
          expect(Array.isArray(cfg.corsOrigins)).toBe(true);
          expect(cfg.corsOrigins).toEqual(['http://a.com', 'http://b.com']);
        });
      }
    );
  });

  it('getConfig caches until resetConfigCache is called', async () => {
    await withEnv(
      {
        PORT: '3000',
        HOST: 'localhost',
        LOG_LEVEL: 'error',
        ENABLE_HEALTH_CHECK: 'false',
        NODE_ENV: 'test',
      },
      () => {
        jest.isolateModules(() => {
          const mod = jest.requireActual('../../utils/config.js') as ConfigModule;
          mod.resetConfigCache();

          const first = mod.getConfig();
          expect(first.port).toBe(3000);

          // Change env but should still return cached value
          process.env.PORT = '4000';
          const second = mod.getConfig();
          expect(second.port).toBe(3000);

          // After reset, it should pick up new env
          mod.resetConfigCache();
          const third = mod.getConfig();
          expect(third.port).toBe(4000);
        });
      }
    );
  });

  it('validateConfig exits with code 1 on invalid configuration', async () => {
    // Make it invalid: omit required fields like HOST/LOG_LEVEL (assuming schema requires them)
    await withEnv(
      {
        PORT: 'abc', // will parse to NaN & likely fail schema
        HOST: undefined,
        LOG_LEVEL: undefined,
        ENABLE_HEALTH_CHECK: 'true',
        NODE_ENV: 'production',
      },
      () => {
        jest.isolateModules(() => {
          const mod = jest.requireActual('../../utils/config.js') as ConfigModule;

          const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((
            code?: string | number | null | undefined
          ): never => {
            throw new Error(`__exit__:${code ?? ''}`);
          }) as unknown as (code?: string | number | null | undefined) => never);

          const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

          expect(() => mod.validateConfig()).toThrow(/__exit__:1/);
          expect(exitSpy).toHaveBeenCalledWith(1);

          // Optional: ensure we logged something
          expect(errorSpy).toHaveBeenCalled();

          exitSpy.mockRestore();
          errorSpy.mockRestore();
        });
      }
    );
  });

  it('isDevelopment / isProduction / isTest reflect environment', async () => {
    await withEnv(
      { NODE_ENV: 'development', HOST: 'localhost', LOG_LEVEL: 'error', PORT: '3000' },
      () => {
        jest.isolateModules(() => {
          const mod = jest.requireActual('../../utils/config.js') as ConfigModule;
          mod.resetConfigCache();
          expect(mod.isDevelopment()).toBe(true);
          expect(mod.isProduction()).toBe(false);
          expect(mod.isTest()).toBe(false);
        });
      }
    );

    await withEnv(
      { NODE_ENV: 'production', HOST: 'localhost', LOG_LEVEL: 'error', PORT: '3000' },
      () => {
        jest.isolateModules(() => {
          const mod = jest.requireActual('../../utils/config.js') as ConfigModule;
          mod.resetConfigCache();
          expect(mod.isDevelopment()).toBe(false);
          expect(mod.isProduction()).toBe(true);
          expect(mod.isTest()).toBe(false);
        });
      }
    );

    await withEnv({ NODE_ENV: 'test', HOST: 'localhost', LOG_LEVEL: 'error', PORT: '3000' }, () => {
      jest.isolateModules(() => {
        const mod = jest.requireActual('../../utils/config.js') as ConfigModule;
        mod.resetConfigCache();
        expect(mod.isDevelopment()).toBe(false);
        expect(mod.isProduction()).toBe(false);
        expect(mod.isTest()).toBe(true);
      });
    });
  });
});
