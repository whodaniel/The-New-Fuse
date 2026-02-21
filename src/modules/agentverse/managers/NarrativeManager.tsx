export class NarrativeManager {
  private scene: AgentverseScene;
  private activeQuests: Map<string, Quest>;
  private sages: Map<string, SageEntity>;
  private guardians: Map<string, GuardianEntity>;

  constructor(scene: AgentverseScene) {
    this.scene = scene;
    this.activeQuests = new Map();
    this.sages = new Map();
    this.guardians = new Map();
    this.initializeEntities();
  }

  private initializeEntities(): void {
    // Initialize Seven Sages
    const sageConfigs = [
      { id: "algorithmicSage", zone: "algorithmic", specialty: "computation" },
      { id: "lexicalSage", zone: "lexical", specialty: "knowledge" },
      { id: "cogsmithSage", zone: "cogsmith", specialty: "creation" },
      { id: "neuralSage", zone: "neural", specialty: "learning" },
      // ... other sages
    ];

    sageConfigs.forEach((config) => {
      this.sages.set(config.id, new SageEntity(this.scene, config));
    });

    // Initialize Silent Guardians
    const guardianConfigs = [
      { id: "dataGuardian", zone: "algorithmic", power: "dataManipulation" },
      { id: "loreGuardian", zone: "lexical", power: "knowledgeWeaving" },
      // ... other guardians
    ];

    guardianConfigs.forEach((config) => {
      this.guardians.set(config.id, new GuardianEntity(this.scene, config));
    });
  }

  public triggerSageEncounter(agentId: string, sageId: string): void {
    const sage = this.sages.get(sageId);
    if (sage) {
      sage.initiateEncounter(agentId);
    }
  }

  public triggerGuardianChallenge(agentId: string, guardianId: string): void {
    const guardian = this.guardians.get(guardianId);
    if (guardian) {
      guardian.initiateChallenge(agentId);
    }
  }

  public update(delta: number): void {
    // Update all narrative entities
    this.sages.forEach((sage) => sage.update(delta));
    this.guardians.forEach((guardian) => guardian.update(delta));
    this.updateActiveQuests(delta);
  }

  private updateActiveQuests(delta: number): void {
    this.activeQuests.forEach((quest) => {
      quest.update(delta);
      if (quest.isComplete) {
        this.resolveQuest(quest.id);
      }
    });
  }
}
