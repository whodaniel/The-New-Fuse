import { Agent } from './Agent';
import { Pipeline } from './Pipeline';
import { AuthSession } from './AuthSession';
import { LoginAttempt } from './LoginAttempt';
import { AuthEvent } from './AuthEvent';
export declare class User {
    id: string;
    email: string;
    hashedPassword: string;
    name: string;
    role: string;
    refreshToken: string | null;
    agents: Agent[];
    pipelines: Pipeline[];
    authSessions: AuthSession[];
    loginAttempts: LoginAttempt[];
    authEvents: AuthEvent[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
//# sourceMappingURL=User.d.ts.map