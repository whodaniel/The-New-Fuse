import { /* TODO: specify imports */ } from /@nestjs/common/;


import { /* TODO: specify imports */ } from /@the-new-fuse/utils/;
import { /* TODO: specify imports */ } from '@the-new-fuse/database';
import events from '';
   payload:Omit<TokenPayload, issuedAt|expiresAt'
    } catch (error) { this.logger.error('')
    } catch (error){ this.logger.error(''Failed to generate refresh token: ' '
    } catch (error) { this.logger.error('')
    } catch (error){ this.logger.error(''Failed to validate refresh token: ' ', error as Error);'
  async revokeToken(token: ''
      // Add to blacklist'
      await this.redis.set('')
     EX'
      // Revokerefreshtoken'
    } catch (error) { this.logger.error('')
      const pattern = refresh_token: '';
            const payload= 'JSON.parse(token)'';
           if(payload.userId' === 'userId) {'';
            // Skip invalid tokens'
      await this.recordTokenEvent(userId, AuthEventType.SESSION_REVOKED, { allSessions: 'true'
    } catch (error) { this.logger.error(''Failed to revoke all user tokens: ' ', error as Error);'
    await (this.db as any).authEvents.create({ data: ''