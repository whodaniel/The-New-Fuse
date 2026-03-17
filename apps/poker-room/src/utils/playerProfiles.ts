export type PlayerControlMode = 'human' | 'hybrid' | 'agent';

export type PlayerProfile = {
  id: string;
  name: string;
  avatar: string;
  controlMode: PlayerControlMode;
  createdAt: string;
};

const STORAGE_KEY = 'tnf_player_profiles';

const normalizeName = (value: string) => value.trim().toLowerCase();

export const loadProfiles = (): PlayerProfile[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p && typeof p.name === 'string');
  } catch {
    return [];
  }
};

export const saveProfiles = (profiles: PlayerProfile[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
};

export const findProfileByName = (profiles: PlayerProfile[], name: string) => {
  const key = normalizeName(name);
  return profiles.find((p) => normalizeName(p.name) === key) || null;
};

export const upsertProfile = (profiles: PlayerProfile[], profile: PlayerProfile) => {
  const key = normalizeName(profile.name);
  const next = profiles.filter((p) => normalizeName(p.name) !== key);
  next.push(profile);
  return next;
};

export const removeProfile = (profiles: PlayerProfile[], name: string) => {
  const key = normalizeName(name);
  return profiles.filter((p) => normalizeName(p.name) !== key);
};

export const createProfileId = (name: string) =>
  `player-${normalizeName(name).replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
