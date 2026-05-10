
export function getApiBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (configuredBaseUrl && configuredBaseUrl.trim()) {
    return normalizeClientApiBaseUrl(configuredBaseUrl.replace(/\/$/, ''));
  }

  return normalizeClientApiBaseUrl('http://localhost:8020');
}

function normalizeClientApiBaseUrl(baseUrl: string): string {
  if (typeof window === 'undefined') {
    return baseUrl;
  }

  const browserHost = window.location.hostname;
  if (browserHost === 'localhost' || browserHost === '127.0.0.1') {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = browserHost;
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    return baseUrl;
  }

  return baseUrl;
}
