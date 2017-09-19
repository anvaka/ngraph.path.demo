const createTree = require('yaqt');
const npath = require('ngraph.path');
const loadGraph = require('./lib/loadGraph')
const Progress = require('./lib/Progress');
const RouteHandleViewModel = require('./lib/RouteHandleViewModel')
const getSettings = require('./settings.js')

const queryState = require('query-state');
const bus = require('./bus');

const qs = queryState({
  graph: 'amsterdam-roads'
});

qs.onChange(function(appState) {
  let searchChanged = (appState.fromId !== routeStart.pointId) || 
                      (appState.toId !== routeEnd.pointId);
  if (searchChanged) {
    setCurrentSearchFromQueryState();
    updateRoute();
  }
});

let graph;      // current graph
let graphBBox;  // current bounding box for a graph
let hetTestTree;       // this tree helps us find graph node under cursor
let pathFinder;        // currently selected pathfinder
let pathFindersLookup; // initialized after we load graph

let pendingQueryStringUpdate = 0; // Used to throttle query string updates.

let routeStart = new RouteHandleViewModel(updateRoute, findNearestPoint);
let routeEnd = new RouteHandleViewModel(updateRoute, findNearestPoint);

let stats = {
  visible: false,
  lastSearchTook: 0,
  pathLength: 0,
  graphNodeCount: '',
  graphLinksCount: ''
};

let settings = getSettings(qs);

const api = {
  loadPositions,

  updateSearchAlgorithm,
  updateSelectedGraph,

  getGraph,
  getGraphBBox,

  progress: new Progress(),
  stats,

  routeStart, 
  routeEnd,
  pathInfo: {
    svgPath: '',
    noPath: false
  },

  handleSceneClick,
  getRouteHandleUnderCursor,
  clearRoute,

  pathFinderSettings: settings.pathFinderSettings,
  graphSettings: settings.graphSettings
}

module.exports = api;

/**
 * This method sets a new pathfinder, according to currently selected
 * drop down option from `pathFinderSettings`
 */
function updateSearchAlgorithm() {
  setCurrentPathFinder();
  qs.set('finder', settings.pathFinderSettings.selected);
  updateRoute();
}

function getRouteHandleUnderCursor(e, scene) {
  let transform = scene.getTransform();
  let scale = transform.scale/scene.getPixelRatio();

  if (routeStart.intersects(e.sceneX, e.sceneY, scale)) {
    return routeStart;
  }
  if (routeEnd.intersects(e.sceneX, e.sceneY, scale)) {
    return routeEnd;
  }
}

function getGraphBBox() {
  return graphBBox;
}

function updateRoute() {
  if (!(routeStart.visible && routeEnd.visible)) {
    api.pathInfo.svgPath = '';
    return;
  } 

  let fromId = routeStart.pointId;
  let toId = routeEnd.pointId;
  updateQueryString();

  let start = window.performance.now();
  let path = findPath(fromId, toId);
  let end = window.performance.now() - start;

  api.pathInfo.noPath = path.length === 0;
  api.pathInfo.svgPath = getSvgPath(path);

  stats.lastSearchTook = (Math.round(end * 100)/100) + 'ms';
  stats.pathLength = getPathLength(path);
  stats.visible = true;
}

function updateQueryString() {
  if (pendingQueryStringUpdate) {
    // iOS doesn't like when we update query string too often.
    // need to throttle
    clearTimeout(pendingQueryStringUpdate);
    pendingQueryStringUpdate = 0;
  } 

  pendingQueryStringUpdate = setTimeout(() => {
    pendingQueryStringUpdate = 0;
    if(!(routeStart.visible && routeEnd.visible)) return;

    let fromId = routeStart.pointId;
    let toId = routeEnd.pointId;
    if (qs.get('fromId') != fromId) {
      qs.set('fromId', fromId)
    }
    if (qs.get('toId') !== toId) {
      qs.set('toId', toId);
    }
  }, 400);
}

function getPathLength(path) {
  let totalLength = 0;
  for (let i = 1; i < path.length; ++i) {
    totalLength += dataDistance(path[i - 1], path[i]);
  }
  return numberWithCommas(Math.round(totalLength));
}

function clearRoute() {
  routeStart.clear();
  routeEnd.clear();
}

function handleSceneClick(e) {
  if (!routeStart.visible) {
    setRoutePointFormEvent(e, routeStart);
  } else if (!routeEnd.visible) {
    setRoutePointFormEvent(e, routeEnd);
  }
}

function setRoutePointFormEvent(e, routePointViewModel) {
  if (!hetTestTree) return; // we are not initialized yet.

  let point = findNearestPoint(e.sceneX, e.sceneY)
  if (!point) throw new Error('Point should be defined at this moment');

  routePointViewModel.setFrom(point);
}

function loadPositions() {
  let graphName = qs.get('graph');
  clearRoute();
  hetTestTree = null;
  graph = null;
  stats.visible = false;
  api.progress.reset();

  loadGraph(graphName, api.progress).then(setApplicationModelVariables)
  .catch((e) => {
    api.progress.setError('Could not load the graph', e);
  });
}

function setApplicationModelVariables(loaded) {
  graph = loaded.graph;
  graphBBox = loaded.graphBBox;
  pathFinder = null;

  initHitTestTree(loaded.points);
  initPathfinders();

  stats.graphNodeCount = numberWithCommas(graph.getNodesCount());
  stats.graphLinksCount = numberWithCommas(graph.getLinksCount());
  bus.fire('graph-loaded')
  setTimeout(() => {
    // in case if we have path in the query string
    updateRoute();
  }, 0);
}

function initHitTestTree(loadedPoints) {
  hetTestTree = createTree();
  hetTestTree.initAsync(loadedPoints, {
    progress(i, total) {
      if (i % 500 !== 0) return;

      api.progress.message = 'Initializing tree for point & click'
      api.progress.completed = Math.round(100 * i/total) + '%';
    },
    done() {
      api.progress.treeReady = true;
    }
  });
}



function initPathfinders() {
  pathFindersLookup = {
    'a-greedy-star': npath.aGreedy(graph, {
      distance: distance,
      heuristic: distance
    }),
    'nba': npath.nba(graph, {
      distance: distance,
      heuristic: distance
    }),
    'astar-uni': npath.aStar(graph, {
      distance: distance,
      heuristic: distance
    }),
    'dijkstra': npath.aStar(graph, {
      distance: distance
    }),
  }

  setCurrentPathFinder()
  setCurrentSearchFromQueryState();
}

function setCurrentPathFinder() {
  let pathFinderName = settings.pathFinderSettings.selected;
  pathFinder = pathFindersLookup[pathFinderName];
  if (!pathFinder) {
    throw new Error('Cannot find pathfinder ' + pathFinderName);
  }
}

function setCurrentSearchFromQueryState() {
  if (!graph) return;

  let fromId = qs.get('fromId');
  let toId = qs.get('toId');
  let from = graph.getNode(fromId)
  let to = graph.getNode(toId)
  if (from) routeStart.setFrom(from)
  if (to) routeEnd.setFrom(to)
}

function updateSelectedGraph() {
  qs.set({
    graph: settings.graphSettings.selected,
    fromId: -1,
    toId: -1
  });

  loadPositions();
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function findPath(fromId, toId) {
  return pathFinder.find(fromId, toId).map(l => l.data);
}

function getSvgPath(points) {
  if (points.length < 1) return '';

  return points.map((pt, index) => {
    let prefix = (index === 0) ? 'M' : ''
    return prefix + toPoint(pt);
  }).join(' ');
}

function toPoint(p) { return p.x + ',' + p.y }

function getGraph() {
  return graph;
}

function findNearestPoint(x, y, maxDistanceToExplore = 2000) {
  if (!hetTestTree) return;

  let points = hetTestTree.pointsAround(x, y, maxDistanceToExplore).map(idx => graph.getNode(idx/2))
  .sort((a, b) => {
    let da = pointDistance(a.data, x, y);
    let db = pointDistance(b.data, x, y)
    return da - db;
  });

  if (points.length > 0) {
    return points[0];
  } else {
    // keep trying.
    return findNearestPoint(x, y, maxDistanceToExplore * 2);
  }
}

function pointDistance(src, x, y) {
  let dx = src.x - x;
  let dy = src.y - y;
  return Math.sqrt(dx * dx + dy * dy);
}

function distance(a, b) {
  return dataDistance(a.data, b.data);
}

function dataDistance(a, b) {
  let dx = a.x - b.x;
  let dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy)
}