import { SetMetadata } from '@nestjs/common';
import { OPTIONAL_AUTH_KEY } from '../../auth/auth.constants';

/**
 * Permite la ruta con sesión opcional: si hay cookie válida se autentica al
 * usuario; si no hay cookie, la request continúa como anónima.
 */
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_KEY, true);
