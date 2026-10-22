import { validateEnvironment } from './env.validation';

const validEnvironment = {
  JWT_ACCESS_SECRET: 'unit-test-only-access-secret-000000000000',
  JWT_REFRESH_SECRET: 'unit-test-only-refresh-secret-000000000000',
};

describe('validateEnvironment', () => {
  it('accepts distinct, sufficiently long secrets', () => {
    expect(validateEnvironment(validEnvironment)).toBe(validEnvironment);
  });

  it.each([
    ['missing', undefined],
    ['too short', 'short-secret'],
    ['placeholder', '<GENERATE_SECRET>'],
    ['repeated characters', 'a'.repeat(32)],
    ['surrounding whitespace', ` ${'a'.repeat(32)}`],
  ])('rejects an %s access secret without exposing its value', (_case, secret) => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, JWT_ACCESS_SECRET: secret }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('does not include a rejected secret value in the error message', () => {
    const rejectedSecret = '<GENERATE_SECRET>';

    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        JWT_ACCESS_SECRET: rejectedSecret,
      }),
    ).toThrow(
      'Invalid environment configuration: JWT_ACCESS_SECRET must be a non-placeholder secret of at least 32 characters.',
    );
  });

  it('rejects a missing refresh secret', () => {
    expect(() =>
      validateEnvironment({ JWT_ACCESS_SECRET: validEnvironment.JWT_ACCESS_SECRET }),
    ).toThrow(/JWT_REFRESH_SECRET/);
  });

  it('rejects identical access and refresh secrets', () => {
    expect(() =>
      validateEnvironment({
        JWT_ACCESS_SECRET: validEnvironment.JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET: validEnvironment.JWT_ACCESS_SECRET,
      }),
    ).toThrow(/must be different/);
  });
});
