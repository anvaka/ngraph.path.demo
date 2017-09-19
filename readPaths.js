const forEachLine = require('for-each-line');
const aStarPathSearch = require('ngraph.path').astarBi;

const graph = require('ngraph.graph')();
let graphFile = './data/USA-road-d.NY.gr';
let coordinatesFile = './data/USA-road-d.NY.co';

console.time('reading');
forEachLine(graphFile, (line) => {
  if (line[0] !== 'a') return; // Skip non-arcs


  let parts = line.split(' ');

  let fromId = parse(parts[1]);
  let toId = parse(parts[2]);
  let weight = parse(parts[3]);

  graph.addLink(fromId, toId, weight);
})
.then(readDistances)
.then(measurePathSearch)

function readDistances() {
  return forEachLine(coordinatesFile, line => {
    if (line[0] !== 'v') return;

    let parts = line.split(' ')
    let id = parse(parts[1]);
    let x = parse(parts[2]);
    let y = parse(parts[3]);

    graph.getNode(id).data = { x, y }
  })
}


function parse(segment) {
  let num = Number.parseInt(segment, 10);
  if (Number.isNaN(num)) throw new Error('Not a number: ' + segment);

  return num;
}

function measurePathSearch() {
  console.log('read', graph.getLinksCount() + ' links, nodes: ' + graph.getNodesCount());
  console.timeEnd('reading');
  console.log('Measuring path search perf...')

  console.time('astar');
  let pathFinder = aStarPathSearch(graph, {
    oriented: true,
    distance: distance,
    heuristic: distance
  });

  let path = pathFinder.find(1,263813)
  console.timeEnd('astar');
  console.log(JSON.stringify(path.map(p => p.id)))

  function distance(a, b) {
    let aPos = a.data;
    let bPos = b.data;
    let dx = aPos.x - bPos.x;
    let dy = aPos.y - bPos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
