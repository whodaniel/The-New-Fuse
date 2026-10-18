/**
 * @the-new-fuse/llm-catalog — model expiry guard
 *
 * Some provider model ids are *time-boxed*. DeepSeek issues internal-beta ids
 * that encode their own last-valid day in the id string, e.g.
 *
 *   deepseek-v4.1-flash-expires-on-0910
 *
 * Before this module existed, every consumer (llm-catalog, catalog.json,
 * scripts/sub-director/model_resolver.py) hardcoded such ids as slot-1 and
 * relied on a human to notice the date and edit three files by hand. An
 * un-noticed expiry meant each request burned a failing call before falling
 * through to slot-2.
 *
 * This module makes the id self-describing and the fall-through automatic:
 * callers pass the ordered model list through `pickActiveModel()` at *read*
 * time, so an expired beta id is skipped without any code or data edit.
 *
 * Supported id forms
 * ------------------
 *   <anything>-expires-on-YYYY-MM-DD   explicit, preferred for new ids
 *   <anything>-expires-on-MMDD         legacy beta form (year inferred)
 *
 * The model is valid *through* the end of its expiry day and is considered
 * expired from 00:00:00Z of the following day.
 *
 * Year inference for the legacy MMDD form
 * ----------------------------------------
 * MMDD carries no year. We resolve it against the year of `now`, *unless*
 * that would place the expiry more than ROLLOVER_LOOKAHEAD_DAYS in the
 * future — in which case the intended year was the previous one. This keeps
 * the guard correct across a calendar rollover:
 *
 *   now = 2026-09-10, "0910" -> 2026-09-10  (valid; last day)
 *   now = 2026-09-11, "0910" -> 2026-09-10  (expired)
 *   now = 2027-01-05, "0910" -> 2026-09-10  (expired, not 2027-09-10)
 */
/** Matches a trailing `-expires-on-MMDD` or `-expires-on-YYYY-MM-DD` suffix. */
const EXPIRY_SUFFIX = /-expires-on-(?:(\d{4})-(\d{2})-(\d{2})|(\d{2})(\d{2}))$/;
/**
 * If `now` is at most this many days before the naive same-year expiry, the
 * expiry is taken at face value; beyond it we assume a year rollover. 90 days
 * comfortably covers "the beta was minted this year and expires this year"
 * while still flipping a stale MMDD into the past after New Year.
 */
const ROLLOVER_LOOKAHEAD_DAYS = 90;
const MS_PER_DAY = 86_400_000;
function endOfUtcDay(year, month, day) {
    // 23:59:59.999Z on the expiry day — the id is valid *through* that day.
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}
/**
 * Parse the expiry moment encoded in a model id.
 *
 * @returns the last valid instant, or `null` for ids that do not expire.
 *          Returns `null` for a syntactically-expired suffix that is not a
 *          real calendar date (e.g. `-expires-on-9999`).
 */
export function parseModelExpiry(modelId, now = new Date()) {
    const m = EXPIRY_SUFFIX.exec(modelId);
    if (!m)
        return null;
    if (m[1]) {
        const year = Number(m[1]);
        const month = Number(m[2]);
        const day = Number(m[3]);
        if (month < 1 || month > 12 || day < 1 || day > 31)
            return null;
        return endOfUtcDay(year, month, day);
    }
    const month = Number(m[4]);
    const day = Number(m[5]);
    if (month < 1 || month > 12 || day < 1 || day > 31)
        return null;
    const thisYear = endOfUtcDay(now.getUTCFullYear(), month, day);
    const lookaheadMs = ROLLOVER_LOOKAHEAD_DAYS * MS_PER_DAY;
    if (thisYear.getTime() - now.getTime() > lookaheadMs) {
        return endOfUtcDay(now.getUTCFullYear() - 1, month, day);
    }
    return thisYear;
}
/**
 * True when `modelId` carries an expiry that has already passed.
 * Ids without an expiry suffix are never expired — this guard only ever
 * removes time-boxed ids, it never hides ordinary models.
 */
export function isModelExpired(modelId, now = new Date()) {
    const expiry = parseModelExpiry(modelId, now);
    return expiry !== null && now.getTime() > expiry.getTime();
}
/**
 * Return `models` with every expired id removed, preserving order.
 * If *every* id is expired the original list is returned unchanged: dropping
 * the whole list would turn a stale metadata field into a hard outage, which
 * is worse than trying an id the vendor may still serve.
 */
export function filterActiveModels(models, now = new Date(), expiryOverrides) {
    const nowMs = now.getTime();
    const isExpired = (id) => {
        const override = expiryOverrides?.[id];
        if (override) {
            const parsed = Date.parse(override);
            if (!Number.isNaN(parsed))
                return nowMs > parsed;
        }
        return isModelExpired(id, now);
    };
    const active = models.filter((id) => !isExpired(id));
    return active.length > 0 ? active : [...models];
}
/**
 * Pick the preferred model from an ordered candidate list, skipping any whose
 * encoded expiry has passed. This is the slot-1 -> slot-2 fall-through:
 *
 *   pickActiveModel(['deepseek-v4.1-flash-expires-on-0910', 'deepseek-v4-flash'])
 *     -> 'deepseek-v4.1-flash-expires-on-0910'  while the beta is live
 *     -> 'deepseek-v4-flash'                    after the expiry day
 *
 * @returns the first still-valid id, `models[0]` if all are expired, or
 *          `undefined` for an empty list.
 */
export function pickActiveModel(models, now = new Date(), expiryOverrides) {
    return filterActiveModels(models, now, expiryOverrides)[0];
}
/**
 * Whole-provider convenience wrapper: given a provider-shaped object, return a
 * copy whose `defaultModel` is no longer an expired id. Providers without a
 * `defaultModel` or `models` list are returned as-is (structurally identical,
 * not cloned) so callers can keep referential equality for untouched rows.
 */
export function withActiveDefaultModel(provider, now = new Date()) {
    const models = provider.models;
    if (!models || models.length === 0)
        return provider;
    if (provider.defaultModel && !isModelExpired(provider.defaultModel, now)) {
        // Fast path: the declared default is still valid even if a sibling id
        // in `models` has expired.
        const override = provider.modelExpiry?.[provider.defaultModel];
        if (!override || !(now.getTime() > Date.parse(override)))
            return provider;
    }
    const next = pickActiveModel(models, now, provider.modelExpiry);
    if (!next || next === provider.defaultModel)
        return provider;
    return { ...provider, defaultModel: next };
}
//# sourceMappingURL=model-expiry.js.map