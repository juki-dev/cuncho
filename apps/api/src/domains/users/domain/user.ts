import type { UserRole } from '../../../shared/types';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

/** Solo para el dominio auth: incluye el hash de la contraseña. */
export interface UserWithCredentials extends User {
  passwordHash: string;
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('El correo ya está registrado');
  }
}

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();
