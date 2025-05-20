export class GuildSystem {
  private scene: AgentverseScene;
  private guilds: Map<string, Guild>;
  private territoryControl: Map<string, string>; // zoneId -> guildId
  private influenceMap: InfluenceMap;

  constructor(scene: AgentverseScene) {
    this.scene = scene;
    this.guilds = new Map();
    this.territoryControl = new Map();
    this.influenceMap = new InfluenceMap(
      scene.tileMap.width,
      scene.tileMap.height,
    );
    this.initializeGuilds();
  }

  private initializeGuilds(): void {
    const guildConfigs = [
      { id: "dataWeavers", specialty: "algorithmic", color: 0x00ff87 },
      { id: "loreKeepers", specialty: "lexical", color: 0xff8700 },
      { id: "cogShapers", specialty: "cogsmith", color: 0xcd853f },
      { id: "synapticOrder", specialty: "neural", color: 0xff1493 },
    ];

    guildConfigs.forEach((config) => {
      this.guilds.set(config.id, new Guild(config));
    });
  }

  public claimTerritory(guildId: string, zoneId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (guild && guild.hasRequiredInfluence(zoneId)) {
      this.territoryControl.set(zoneId, guildId);
      this.updateTerritoryVisuals(zoneId);
      return true;
    }
    return false;
  }

  public updateInfluence(
    position: Vector3,
    guildId: string,
    amount: number,
  ): void {
    this.influenceMap.addInfluence(position, guildId, amount);
    this.checkTerritoryControl();
  }

  private checkTerritoryControl(): void {
    this.scene.tileMap.getZones().forEach((zone) => {
      const dominantGuild = this.influenceMap.getDominantGuild(zone.bounds);
      if (dominantGuild) {
        this.territoryControl.set(zone.id, dominantGuild);
        this.updateTerritoryVisuals(zone.id);
      }
    });
  }

  private updateTerritoryVisuals(zoneId: string): void {
    const guildId = this.territoryControl.get(zoneId);
    if (guildId) {
      const guild = this.guilds.get(guildId);
      const zone = this.scene.tileMap.getZone(zoneId);
      zone.setGuildInfluence(guild.color, guild.getInfluencePattern());
    }
  }

  public update(delta: number): void {
    this.influenceMap.update(delta);
    this.guilds.forEach((guild) => guild.update(delta));
    this.updateTerritoryEffects();
  }
}
