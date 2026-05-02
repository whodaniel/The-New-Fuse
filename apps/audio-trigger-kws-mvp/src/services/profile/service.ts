import path from 'node:path';
import fs from 'node:fs';
import { UserProfile, ProfileUpdate, DEFAULT_PROFILE } from './schema';

export class ProfileService {
  private profiles: Map<string, UserProfile> = new Map();
  private readonly profilesDir: string;

  constructor() {
    this.profilesDir = path.join(__dirname, '..', '..', 'configs', 'profiles');
    this.loadFromStorage();
    // Ensure default profile exists
    if (!this.profiles.has('default')) {
      this.profiles.set('default', DEFAULT_PROFILE);
    }
  }

  /**
   * Get the resolved profiles directory path
   */
  getProfilesDirectory(): string {
    return this.profilesDir;
  }

  /**
   * Get a user profile by ID
   */
  getProfile(userId: string): UserProfile | undefined {
    return this.profiles.get(userId);
  }

  /**
   * Create or update a user profile
   */
  updateProfile(userId: string, update: ProfileUpdate): UserProfile {
    const existing = this.profiles.get(userId) || { ...DEFAULT_PROFILE, id: userId };
    const now = new Date().toISOString();

    // Deep merge to handle Partial<Record> fields properly
    const mergedThresholds: Record<string, number> = { ...existing.triggerThresholds };
    if (update.triggerThresholds) {
      for (const [k, v] of Object.entries(update.triggerThresholds)) {
        if (v !== undefined) {
          mergedThresholds[k] = v;
        }
      }
    }

    const mergedKeywordSets: Record<string, string[]> = { ...existing.keywordSets };
    if (update.keywordSets) {
      for (const [k, v] of Object.entries(update.keywordSets)) {
        if (v !== undefined) {
          mergedKeywordSets[k] = v;
        }
      }
    }

    const updated: UserProfile = {
      ...existing,
      name: update.name ?? existing.name,
      age: update.age ?? existing.age,
      location: update.location ?? existing.location,
      interests: update.interests ?? existing.interests,
      triggerThresholds: mergedThresholds,
      keywordSets: mergedKeywordSets,
      researchData: update.researchData
        ? { ...existing.researchData, ...update.researchData }
        : existing.researchData,
      preferences: update.preferences
        ? { ...existing.preferences, ...update.preferences }
        : existing.preferences,
      updatedAt: now,
    };

    // If this is a new profile, set createdAt
    if (!this.profiles.has(userId)) {
      updated.createdAt = now;
    }

    this.profiles.set(userId, updated);
    this.saveToStorage(userId);
    return updated;
  }

  /**
   * Get all profile IDs
   */
  getProfileIds(): string[] {
    return Array.from(this.profiles.keys());
  }

  /**
   * Get personalized trigger threshold for a term
   */
  getTriggerThreshold(userId: string, term: string): number | undefined {
    const profile = this.profiles.get(userId);
    return profile?.triggerThresholds?.[term];
  }

  /**
   * Get personalized keyword set for a category
   */
  getKeywordSet(userId: string, category: string): string[] | undefined {
    const profile = this.profiles.get(userId);
    return profile?.keywordSets?.[category];
  }

  /**
   * Check if assistive actions are enabled for user
   */
  areAssistiveActionsEnabled(userId: string): boolean {
    const profile = this.profiles.get(userId);
    return profile?.preferences?.assistiveActions ?? true;
  }

  /**
   * Get feedback frequency for user
   */
  getFeedbackFrequency(userId: string): 'low' | 'medium' | 'high' {
    const profile = this.profiles.get(userId);
    return profile?.preferences?.feedbackFrequency ?? 'medium';
  }

  /**
   * Save a single profile as <userId>.json to the profiles directory
   */
  private saveToStorage(userId?: string): void {
    try {
      if (!fs.existsSync(this.profilesDir)) {
        fs.mkdirSync(this.profilesDir, { recursive: true });
      }

      if (userId) {
        const filePath = path.join(this.profilesDir, `${userId}.json`);
        const profile = this.profiles.get(userId);
        if (profile) {
          fs.writeFileSync(filePath, JSON.stringify(profile, null, 2), 'utf8');
        }
      } else {
        // Save all profiles if no specific userId provided
        for (const [id, profile] of this.profiles.entries()) {
          const filePath = path.join(this.profilesDir, `${id}.json`);
          fs.writeFileSync(filePath, JSON.stringify(profile, null, 2), 'utf8');
        }
      }
    } catch (error) {
      console.error('[ProfileService] Failed to save profiles:', error);
    }
  }

  /**
   * Load profiles from the profiles directory (sync, for use in constructor)
   */
  private loadFromStorage(): void {
    try {
      if (!fs.existsSync(this.profilesDir)) {
        console.log('[ProfileService] Profiles directory not found, starting with defaults');
        return;
      }

      const files = fs.readdirSync(this.profilesDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const filePath = path.join(this.profilesDir, file);
        try {
          const data = fs.readFileSync(filePath, 'utf8');
          const profile: UserProfile = JSON.parse(data);
          if (profile && profile.id) {
            this.profiles.set(profile.id, profile);
          }
        } catch (parseError) {
          console.error(`[ProfileService] Failed to parse ${file}:`, parseError);
        }
      }

      console.log(`[ProfileService] Loaded ${this.profiles.size} profile(s) from ${this.profilesDir}`);
    } catch (error) {
      console.error('[ProfileService] Failed to load profiles:', error);
    }
  }
}

// Export a singleton instance
export const profileService = new ProfileService();
