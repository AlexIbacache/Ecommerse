export function parseCookies(header?: string): Record<string, string> {
  const result: Record<string, string> = {};

  if (!header) {
    return result;
  }

  for (const part of header.split(';')) {
    const index = part.indexOf('=');

    if (index < 0) {
      continue;
    }

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    if (key) {
      result[key] = decodeURIComponent(value);
    }
  }

  return result;
}
