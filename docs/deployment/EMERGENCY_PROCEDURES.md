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
   cloud_runtime status
   cloud_runtime logs --service <failed-service>
   ```

3. **Restart Service**
   ```bash
   cloud_runtime restart --service <failed-service>
   ```

4. **If Restart Fails - Rollback**
   ```bash
   ./scripts/deployment/rollback.sh <deployment-id>
   ```

## 🚨 Database Emergency

### Database Connection Lost

1. **Check DATABASE_URL**
   ```bash
   cloud_runtime variables --service api-gateway
   ```

2. **Test Connection**
   ```bash
   pnpm drizzle db execute --stdin <<< "SELECT 1;"
   ```

3. **Restart Database** (CloudRuntime dashboard)

### Data Corruption

1. **Stop All Services Immediately**
   ```bash
   cloud_runtime down
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
   pnpm drizzle db execute --stdin <<< "SELECT COUNT(*) FROM users;"
   ```

4. **Restart Services**
   ```bash
   cloud_runtime up
   ```

## 🚨 Complete System Outage

### Recovery Steps

1. **Assess Scope**
   - All services down?
   - Database accessible?
   - Network issues?

2. **Check CloudRuntime Status**
   ```bash
   cloud_runtime status
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
   cloud_runtime up --service api-gateway
   cloud_runtime up --service backend
   cloud_runtime up --service frontend
   ```

## 🚨 Security Breach

### Immediate Actions

1. **Rotate All Secrets**
   ```bash
   # Generate new secrets
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Update in CloudRuntime
   cloud_runtime variables --set JWT_SECRET=<new-secret>
   cloud_runtime variables --set API_SECRET_KEY=<new-secret>
   ```

2. **Revoke Access Tokens**
   - Clear Redis cache
   - Force user re-login

3. **Review Access Logs**
   ```bash
   cloud_runtime logs --service api-gateway | grep -i "error\|unauthorized"
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
   cloud_runtime status
   ```

2. **View Deployment Logs**
   ```bash
   cloud_runtime logs
   ```

3. **Cancel Stuck Deployment**
   ```bash
   # Use CloudRuntime dashboard to cancel
   # Or force restart
   cloud_runtime restart
   ```

4. **Clean Up**
   ```bash
   # Remove partial builds
   rm -rf apps/*/dist

   # Rebuild
   pnpm run build:cloud_runtime
   ```

## 🚨 High Load / Performance Issue

### Quick Mitigation

1. **Scale Services**
   ```bash
   # Use CloudRuntime dashboard to scale
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
