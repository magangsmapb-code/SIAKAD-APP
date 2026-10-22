const REQUIRED_JWT_SECRETS = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;
const PLACEHOLDER_PATTERN = /<[^>]+>|GENERATE_|CHANGE_ME|YOUR_|PLACEHOLDER|EXAMPLE/i;

export function validateEnvironment(config: Record<string, unknown>) {
  const secrets = REQUIRED_JWT_SECRETS.map((name) => {
    const value = config[name];
    if (
      typeof value !== 'string' ||
      value.length < 32 ||
      value.trim() !== value ||
      PLACEHOLDER_PATTERN.test(value) ||
      /^(.)\1{15,}$/.test(value)
    ) {
      throw new Error(
        `Invalid environment configuration: ${name} must be a non-placeholder secret of at least 32 characters.`,
      );
    }
    return value;
  });

  if (secrets[0] === secrets[1]) {
    throw new Error('Invalid environment configuration: JWT secrets must be different.');
  }

  return config;
}
