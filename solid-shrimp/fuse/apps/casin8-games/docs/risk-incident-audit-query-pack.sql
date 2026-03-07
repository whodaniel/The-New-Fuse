-- Casin8 Risk/Compliance Incident Audit Query Pack
-- Logical tables in riskdb.json:
-- compliance_profiles, payment_orders, webhook_events, velocity_events,
-- risk_alerts, sponsorship_positions, funding_attempts

-- 1) High-risk compliance profiles
SELECT playerId, kycStatus, countryCode, amlRiskLevel, banned, updatedAt
FROM compliance_profiles
WHERE banned = 1 OR amlRiskLevel = 'high' OR kycStatus IN ('rejected','review')
ORDER BY updatedAt DESC;

-- 2) Payment orders missing webhook completion
SELECT orderId, provider, playerId, status, providerPaymentId, updatedAt
FROM payment_orders
WHERE status NOT IN ('paid','succeeded')
ORDER BY updatedAt DESC;

-- 3) Webhook replay attempts by duplicate eventId
SELECT eventId, provider, COUNT(*) AS hits
FROM webhook_events
GROUP BY eventId, provider
HAVING COUNT(*) > 1
ORDER BY hits DESC;

-- 4) Velocity spikes in trailing hour
SELECT playerId, COUNT(*) AS txCount, SUM(CAST(amountUnits AS BIGINT)) AS totalUnits
FROM velocity_events
WHERE tsMs >= (unixepoch('now') * 1000 - 3600000)
GROUP BY playerId
ORDER BY totalUnits DESC;

-- 5) Funding abuse markers
SELECT id, positionId, sponsorId, lastAttemptMs, dayCount, dayTotalPrincipalUnits
FROM funding_attempts
WHERE dayCount > 20 OR CAST(dayTotalPrincipalUnits AS BIGINT) > 1000000
ORDER BY dayTotalPrincipalUnits DESC;

-- 6) Sponsorship exposure by agent
SELECT agentId,
       SUM(CAST(fundedPrincipalUnits AS BIGINT)) AS fundedUnits,
       COUNT(*) AS positions
FROM sponsorship_positions
GROUP BY agentId
ORDER BY fundedUnits DESC;

-- 7) Latest risk alerts
SELECT id, ts, type, playerId, sponsorId, positionId, reasons
FROM risk_alerts
ORDER BY ts DESC
LIMIT 250;
