# TNF Enhancement Opportunities

## Identified Gaps & Opportunities

### 1. 🔴 CRITICAL: Cloud Database Configuration

- **Issue**: DATABASE_URL points to local Postgres
- **Impact**: Violates cloud-first policy, fails TNF doctor
- **Fix**: Configure Railway DATABASE_URL or migrate to cloud DB

### 2. 🟡 Test Coverage Gaps

- **Issue**: Only ~8 packages have tests
- **Impact**: 81 packages, most untested
- **Opportunity**: CodeQuality-Agent can add tests

### 3. 🟡 Meta-Skills Missing Tests

- **Issue**: Meta-skills at 3/4 (missing test coverage)
- **Impact**: Quality gaps in self-improving capabilities

### 4. 🟢 Redis Not Running

- **Issue**: Local Redis port 6380 closed
- **Impact**: Agent messaging may fail
- **Fix**: Start Redis or use cloud Redis

### 5. 🟢 Local Services Not Running

- **Issue**: Frontend :3000, API :3001, Backend :3004 all closed
- **Impact**: Can't test locally
- **Fix**: Start services for local development

### 6. 🟡 Agent Idle Status

- **Issue**: Most agents show 🔴 (offline)
- **Impact**: Not receiving tasks
- **Fix**: Keep agents running or use one-shot delegation

### 7. 🟢 Automation Opportunities

- **Jules**: Not running supervisor
- **Super-cycle**: Not active
- **Skill bank**: Could sync more often

### 8. 🟢 Documentation Gaps

- Many skills have no tests
- Some docs may be outdated

---

## Recommended Actions

### Immediate (P0)

1. Fix DATABASE_URL to use cloud DB
2. Start Redis for agent messaging

### Short-term (P1)

3. Add test coverage for critical packages
4. Add meta-skill tests
5. Set up Jules supervisor automation

### Medium-term (P2)

6. Create more specialized agents
7. Expand skill bank
8. Add integration tests

---

## New Agent Ideas

- **DataAgent**: Database queries, migrations
- **APIAgent**: API development, testing
- **MobileAgent**: Mobile app development
- **CloudAgent**: Cloud infrastructure (AWS, GCP)
- **ResearchAgent**: Web research, competitive analysis

---

_Generated: 2026-03-23_
