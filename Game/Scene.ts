import Player from './Entities/Organisms/Player';
import Entity from './Entities/Entity';
import Terrain from './Entities/Terrains/Terrain';
import TerrainTiles from './Entities/Terrains/TerrainTiles';
import EnvironmentTiles from './Entities/Environments/EnvironmentTiles';
import { Collider, Interaction, Keys, Tilemap } from './types';
import { TILE_SIZE } from './globals';
import getDistance from './utils/getDistance';
import map001 from './Tilemaps/map001';
import map002 from './Tilemaps/map002';

class Scene {
  colliders: Collider[] = [];

  entities: Entity[] = []; // Environments + organisms

  interactions: Interaction[] = [];

  organisms: Entity[] = [];

  player;

  terrains: Terrain[] = [];

  tilemap: Tilemap = map001;

  constructor() {
    this.player = new Player((entity: Entity) => this.spawn(entity));
    this.entities.push(this.player);
    this.organisms.push(this.player);
  }

  animate() {
    this.entities.forEach((entity) => {
      const { animator } = entity;
      if (animator) {
        // Execute the following every {specified number} frames per second
        if (
          animator.frameWaiter >=
          60 / animator.currentAnimation.framesPerSecond
        ) {
          animator.frameWaiter = 0;

          // Move forward in the animation
          if (animator.column < animator.currentAnimation.frameNumber - 1) {
            animator.column += 1;
          }

          // Delete instance after its animation
          else if (animator.currentAnimation.once) {
            delete this.entities[this.entities.indexOf(entity)];
          }

          // Reset animation
          else {
            animator.column = 0;
          }
        } else {
          animator.frameWaiter += 1;
        }
      }
    });
  }

  buildMap() {
    // Reset the scene
    this.colliders = [];
    this.entities = [];
    this.interactions = [];
    this.organisms = [];
    this.terrains = [];

    // Build the scene
    for (let row = 0; row < this.tilemap.rows; row += 1) {
      for (let column = 0; column < this.tilemap.columns; column += 1) {
        const tile = row * this.tilemap.columns + column;

        // Build terrain
        const terrain = TerrainTiles[this.tilemap.terrains[tile]];
        this.terrains.push(
          new Terrain(
            column * TILE_SIZE,
            row * TILE_SIZE,
            terrain.source,
            terrain.x,
            terrain.y
          )
        );
        if (terrain.collider) {
          const { x, y, width, height } = terrain.collider;
          this.colliders.push({
            x: x + column * TILE_SIZE,
            y: y + row * TILE_SIZE,
            width,
            height,
          });
        }

        // Build environments
        const Environment = EnvironmentTiles[this.tilemap.environments[tile]];
        if (Environment) {
          const environment = new Environment(
            column * TILE_SIZE,
            row * TILE_SIZE
          );
          this.entities.push(environment);
          if (environment.collider) {
            this.colliders.push({
              x: environment.position.x + environment.collider.x,
              y: environment.position.y + environment.collider.y,
              width: environment.collider.width,
              height: environment.collider.height,
            });
          }
        }
      }
    }

    // Build interactions
    this.interactions = this.tilemap.interactions;

    // Add a new player instance
    this.player = new Player((entity: Entity) => this.spawn(entity));
    this.entities.push(this.player);
    this.organisms.push(this.player);
  }

  performCollisions() {
    this.organisms.forEach((organism) => {
      this.colliders.forEach((collider) => {
        // Perform collisions only on colliders close to the organism
        if (
          getDistance(
            organism.position.x,
            organism.position.y,
            collider.x,
            collider.y
          ) < 48
        ) {
          // Distances between centers
          const distanceX =
            organism.position.x +
            organism.collider.x +
            organism.collider.width / 2 -
            (collider.x + collider.width / 2);
          const distanceY =
            organism.position.y +
            organism.collider.y +
            organism.collider.height / 2 -
            (collider.y + collider.height / 2);

          // Minimal distance between centers
          const widthX = organism.collider.width / 2 + collider.width / 2;
          const widthY = organism.collider.height / 2 + collider.height / 2;

          // Check if there is a collision
          if (Math.abs(distanceX) < widthX && Math.abs(distanceY) < widthY) {
            const overlapX = widthX - Math.abs(distanceX);
            const overlapY = widthY - Math.abs(distanceY);

            // Remove overlap
            if (overlapX < overlapY) {
              organism.position.x += distanceX > 0 ? overlapX : -overlapX;
              return;
            }
            organism.position.y += distanceY > 0 ? overlapY : -overlapY;
          }
        }
      });
    });
  }

  updatePlayer(keys: Keys) {
    this.player.update(keys);

    // Check interactions
    const { collider, position } = this.player;
    this.interactions.forEach((interaction) => {
      if (
        position.x + collider.x + collider.width > interaction.x &&
        position.x + collider.x < interaction.x + interaction.width &&
        position.y + collider.y + collider.height > interaction.y &&
        position.y + collider.y < interaction.y + interaction.height
      ) {
        if (!interaction.entered) {
          interaction.entered = true;
          interaction.enter();
          this.switchMap(map002);
        }
      } else if (interaction.entered) {
        interaction.entered = false;
        interaction.leave();
      }
    });
  }

  switchMap(newMap: Tilemap) {
    this.tilemap = newMap;
    this.buildMap();
    window.dispatchEvent(new Event('scene-switch'));
  }

  spawn(entity: Entity) {
    this.entities.push(entity);
  }

  ySort() {
    this.entities.sort((previous, current) =>
      previous.position.y + previous.sprite.height >
      current.position.y + current.sprite.height
        ? 1
        : -1
    );
  }
}

export default Scene;
