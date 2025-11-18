# Emergency Procedures

Critical procedures for handling deployment emergencies.

## 🚨 Critical Service Failure

### Immediate Actions

1. **Alert Team**
   ```bash
   # Post in team channel
   # Subject: CRITICAL - Service Down
   ```

2. **Check Service Status**
   ```bash
   railway status
   railway logs --service <failed-service>
   ```

3. **Restart Service**
   ```bash
   railway restart --service <failed-service>
   ```

4. **If Restart Fails - Rollback**
   ```bash
   ./scripts/deployment/rollback.sh <deployment-id>
   ```

## 🚨 Database Emergency

### Database Connection Lost

1. **Check DATABASE_URL**
   ```bash
   railway variables --service api-gateway
   ```

2. **Test Connection**
   ```bash
   pnpm prisma db execute --stdin <<< "SELECT 1;"
   ```

3. **Restart Database** (Railway dashboard)

### Data Corruption

1. **Stop All Services Immediately**
   ```bash
   railway down
   ```

2. **Restore from Latest Backup**
   ```bash
   # Find latest backup
   ls -ltr backups/database/

   # Restore
   psql $DATABASE_URL < backups/database/backup-<latest>.sql
   ```

3. **Verify Data Integrity**
   ```bash
   pnpm prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;"
   ```

4. **Restart Services**
   ```bash
   railway up
   ```

## 🚨 Complete System Outage

### Recovery Steps

1. **Assess Scope**
   - All services down?
   - Database accessible?
   - Network issues?

2. **Check Railway Status**
   ```bash
   railway status
   ```

3. **Emergency Rollback**
   ```bash
   # Find last known good deployment
   ls -ltr logs/deployment/*-state.json

   # Rollback
   AUTO_CONFIRM=true ./scripts/deployment/rollback.sh <deployment-id>
   ```

4. **Manual Service Start**
   ```bash
   railway up --service api-gateway
   railway up --service backend
   railway up --service frontend
   ```

## 🚨 Security Breach

### Immediate Actions

1. **Rotate All Secrets**
   ```bash
   # Generate new secrets
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Update in Railway
   railway variables --set JWT_SECRET=<new-secret>
   railway variables --set API_SECRET_KEY=<new-secret>
   ```

2. **Revoke Access Tokens**
   - Clear Redis cache
   - Force user re-login

3. **Review Access Logs**
   ```bash
   railway logs --service api-gateway | grep -i "error\|unauthorized"
   ```

4. **Notify Security Team**

## 🚨 Data Loss

### Recovery

1. **Identify Scope**
   - When did data loss occur?
   - Which tables affected?

2. **Find Closest Backup**
   ```bash
   ls -ltr backups/database/

   # Check backup metadata
   cat backups/database/backup-<id>.json
   ```

3. **Restore Specific Tables** (if possible)
   ```bash
   # Extract specific table from backup
   pg_restore -t users -d $DATABASE_URL backups/database/backup-<id>.sql
   ```

4. **Full Restore** (if necessary)
   ```bash
   # WARNING: This will overwrite current database
   psql $DATABASE_URL < backups/database/backup-<id>.sql
   ```

## 🚨 Deployment Stuck

### Resolution

1. **Check Deployment Status**
   ```bash
   railway status
   ```

2. **View Deployment Logs**
   ```bash
   railway logs
   ```

3. **Cancel Stuck Deployment**
   ```bash
   # Use Railway dashboard to cancel
   # Or force restart
   railway restart
   ```

4. **Clean Up**
   ```bash
   # Remove partial builds
   rm -rf apps/*/dist

   # Rebuild
   pnpm run build:railway
   ```

## 🚨 High Load / Performance Issue

### Quick Mitigation

1. **Scale Services**
   ```bash
   # Use Railway dashboard to scale
   # Or adjust resources
   ```

2. **Enable Caching**
   ```bash
   # Check Redis
   redis-cli -u $REDIS_URL INFO
   ```

3. **Database Optimization**
   ```sql
   -- Check slow queries
   SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
   ```

## Contact Information

### Critical Contacts

- **DevOps Lead:** [Contact Info]
- **Database Admin:** [Contact Info]
- **Security Team:** [Contact Info]
- **On-Call Engineer:** [Contact Info]

### Escalation Path

1. **Level 1:** Team Lead
2. **Level 2:** DevOps Team
3. **Level 3:** CTO / Engineering Manager

## Post-Emergency

After resolving:

1. **Document Incident** - Create incident report
2. **Post-Mortem** - Analyze root cause
3. **Improve Procedures** - Update this guide
4. **Preventive Measures** - Implement safeguards

---

**Emergency Hotline:** [Number]
**Last Updated:** 2024-11-18
