import { Animation, Direction, EntityLayer } from '../types';

class Entity {
  animations?: { [key: string]: Animation };

  animator?: {
    currentAnimation: Animation;
    row: number;
    column: number;
    frameWaiter: number;
  };

  position!: {
    x: number;
    y: number;

    direction?: Direction;
    speed?: number;
    maxSpeed?: number;
    acceleration?: number;
    deceleration?: number;
  };

  sprite!: {
    image: HTMLImageElement;
    source: string;
    width: number;
    height: number;

    sourceX?: number;
    sourceY?: number;

    behind?: EntityLayer;
    over?: EntityLayer;
  };

  init() {
    this.sprite.image.src = `/sprites/${this.sprite.source}.png`;
  }
}

export default Entity;
