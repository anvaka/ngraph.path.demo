class RouteHandleViewModel {
  constructor(pointChangedCallback, findNearestPoint) {
    this.visible = false;
    this.beingDragged = false;

    this.pointId = -1;
    this.x = 0;
    this.y = 0;
    this.r = 18;

    this.pointChanged = pointChangedCallback;
    this.findNearestPoint = findNearestPoint;
  }

  startDragging(scene, touchId = undefined) {
    let self = this;
    this.beingDragged = true;

    document.addEventListener('mousemove', onMouseMove, true)
    document.addEventListener('touchmove', onMouseMove, {
      capture: true,
      passive: false
    })
    document.addEventListener('touchend', onMouseUp, true)
    document.addEventListener('touchcancel', onMouseUp, true)
    document.addEventListener('mouseup', onMouseUp, true)

    function onMouseMove(e) {
      e.stopPropagation();
      e.preventDefault();
      let clientX, clientY;
      if (e.touches) {
        let mainTouch;
        for(var i = 0; i < e.touches.length; ++i) {
          if (e.touches[i].identifier === touchId) {
            mainTouch = e.touches[i];
            break;
          }
        }

        if (!mainTouch) return; // not us.

        clientX = mainTouch.clientX;
        clientY = mainTouch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      var s = scene.getSceneCoordinate(clientX, clientY);
      self.x = s.x;
      self.y = s.y;
      let point = self.findNearestPoint(s.x, s.y);
      self.pointId = point.id;
      self.pointChanged(self)
    }

    function onMouseUp(e) {
      if (e.touches && e.touches.length > 0) {
        for(let i = 0; i < e.touches.length; ++i) {
          let touch = e.touches[i];
          if (touch.identifier === touchId) {
            // we are in the list of active touches, so it wasn't us
            return;
          }
        }
      }

      // if we got here, it means the user let go current handle
      unsubscribe();
    }

    function unsubscribe() {
      self.beingDragged = false;
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('mouseup', onMouseUp, true);
      document.removeEventListener('touchmove', onMouseMove, true)
      document.removeEventListener('touchend', onMouseUp, true)
      document.removeEventListener('touchcancel', onMouseUp, true)
    }
  }

  setFrom(graphNode) {
    this.visible = true;
    this.pointId = graphNode.id;
    this.x = graphNode.data.x;
    this.y = graphNode.data.y;

    this.pointChanged(this);
  }
  clear() {
    this.visible = false;
    this.pointId = -1;
    this.x = 0;
    this.y = 0;
    this.pointChanged(this);
  }

  intersects(x, y, scale) {
    if (!this.visible || this.beingDragged) return false;

    let r = this.r / scale;
    let dx = x - this.x;
    let dy = y - this.y;
    return (dx * dx + dy * dy) <= r * r;
  }
}

module.exports = RouteHandleViewModel;