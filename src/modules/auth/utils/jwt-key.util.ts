export function getJwtPrivateKey(): string {
  return normalizePem(process.env.JWT_PRIVATE_KEY, 'JWT_PRIVATE_KEY');
}

export function getJwtPublicKey(): string {
  return normalizePem(process.env.JWT_PUBLIC_KEY, 'JWT_PUBLIC_KEY');
}

function normalizePem(value: string | undefined, name: string): string {
  if (!value || value.startsWith('YOUR_')) {
    throw new Error(`${name} is required`);
  }
  return value.replace(/\\n/g, '\n');
}
