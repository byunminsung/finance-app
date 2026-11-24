/** Allowlist pattern for ticker symbols: uppercase letters/digits plus "." and "-", up to 10 chars. */
const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;

export function isValidSymbol(symbol: string): boolean {
  return SYMBOL_PATTERN.test(symbol);
}

/** Trims and uppercases user input. Validation is a separate step (isValidSymbol). */
export function normalizeSymbol(input: string): string {
  return input.trim().toUpperCase();
}
