export const IS_PUBLIC_KEY = 'isPublic';
export const OPTIONAL_AUTH_KEY = 'optionalAuth';
export const ROLES_KEY = 'roles';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

export const Role = {
  CLIENTE: 'CLIENTE',
  ADMINISTRADOR: 'ADMINISTRADOR',
} as const;

export type RoleName = (typeof Role)[keyof typeof Role];
