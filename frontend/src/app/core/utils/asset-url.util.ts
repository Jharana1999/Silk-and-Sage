import { environment } from '../../../environments/environment';

export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = environment.assetsBaseUrl ?? '';
  if (!base) return url;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}
