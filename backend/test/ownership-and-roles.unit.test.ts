import { describe, expect, it } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { requireOwnershipOrAdmin } from '../src/common/utils/ownership';

function makeContext(user: unknown): any {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
}

describe('requireOwnershipOrAdmin', () => {
  it('permite al administrador cualquier recurso', () => {
    expect(() =>
      requireOwnershipOrAdmin({ id: 1, role: 'ADMINISTRADOR' }, 99),
    ).not.toThrow();
  });

  it('permite al cliente su propio recurso', () => {
    expect(() =>
      requireOwnershipOrAdmin({ id: 2, role: 'CLIENTE' }, 2),
    ).not.toThrow();
  });

  it('rechaza al cliente un recurso ajeno con 404', () => {
    expect(() =>
      requireOwnershipOrAdmin({ id: 2, role: 'CLIENTE' }, 3),
    ).toThrow(NotFoundException);
  });
});

describe('RolesGuard', () => {
  it('permite cuando no hay roles requeridos', () => {
    const guard = new RolesGuard({ getAllAndOverride: () => undefined } as any);
    expect(guard.canActivate(makeContext(undefined))).toBe(true);
  });

  it('rechaza con 401 si no hay usuario autenticado', () => {
    const guard = new RolesGuard({
      getAllAndOverride: () => ['ADMINISTRADOR'],
    } as any);
    expect(() => guard.canActivate(makeContext(undefined))).toThrowError(
      'No autenticado',
    );
  });

  it('rechaza con 403 si el rol es insuficiente', () => {
    const guard = new RolesGuard({
      getAllAndOverride: () => ['ADMINISTRADOR'],
    } as any);
    expect(() =>
      guard.canActivate(makeContext({ id: 1, role: 'CLIENTE' })),
    ).toThrowError('No tienes permisos');
  });

  it('permite con el rol requerido', () => {
    const guard = new RolesGuard({
      getAllAndOverride: () => ['ADMINISTRADOR'],
    } as any);
    expect(
      guard.canActivate(makeContext({ id: 1, role: 'ADMINISTRADOR' })),
    ).toBe(true);
  });
});
