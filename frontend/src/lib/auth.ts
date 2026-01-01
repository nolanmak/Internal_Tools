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