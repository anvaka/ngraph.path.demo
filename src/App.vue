<template>
  <div id="app">
    <canvas ref='canvas' class='absolute'></canvas>
    <div v-if='!webGLEnabled'>
      <div class='absolute no-webgl'>
        <h4>WebGL is not enabled :(</h4>
        <div>While <a href='https://github.com/anvaka/ngraph.path' class='highlighted'>ngraph.path</a> does not require any webgl, this demo needs it.</div>
        <iframe src="https://www.youtube.com/embed/hGeZuIEV6KU" frameborder="0" allowfullscreen class='video-demo'></iframe>
      </div>
    </div>
    <div v-if='webGLEnabled'>
      <svg ref='svg' class='svg-overlay absolute'>
        <g class='scene'>
          <path ref='foundPath' :d='pathInfo.svgPath' stroke-width='6x' stroke='red' fill="transparent" ></path>
          <route-point :point='routeStart' :scale='scale' :r='routeStart.r' symbol='A' v-if='routeStart.visible' :fontSize='28'></route-point>
          <route-point :point='routeEnd' :scale='scale' :r='routeEnd.r' symbol='B' v-if='routeEnd.visible' :fontSize='28'></route-point>
        </g>
      </svg>
      <div class='progress center absolute' v-if='progress.visible'>
        <div v-if='!progress.errorMessage'>
          {{progress.message}} {{progress.completed}}
        </div>     
        <div v-if='progress.errorMessage' class='error'>
          <div>{{progress.errorMessage}}</div>
          <div class='error-details'>{{progress.errorDetails}}</div>
        </div>
      </div>
      <div class='controls absolute' v-if='loaded && !progress.visible'>
        <div class='help' v-if='helpVisible'>
          {{getHelpText()}}
        </div>
        <div class='route-info-container' v-if='!helpVisible' >
          <svg class='route-info' viewBox='0 0 400 40'  @click.prevent='detailsVisible = !detailsVisible'>
            <g>
              <path d='M20,20 L80,20 M290,20 L350,20' stroke-width='4' stroke='red' fill="transparent" ></path>
              <route-point :point='{x: 20, y: 20}' :scale='1' :r='12' symbol='A' :fontSize='12' :strokeWidth='1' :textY='4' ></route-point>
              <route-point :point='{x: 350, y: 20}' :scale='1' :r='12' symbol='B' :fontSize='12' :strokeWidth='1' :textY='4'></route-point>
              <text x='185.5' y='25' fill='white' text-anchor='middle' font-size='18px'>{{pathText}}</text>
            </g>
            <g>
              <path d='M372,15 L388,15 380.5,28z' stroke-width='0' stroke='white' fill="hsl(215, 34%, 64%)" v-if='!detailsVisible'></path>
              <path d='M372,28 L388,28 380.5,15z' stroke-width='0' stroke='white' fill="hsl(215, 34%, 64%)" v-if='detailsVisible'></path>
            </g>
          </svg>
          <a href='#' @click.prevent='clearRoute' class='reset'>clear</a>
        </div>
        <div v-if='detailsVisible && !helpVisible' class='details'>
          <div class='row'>
            <div class='label'>Path length:</div>
            <div class='col'>{{stats.pathLength}}</div>
          </div>
          <div class='row'>
            <div class='label'>Path finder:</div>
            <select class='col' v-model='pathFinder.selected' @change='updateSearchAlgorithm'>
              <option v-for='algorithm in pathFinder.algorithms' :value='algorithm.value'>{{algorithm.name}}</option>
            </select>
          </div>
        </div>
      </div>
      <div class='graph-name' v-if='!progress.visible' :title='graphNameTitle'>
          <select class='col' v-model='graphSettings.selected' @change='updateGraph'>
            <option v-for='graph in graphSettings.graphs' :value='graph.value'>{{graph.name}}</option>
          </select>
      </div>
    </div>
    <div class='about-line'>
      <a class='about-link' href='#' @click.prevent='aboutVisible = true'>about...</a>
      <a class='bold' href='http://github.com/anvaka/ngraph.path'>source code</a>
    </div>
    <div class='osm-note' v-if='!progress.visible && graphSettings.selected !== "USA-road-d.NY"'>
      Graph was extracted from <a href='https://www.openstreetmap.org' target='_blank'>www.openstreetmap.org</a>.
      It is made available under <a href='https://opendatacommons.org/licenses/odbl/summary/' target='_blank'>ODbL</a>
    </div>
    <about v-if='aboutVisible' @close='aboutVisible = false'></about>
  </div>
</template>

<script>
import api from './appModel';
import SVGContainer from './SVGContainer';
import RoutePoint from './components/RoutePoint';
import About from './components/About';

const bus = require('./bus');
const wgl = require('w-gl');

export default {
  name: 'app',
  components: {
    RoutePoint,
    About
  },
  mounted() {
    this.webGLEnabled = wgl.isWebGLEnabled(this.$refs.canvas);
    if (!this.webGLEnabled) {
      // TODO: Maybe render something smaller with SVG?
      return;
    }

    api.loadPositions()
    bus.on('graph-loaded', this.createScene, this);
  },
  beforeDestroy() {
    bus.off('graph-loaded', this.createScene);
    this.ensurePreviousSceneDestroyed();
  },
  data() {
    return {
      webGLEnabled: true,
      loaded: false,
      detailsVisible: false,
      progress: api.progress,
      routeStart: api.routeStart,
      routeEnd: api.routeEnd,
      stats: api.stats,
      scale: 1,
      pathInfo: api.pathInfo,
      pathFinder: api.pathFinderSettings,
      graphSettings: api.graphSettings,
      aboutVisible: false
    }
  },
  computed: {
    graphNameTitle() {
      let stats = this.stats;
      if (!stats) return '';

      return stats.graphNodeCount + ' nodes; ' + stats.graphLinksCount + ' edges';
    },
    helpVisible() {
      return !(this.routeStart.visible && this.routeEnd.visible);
    },
    pathText() {
      if (this.pathInfo.noPath) {
        return 'No path (' + this.stats.lastSearchTook + ')';
      }
      return 'Found in: ' + this.stats.lastSearchTook;
    }
  },

  methods: {
    clearRoute() {
      api.clearRoute();
    },
    getHelpText() {
      if (!this.routeStart.visible) {
        return 'Click anywhere to select starting point';
      } else if (!this.routeEnd.visible) {
        return 'Click anywhere to select destination';
      }
    },

    ensurePreviousSceneDestroyed() {
      if (this.scene) {
        this.scene.dispose();
        this.scene = null;
      }
      if (this.unsubscribeMoveEvents) {
        this.unsubscribeMoveEvents();
        this.unsubscribeMoveEvents = null;
      }
    },

    createScene() {
      this.ensurePreviousSceneDestroyed();

      let canvas = this.$refs.canvas;
      this.loaded = true;

      this.scene = wgl.scene(canvas);
      // this.scene.setPixelRatio(2);
      let scene = this.scene;
      let svgConntainer = new SVGContainer(this.$refs.svg.querySelector('.scene'), this.updateSVGElements.bind(this));
      this.scene.appendChild(svgConntainer)
      scene.setClearColor(12/255, 41/255, 82/255, 1)
      //scene.setClearColor(1, 1, 1, 1)

      let bbox = api.getGraphBBox();
      let initialSceneSize = bbox.width/8;
      scene.setViewBox({
        left:  -initialSceneSize,
        top:   -initialSceneSize,
        right:  initialSceneSize,
        bottom: initialSceneSize,
      })

      let graph = api.getGraph();

      let linksCount = graph.getLinksCount();
      let lines = new wgl.WireCollection(linksCount);
      lines.color = {r: 0.8, g: 0.8, b: 0.8, a: 0.7}
      // lines.color = {r: 0.1, g: 0.1, b: 0.1, a: 0.9}
      graph.forEachLink(function (link) {
        let from = graph.getNode(link.fromId).data;
        let to = graph.getNode(link.toId).data

        lines.add({ from, to });
      });

      scene.appendChild(lines);

      scene.on('mousemove', this.onMouseMoveOverScene, this);
      scene.on('click', this.onSceneClick, this);

      let boundMouseDown = this.handleMouseDown.bind(this);
      document.body.addEventListener('mousedown', boundMouseDown, true);
      document.body.addEventListener('touchstart', boundMouseDown, true);

      this.unsubscribeMoveEvents = function() {
        document.body.removeEventListener('mousedown', boundMouseDown, true);
        document.body.removeEventListener('touchstart', boundMouseDown, true);
      }
    },

    updateSVGElements(svgConntainer) {
      let strokeWidth = 6/svgConntainer.scale;
      this.$refs.foundPath.setAttributeNS(null, 'stroke-width', strokeWidth + 'px');
      this.scale = svgConntainer.scale / this.scene.getPixelRatio();
    },

    handleMouseDown(e) {
      var s;
      var touchId = undefined;
      if (e.touches) {
        let mainTouch = (e.changedTouches || e.touches)[0];
        s = this.scene.getSceneCoordinate(mainTouch.clientX, mainTouch.clientY);
        touchId = mainTouch.identifier;
      } else {
        s = this.scene.getSceneCoordinate(e.clientX, e.clientY);
      }

      let handleUnderCursor = api.getRouteHandleUnderCursor({
        sceneX: s.x,
        sceneY: s.y
      }, this.scene);
      if (handleUnderCursor) {
        e.stopPropagation()
        e.preventDefault()
        handleUnderCursor.startDragging(this.scene, touchId);
        return;
      }
    },

    updateGraph() {
      this.ensurePreviousSceneDestroyed();
      setTimeout(() => {
        api.updateSelectedGraph();
      }, 0);
    },

    updateSearchAlgorithm() {
      api.updateSearchAlgorithm();
    },

    onSceneClick(e) {
      api.handleSceneClick(e);
    },

    onMouseMoveOverScene(e) {
      let now = new Date();
      let handle = api.getRouteHandleUnderCursor(e, this.scene);
      if (handle !== this.prevHandle) {
        this.$refs.canvas.style.cursor = handle ? 'pointer' : ''
        this.prevHandle = handle;
      }
    },
  }
}
</script>

<style lang='stylus'>
.absolute {
  position: absolute;
}

canvas {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
.progress {
  color: white;
  padding: 0 14px;
  font-size: 24px;
}

.center {
  display: flex;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.no-webgl {
  width: 100%;
  color: hsla(215, 37%, 55%, 1);
  flex-direction: column;
  text-align: center;
  padding: 12px;

  .video-demo {
    margin-top: 20px;
    width: 853px;
    height: 480px;
  }

  h4 {
    margin: 7px 0;
    font-size: 24px;
  }
}

.controls {
  width: 440px;
  top: 0;
  margin: 14px;
  display: flex;
  flex-direction: column;
  background-color: hsla(215, 74%, 18%, 1);
  color: hsla(215, 37%, 55%, 1);
  border: 1px solid hsla(215, 37%, 55%, 1);
}

.actions {
  height: 40px;
  display: flex;
  flex-direction: row;
}
.help {
  height: 40px;
  padding:10px;
  text-align: center;
  font-size: 14px;
  color: white;
}
.direction-switch {
  display: flex;
  height: 100%;
  flex: 1;
  align-items: center;
  justify-content: center;
}

a {
  text-decoration: none;
}

a.direction-switch {
  color: hsla(215, 37%, 55%, 1);
}
a.highlighted {
  color: white;
  border-bottom: 1px dashed white;
}
.stats {
  padding: 4px;
  position: absolute;
  background-color: hsla(215, 74%, 18%, 1);
  margin: 14px;
  bottom: 0;
  font-size: 12px;
  color: hsla(215, 37%, 55%, 1);
}

.bold {
  color: hsla(215, 37%, 85%, 1);
}

.row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  height: 32px;
}
.col {
  flex: 1
}

.details {
  padding: 8px 14px;
}

select {
  background: transparent;
  border: none;
  color: hsla(215, 37%, 85%, 1);
  appearance: none;
  font-size: 14px;
  border-bottom: 1px dashed;
  border-radius: 0;
  padding-bottom: 4px;
}

option {
  color: black;
}

svg text {
  pointer-events: none;
  user-select: none;
}
select:focus {
  outline: none;
}

.about-line {
  display: flex;
  position: absolute;
  width: 350px;
  left: 50%;
  bottom: 0;
  padding: 7px 12px;
  background-color: hsla(215, 74%, 18%, 0.8);
  transform: translateX(-50%);
  a {
    flex: 1;
    text-align: center;
  }
}

a.about-link {
    color: hsla(215, 37%, 85%, 1);
    font-size: 16px;
}

.graph-name {
  position: absolute;
  bottom: 42px;
  left: 50%;
  transform: translateX(-50%);
  background-color: hsla(215, 74%, 18%, 0.8);
  padding: 0 10px;
  select {
    font-size: 24px;
    cursor: pointer;
  }
}

.osm-note {
    position: absolute;
    color: #6285b7;
    width: 290px;
    background-color: hsla(215, 74%, 18%, 0.8);
    font-size: 11px;
    text-align: right;
    top: 14px;
    right: 14px;
    a {
      color: #6285b7;
    }
}

@media (max-width: 800px) {
  .osm-note {
    // The screen size is too small for this. Visitors can read it
    // in the about page.
    display: none;
  }
  .progress {
    font-size: 18px;
  }
  .about-line {
    width: 100%;
    bottom: 0;
  }

  .details {
    padding: 5px;
  }
  .controls {
    width: 100%;
    margin: 0;
  }
  .stats {
    margin: 0;
    bottom: 0px;
    top: auto;
  }

  a.about-link {
    bottom: 0;
    padding-bottom: 4px;
  }

  .no-webgl {
    .video-demo {
      width: 560px;
      height: 315px;
    }
  }

  .direction-switch {
    font-size: 14px;
  }
}

@media (max-width: 600px) {
  .no-webgl {
    padding: 0;
    div {
      padding: 7px;
    }
    .video-demo {
      width: 100%;
      height: 300px;
    }
  }
  .graph-name {
    bottom: 48px;
    select {
      font-size: 16px;
    }
  }
}

svg.svg-overlay {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: transparent;
}

.route-info-container {
  display: flex;
}

svg.route-info {
  flex: 1;
  height: 40px;
  cursor: pointer;
  width: 100%;
  margin-left: 7px;
}

a.reset {
  color: hsla(215, 37%, 85%, 1);
  font-size: small;
  padding: 0 10px;
  display: block;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}


.label {
  width: 100px;
  flex-shrink: 0;
  padding-right: 7px;
}
.no-pointer {
  pointer-events: none;
}

.error {
  color:deeppink;
}
.error-details {
  font-family: monospace;
  text-align: left;
}

a::selection,
h3::selection,
h4::selection,
div::selection,
p::selection {
  background: #d03094;
  color: white;
}
</style>
