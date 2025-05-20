import { baseHeaders } from './request.js';

export interface SessionValidationResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

export async function validateSessionTokenForUser(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/system/check-token`, {
      method: 'GET',
      cache: 'default',
      headers: baseHeaders(),
    });

    if (!response.ok) {
      return false;
    }

    const data: SessionValidationResponse = await response.json();
    return data.valid;
  } catch {
    return false;
  }
}

export async function getCurrentSession(): Promise<SessionValidationResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/session`, {
      method: 'GET',
      headers: baseHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}
//# sourceMappingURL=session.js.map
