export class AgentAvatar extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private effectsContainer: Phaser.GameObjects.Container;
  private nameplate: Phaser.GameObjects.Text;
  private statusEffects: Map<string, VisualEffect>;
  private currentAnimation: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: AgentVisualProperties,
  ) {
    super(scene, x, y);

    this.sprite = scene.add.sprite(0, 0, config.baseModel);
    this.effectsContainer = scene.add.container(0, 0);
    this.nameplate = scene.add.text(0, -40, "", {
      fontSize: "14px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });

    this.add([this.sprite, this.effectsContainer, this.nameplate]);
    this.statusEffects = new Map();

    this.initializeAnimations(config.animations);
    this.applyAccessories(config.accessories);
    this.initializeEffects(config.effectsLayer);
  }

  private initializeAnimations(animations: Map<string, AnimationConfig>): void {
    animations.forEach((config, key) => {
      this.scene.anims.create({
        key: `${this.sprite.name}_${key}`,
        frames: this.scene.anims.generateFrameNumbers(config.spritesheet, {
          start: config.startFrame,
          end: config.endFrame,
        }),
        frameRate: config.frameRate,
        repeat: config.repeat,
      });
    });
  }

  private applyAccessories(accessories: string[]): void {
    accessories.forEach((accessory) => {
      const accessorySprite = this.scene.add.sprite(0, 0, accessory);
      this.effectsContainer.add(accessorySprite);
    });
  }

  public playAnimation(key: string, ignoreIfPlaying: boolean = true): void {
    if (ignoreIfPlaying && this.currentAnimation === key) return;
    this.currentAnimation = key;
    this.sprite.play(`${this.sprite.name}_${key}`);
  }

  public addStatusEffect(effect: VisualEffect): void {
    const visualEffect = new VisualEffect(this.scene, effect);
    this.statusEffects.set(effect.id, visualEffect);
    this.effectsContainer.add(visualEffect);
  }

  public removeStatusEffect(effectId: string): void {
    const effect = this.statusEffects.get(effectId);
    if (effect) {
      effect.destroy();
      this.statusEffects.delete(effectId);
    }
  }

  public update(delta: number): void {
    this.statusEffects.forEach((effect) => effect.update(delta));
    this.updateNameplate();
  }

  private updateNameplate(): void {
    const worldView = this.scene.cameras.main.worldView;
    const zoom = this.scene.cameras.main.zoom;
    this.nameplate.setScale(1 / zoom);
  }
}
