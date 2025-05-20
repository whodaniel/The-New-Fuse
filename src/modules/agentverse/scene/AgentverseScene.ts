export class AgentverseScene extends Phaser.Scene {
  private tileMap: IsometricTileMap;
  private entityManager: EntityManager;
  private uiManager: UIManager;
  private aetherSystem: AetherSystem;
  private narrativeManager: NarrativeManager;
  private resourceManager: ResourceManager;
  private guildSystem: GuildSystem;

  constructor() {
    super({ key: "AgentverseScene" });
  }

  create() {
    // Initialize core systems
    this.initializeSystems();
    this.setupZones();
    this.createUI();
    this.setupEventListeners();
  }

  private initializeSystems() {
    // Initialize base systems
    this.tileMap = new IsometricTileMap(this, {
      tileWidth: 64,
      tileHeight: 32,
      layers: ["ground", "decoration", "effects"],
    });

    this.entityManager = new EntityManager(this);
    this.aetherSystem = new AetherSystem(this);

    // Initialize new core systems
    this.narrativeManager = new NarrativeManager(this);
    this.resourceManager = new ResourceManager(this);
    this.guildSystem = new GuildSystem(this);

    // Initialize zone-specific renderers
    this.setupZoneRenderers();
  }

  private setupZoneRenderers() {
    this.tileMap.setZoneRenderer(
      "algorithmic",
      new CrystallineRenderer({
        primaryColor: 0x00ff87,
        ambientEffects: ["dataFlow", "logicPulse"],
      }),
    );
    this.tileMap.setZoneRenderer(
      "lexical",
      new LibraryRenderer({
        primaryColor: 0xff8700,
        ambientEffects: ["textFlow", "knowledgePulse"],
      }),
    );
    this.tileMap.setZoneRenderer(
      "cogsmith",
      new SteampunkRenderer({
        primaryColor: 0xcd853f,
        ambientEffects: ["steamVent", "gearTurn"],
      }),
    );
    this.tileMap.setZoneRenderer(
      "neural",
      new BioluminescentRenderer({
        primaryColor: 0xff1493,
        ambientEffects: ["synapseFlash", "neuralPulse"],
      }),
    );
  }

  private createUI() {
    this.uiManager = new UIManager(this);
    this.uiManager.createUserPanel();
    this.uiManager.createMinimap();
    this.uiManager.createNotificationCenter();
  }

  private setupEventListeners() {
    // Core game events
    this.events.on("agent:spawn", this.handleAgentSpawn, this);
    this.events.on("agent:move", this.handleAgentMove, this);
    this.events.on("agent:interact", this.handleAgentInteraction, this);

    // Resource events
    this.events.on("resource:spawn", this.handleResourceSpawn, this);
    this.events.on("resource:harvest", this.handleResourceHarvest, this);
    this.events.on("lumina:flow", this.handleLuminaFlow, this);

    // Guild events
    this.events.on("guild:claim", this.handleTerritoryClaim, this);
    this.events.on("guild:influence", this.handleGuildInfluence, this);

    // Narrative events
    this.events.on("sage:encounter", this.handleSageEncounter, this);
    this.events.on("guardian:challenge", this.handleGuardianChallenge, this);
    this.events.on("quest:progress", this.handleQuestProgress, this);
  }

  private handleAgentSpawn(data: AgentSpawnData) {
    this.entityManager.spawnAgent(data);
  }

  private handleResourceSpawn(data: ResourceSpawnData) {
    this.resourceManager.spawnResource(data.type, data.position, data.amount);
  }

  private handleTerritoryClaim(data: TerritoryClaimData) {
    this.guildSystem.claimTerritory(data.guildId, data.zoneId);
  }

  private handleSageEncounter(data: SageEncounterData) {
    this.narrativeManager.triggerSageEncounter(data.agentId, data.sageId);
  }

  update(time: number, delta: number) {
    // Update core systems
    this.tileMap.updateAetherFlows(delta);
    this.entityManager.updateEntities(delta);
    this.aetherSystem.update(delta);

    // Update new core systems
    this.narrativeManager.update(delta);
    this.resourceManager.update(delta);
    this.guildSystem.update(delta);

    // Update UI and camera
    this.handleCameraControls();
    this.uiManager.update(delta);
  }

  public getSerializableState(): AgentverseState {
    return {
      currentZone: this.tileMap.getCurrentZone(),
      aetherLevel: this.aetherSystem.getCurrentLevel(),
      activeEffects: this.aetherSystem.getActiveEffects(),
      focusPoint: this.cameras.main.scrollX,
      // Add new system states
      narrativeState: this.serializeNarrativeState(),
      resourceState: this.serializeResourceState(),
      guildState: this.serializeGuildState(),
    };
  }

  private serializeNarrativeState(): NarrativeState {
    return {
      activeQuests: Array.from(this.narrativeManager.getActiveQuests()),
      sageLocations: this.narrativeManager.getSageLocations(),
      guardianStates: this.narrativeManager.getGuardianStates(),
    };
  }

  private serializeResourceState(): ResourceState {
    return {
      resources: Array.from(this.resourceManager.getResources()),
      luminaFlows: this.resourceManager.getLuminaFlowData(),
      harvestPoints: this.resourceManager.getHarvestPoints(),
    };
  }

  private serializeGuildState(): GuildState {
    return {
      territoryControl: Array.from(this.guildSystem.getTerritoryControl()),
      guildInfluence: this.guildSystem.getInfluenceMap(),
      activeConflicts: this.guildSystem.getActiveConflicts(),
    };
  }

  public loadState(state: AgentverseState): void {
    // Load core states
    this.tileMap.setCurrentZone(state.currentZone);
    this.aetherSystem.setCurrentLevel(state.aetherLevel);
    this.aetherSystem.setActiveEffects(state.activeEffects);

    // Load new system states
    this.narrativeManager.loadState(state.narrativeState);
    this.resourceManager.loadState(state.resourceState);
    this.guildSystem.loadState(state.guildState);

    // Update camera
    this.cameras.main.scrollX = state.focusPoint;
  }
}
