import Camera from './Camera';
import EventHandler from './EventHandler';
import Renderer from './Renderer';
import Scene from './Scene';
import { Keys } from './types';

class Game {
  camera;

  canvas: HTMLCanvasElement;

  eventHandler;

  renderer;

  scene;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (context) {
      this.scene = new Scene();
      this.scene.buildMap(300, 300);

      this.renderer = new Renderer(context, this.scene);

      this.#resizeCanvas();
      window.addEventListener('resize', () => this.#resizeCanvas());

      this.camera = new Camera(this.scene, this.renderer.ratio);

      this.eventHandler = new EventHandler();

      this.#loop();
    }
  }

  destructor() {
    window.removeEventListener('resize', () => this.#resizeCanvas());

    this.scene?.destructor();
    this.camera?.destructor(this.scene as Scene);
    this.eventHandler?.destructor();
  }

  #resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.renderer?.updateSize();

    this.camera?.updateViewPort(this.renderer?.ratio as number);
  }

  #loop() {
    this.scene?.updatePlayer(this.eventHandler?.keys as Keys);
    this.scene?.performCollisions();
    this.scene?.animate();
    this.scene?.ySort();

    this.renderer?.translate(
      this.camera?.getOffsetX() as number,
      this.camera?.getOffsetY() as number
    );
    this.renderer?.clear();
    this.renderer?.render({ colliders: false });

    window.requestAnimationFrame(() => this.#loop());
  }
}

export default Game;
