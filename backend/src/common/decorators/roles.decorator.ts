import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY, type RoleName } from '../../auth/auth.constants';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
