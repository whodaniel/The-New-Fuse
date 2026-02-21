import * as Phaser from "phaser";

interface AssetManifest {
  zones: Record<string, ZoneAssets>;
  agents: Record<string, AgentAssets>;
  effects: Record<string, EffectAssets>;
  ui: Record<string, UIAssets>;
}

interface ZoneAssets {
  tiles: string[];
  decorations: string[];
  ambient: string[];
}

interface AgentAssets {
  sprites: string[];
  animations: Record<string, AnimationConfig>;
}

interface EffectAssets {
  particles: string[];
  sprites: string[];
}

interface UIAssets {
  icons: string[];
  frames: string[];
}

export class AssetLoader {
  private scene: Phaser.Scene;
  private manifest: AssetManifest;
  private loadingProgress: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.manifest = this.getAssetManifest();
  }

  async loadAll(): Promise<void> {
    return new Promise((resolve) => {
      this.setupLoadingEvents();
      this.loadZoneAssets();
      this.loadAgentAssets();
      this.loadEffectAssets();
      this.loadUIAssets();

      this.scene.load.start();

      this.scene.load.once("complete", () => {
        this.createAnimations();
        resolve();
      });
    });
  }

  private setupLoadingEvents(): void {
    this.scene.load.on("progress", (value: number) => {
      this.loadingProgress = value;
      this.scene.events.emit("LOADING_PROGRESS", value);
    });

    this.scene.load.on("fileprogress", (file: Phaser.Loader.File) => {
      this.scene.events.emit("FILE_PROGRESS", {
        key: file.key,
        progress: file.percentComplete,
      });
    });
  }

  private loadZoneAssets(): void {
    Object.entries(this.manifest.zones).forEach(([zoneName, assets]) => {
      // Load zone tiles
      assets.tiles.forEach((tile) => {
        this.scene.load.image(
          `tile-${zoneName}-${tile}`,
          `assets/zones/${zoneName}/tiles/${tile}.png`,
        );
      });

      // Load zone decorations
      assets.decorations.forEach((decoration) => {
        this.scene.load.image(
          `decoration-${zoneName}-${decoration}`,
          `assets/zones/${zoneName}/decorations/${decoration}.png`,
        );
      });

      // Load ambient effects
      assets.ambient.forEach((ambient) => {
        this.scene.load.atlas(
          `ambient-${zoneName}-${ambient}`,
          `assets/zones/${zoneName}/ambient/${ambient}.png`,
          `assets/zones/${zoneName}/ambient/${ambient}.json`,
        );
      });
    });
  }

  private loadAgentAssets(): void {
    Object.entries(this.manifest.agents).forEach(([agentType, assets]) => {
      // Load agent sprites
      assets.sprites.forEach((sprite) => {
        this.scene.load.atlas(
          `agent-${agentType}-${sprite}`,
          `assets/agents/${agentType}/${sprite}.png`,
          `assets/agents/${agentType}/${sprite}.json`,
        );
      });
    });
  }

  private loadEffectAssets(): void {
    Object.entries(this.manifest.effects).forEach(([effectType, assets]) => {
      // Load particle effects
      assets.particles.forEach((particle) => {
        this.scene.load.atlas(
          `particle-${effectType}-${particle}`,
          `assets/effects/${effectType}/particles/${particle}.png`,
          `assets/effects/${effectType}/particles/${particle}.json`,
        );
      });

      // Load effect sprites
      assets.sprites.forEach((sprite) => {
        this.scene.load.image(
          `effect-${effectType}-${sprite}`,
          `assets/effects/${effectType}/sprites/${sprite}.png`,
        );
      });
    });
  }

  private loadUIAssets(): void {
    Object.entries(this.manifest.ui).forEach(([uiSet, assets]) => {
      // Load UI icons
      assets.icons.forEach((icon) => {
        this.scene.load.image(
          `ui-${uiSet}-${icon}`,
          `assets/ui/${uiSet}/icons/${icon}.png`,
        );
      });

      // Load UI frames
      assets.frames.forEach((frame) => {
        this.scene.load.image(
          `ui-${uiSet}-${frame}`,
          `assets/ui/${uiSet}/frames/${frame}.png`,
        );
      });
    });
  }

  private createAnimations(): void {
    Object.entries(this.manifest.agents).forEach(([agentType, assets]) => {
      Object.entries(assets.animations).forEach(([animName, config]) => {
        this.scene.anims.create({
          key: `${agentType}-${animName}`,
          frames: this.scene.anims.generateFrameNames(`agent-${agentType}`, {
            prefix: config.prefix,
            start: config.start,
            end: config.end,
            zeroPad: config.zeroPad,
          }),
          frameRate: config.frameRate,
          repeat: config.repeat,
        });
      });
    });
  }

  private getAssetManifest(): AssetManifest {
    return {
      zones: {
        algorithmic: {
          tiles: ["base", "path", "node"],
          decorations: ["crystal", "circuit"],
          ambient: ["data-flow"],
        },
        lexical: {
          tiles: ["library-floor", "bookshelf"],
          decorations: ["scroll", "tome"],
          ambient: ["floating-text"],
        },
        cogsmith: {
          tiles: ["metal-floor", "gear-base"],
          decorations: ["pipe", "valve"],
          ambient: ["steam"],
        },
        neural: {
          tiles: ["synapse-floor", "neuron-path"],
          decorations: ["dendrite", "axon"],
          ambient: ["pulse"],
        },
      },
      agents: {
        worker: {
          sprites: ["idle", "work", "move"],
          animations: {
            idle: {
              prefix: "worker-idle-",
              start: 0,
              end: 7,
              zeroPad: 2,
              frameRate: 8,
              repeat: -1,
            },
            work: {
              prefix: "worker-work-",
              start: 0,
              end: 11,
              zeroPad: 2,
              frameRate: 12,
              repeat: 0,
            },
          },
        },
        // Add more agent types...
      },
      effects: {
        data: {
          particles: ["stream", "burst"],
          sprites: ["glow", "ripple"],
        },
        energy: {
          particles: ["spark", "wave"],
          sprites: ["flash", "pulse"],
        },
      },
      ui: {
        main: {
          icons: ["select", "move", "delete"],
          frames: ["panel", "button", "tooltip"],
        },
        context: {
          icons: ["inspect", "configure", "close"],
          frames: ["menu-bg", "item-bg"],
        },
      },
    };
  }
}
