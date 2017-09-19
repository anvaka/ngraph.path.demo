let wgl = require('w-gl');

class SVGContainer extends wgl.Element {
  constructor(groupElement, drawCallback) {
    super();
    this.g = groupElement;
    this.dx = 0;
    this.dy = 0;
    this.scale = 0;
    this.drawCallback = drawCallback || noop;
  }

  draw() {
    let transform = this.worldTransform;
    if(transformsAreSame(this.worldTransform, this)) {
      return;
    }
    let pixelRatio = this.scene.getPixelRatio();

    let scale = transform.scale/pixelRatio;
    let dx = transform.dx/pixelRatio;
    let dy = transform.dy/pixelRatio;

    this.g.setAttributeNS(null, 'transform', `matrix(${scale}, 0, 0, ${scale}, ${dx}, ${dy})`);
    this.scale = transform.scale;
    this.dx = transform.dx;
    this.dy = transform.dy;
    this.drawCallback(this);
  }
}

function transformsAreSame(world, ours) {
  return world.scale == ours.scale &&
         world.dx === ours.dx &&
         world.dy === ours.dy;
}

module.exports = SVGContainer;

function noop() {}