import { NotFoundException } from '@nestjs/common';
import { Role } from '../../auth/auth.constants';

/**
 * Verifica que el usuario autenticado sea dueño del recurso o administrador.
 * Un recurso ajeno se reporta como 404 para no revelar su existencia.
 */
export function requireOwnershipOrAdmin(
  current: { id: number; role: string },
  ownerId: number,
): void {
  if (current.role !== Role.ADMINISTRADOR && current.id !== ownerId) {
    throw new NotFoundException('Recurso no encontrado');
  }
}
