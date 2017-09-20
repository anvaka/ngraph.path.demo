let wgl = require('w-gl');

/**
 * Applies current transformation matrix to a given SVG group
 * element.
 */
class SVGContainer extends wgl.Element {

  /**
   * @param {SVGGElement} groupElement where transformation should be applied
   * @param {Function} drawCallback a function that is called after each
   * `draw()`
   */
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
      // Avoid DOM updates if possible.
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