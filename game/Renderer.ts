import Engine from '~~/game/engine';
import Entity from './oldEntities/Entity';
import { TILE_SIZE, TRANSITION_DURATION, Y_PIXELS_NUMBER } from './globals';
import Scene from './Scene';
import { Collision, Interaction } from './types';

class Renderer {
  debugContext: CanvasRenderingContext2D;

  engine: Engine;

  offsetX = 0;

  offsetY = 0;

  ratio = 1;

  scene;

  viewport = {
    width: 0,
    height: 0,
  };

  constructor(
    gameContext: WebGL2RenderingContext,
    debugContext: CanvasRenderingContext2D,
    scene: Scene
  ) {
    this.engine = new Engine(gameContext);
    this.debugContext = debugContext;
    this.scene = scene;

    this.resize();

    this.loadTextures();

    window.addEventListener('start-scene-switch', () => {
      setTimeout(async () => {
        await this.loadTextures();
        window.dispatchEvent(new Event('end-scene-switch'));
      }, TRANSITION_DURATION + 1);
    });
  }

  loadTextures() {
    return new Promise((resolve) => {
      const requiredSources = ['/sprites/dust.png'];
      const sources = [...this.scene.entities, ...this.scene.terrains].reduce(
        (previous: string[], current) => {
          if (previous.includes(current.sprite.source)) {
            return previous;
          }
          return [...previous, current.sprite.source];
        },
        []
      );
      this.engine.loadTextures([...requiredSources, ...sources]).then(resolve);
    });
  }

  isVisible(x: number, y: number, width: number, height: number) {
    return (
      x + width > this.offsetX &&
      x < this.offsetX + this.viewport.width &&
      y + height + 10 > this.offsetY &&
      y - 10 < this.offsetY + this.viewport.height
    );
  }

  resize() {
    this.engine.resize();

    this.debugContext.canvas.width = window.innerWidth;
    this.debugContext.canvas.height = window.innerHeight;

    this.ratio = Math.round(window.innerHeight / Y_PIXELS_NUMBER);

    this.viewport.width = window.innerWidth / this.ratio;
    this.viewport.height = window.innerHeight / this.ratio;
  }

  render(options: { debug: boolean }) {
    this.renderTerrains();

    this.renderEntities();

    this.engine.clear();

    this.engine.render();

    if (options.debug) {
      this.debugContext.clearRect(0, 0, 9999, 9999);
      this.renderGrid();
      this.renderCollisions(
        this.scene.collisions,
        this.scene.interactions,
        this.scene.organisms
      );
    }
  }

  renderCollisions(
    collisions: Collision[],
    interactions: Interaction[],
    organisms: Entity[]
  ) {
    this.debugContext.lineWidth = 2;

    // Render environments collisions
    this.debugContext.strokeStyle = 'rgb(255, 0, 0)';

    collisions.forEach((collision) => {
      this.debugContext.strokeRect(
        collision.x * this.ratio,
        collision.y * this.ratio,
        collision.width * this.ratio,
        collision.height * this.ratio
      );
    });

    // Render interactions
    this.debugContext.strokeStyle = 'rgb(0, 0, 255)';
    interactions.forEach((interaction) => {
      this.debugContext.strokeRect(
        interaction.x * this.ratio,
        interaction.y * this.ratio,
        interaction.width * this.ratio,
        interaction.height * this.ratio
      );
    });

    // Render organisms collisions
    this.debugContext.strokeStyle = 'rgb(0, 255, 0)';
    this.debugContext.fillStyle = 'rgb(0, 255, 0)';
    this.debugContext.font = '16px monospace';
    organisms.forEach((organism) => {
      // console.log(organism.constructor.name);

      const { collision } = organism;
      if (collision) {
        const x = Math.floor((organism.position.x + collision.x) * this.ratio);
        const y = Math.floor((organism.position.y + collision.y) * this.ratio);
        this.debugContext.strokeRect(
          x,
          y,
          collision.width * this.ratio,
          collision.height * this.ratio
        );
        this.debugContext.fillText(organism.constructor.name, x, y - 6);
      }
    });

    this.debugContext.fillStyle = 'transparent';
  }

  renderEntities() {
    this.scene.entities.forEach((entity) => {
      const { animator, position, sprite } = entity;

      if (this.isVisible(position.x, position.y, sprite.width, sprite.height)) {
        // Render a shadow if the entity has one
        if (sprite.shadow) {
          this.engine.queueRender(
            sprite.source,
            sprite.shadow.sourceX, // position x in the source image
            sprite.shadow.sourceY, // position y in the source image
            sprite.shadow.width, // width of the sprite in the source image
            sprite.shadow.height, // height of the sprite in the source image
            Math.floor((position.x + sprite.shadow.x) * this.ratio), // position x in the canvas
            Math.floor((position.y + sprite.shadow.y) * this.ratio), // position y in the canvas
            sprite.shadow.width * this.ratio, // width of the sprite in the canvas
            sprite.shadow.height * this.ratio // height of the sprite in the canvas
          );
        }

        // If the entity is animated
        if (animator) {
          this.engine.queueRender(
            sprite.source,
            sprite.width *
              (animator.column + animator.currentAnimation.frameStart - 1), // position x in the source image
            sprite.height * animator.row, // position y in the source image
            sprite.width, // width of the sprite in the source image
            sprite.height, // height of the sprite in the source image
            Math.floor(position.x * this.ratio), // position x in the canvas
            Math.floor(position.y * this.ratio), // position y in the canvas
            sprite.width * this.ratio, // width of the sprite in the canvas
            sprite.height * this.ratio // height of the sprite in the canvas
          );
        }

        // If the entity is not animated
        else {
          this.engine.queueRender(
            sprite.source,
            sprite.sourceX as number, // position x in the source image
            sprite.sourceY as number, // position y in the source image
            sprite.width, // width of the sprite in the source image
            sprite.height, // height of the sprite in the source image
            Math.floor(position.x * this.ratio), // position x in the canvas
            Math.floor(position.y * this.ratio), // position y in the canvas
            sprite.width * this.ratio, // width of the sprite in the canvas
            sprite.height * this.ratio // height of the sprite in the canvas
          );
        }
      }
    });
  }

  renderGrid() {
    this.debugContext.lineWidth = 1;
    this.debugContext.strokeStyle = 'rgba(255, 255, 255, 0.5)';

    for (let index = 0; index < this.scene.tilemap.columns; index += 1) {
      const x = index * TILE_SIZE * this.ratio;
      this.debugContext.beginPath();
      this.debugContext.moveTo(x, 0);
      this.debugContext.lineTo(
        x,
        this.scene.tilemap.rows * TILE_SIZE * this.ratio
      );
      this.debugContext.stroke();
    }

    for (let index = 0; index < this.scene.tilemap.rows; index += 1) {
      const y = index * TILE_SIZE * this.ratio;
      this.debugContext.beginPath();
      this.debugContext.moveTo(0, y);
      this.debugContext.lineTo(
        this.scene.tilemap.columns * TILE_SIZE * this.ratio,
        y
      );
      this.debugContext.stroke();
    }
  }

  renderTerrains() {
    this.scene.terrains.forEach((terrain) => {
      const { position, sprite } = terrain;
      if (this.isVisible(position.x, position.y, TILE_SIZE, TILE_SIZE)) {
        this.engine.queueRender(
          sprite.source,
          sprite.x, // position x in the source image
          sprite.y, // position y in the source image
          TILE_SIZE, // width of the sprite in the source image
          TILE_SIZE, // height of the sprite in the source image
          position.x * this.ratio, // position x in the canvas
          position.y * this.ratio, // position y in the canvas
          TILE_SIZE * this.ratio, // width of the sprite in the canvas
          TILE_SIZE * this.ratio // height of the sprite in the canvas
        );
      }
    });
  }

  translate(offsetX: number, offsetY: number) {
    this.offsetX = Math.abs(Math.round(offsetX));
    this.offsetY = Math.abs(Math.round(offsetY));

    this.engine.translate(
      Math.floor(offsetX * this.ratio),
      Math.floor(offsetY * this.ratio)
    );

    this.debugContext.setTransform(
      1,
      0,
      0,
      1,
      Math.floor(offsetX * this.ratio),
      Math.floor(offsetY * this.ratio)
    );
  }
}

export default Renderer;