/** Usuario autenticado que queda en `request.user` tras validar el access token. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export type UserRole = 'user' | 'admin';
