const SHADOW_SHARE_PASSWORD = 'ShadowShare2025_j232jjsk7n4p8m2';

export function validatePassword(password: string): boolean {
  return password === SHADOW_SHARE_PASSWORD;
}

export function setAuthSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('shadowshare_authenticated', 'true');
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('shadowshare_authenticated') === 'true';
}

export function clearAuthSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('shadowshare_authenticated');
  }
}