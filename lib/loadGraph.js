const forEachLine = require('for-each-line');
const createGraph = require('ngraph.graph');

module.exports = loadGraph;

function loadGraph(coordinatesFile, graphFileName) {
  const graph = createGraph();

  return readCoordinates().then(readLinks).then(() => {
    return graph;
  });

  function readCoordinates() {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let coordinates = [];
    let processed = 0;

    return forEachLine(coordinatesFile, (line) => {
      if (line[0] !== 'v') return;

      let parts = line.split(' ')
      let id = parse(parts[1]);
      let x =parse(parts[2]);
      let y = -parse(parts[3]);

      coordinates.push({x, y, id});

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      processed += 1;
      if (processed !== id) console.log('missing id');
    }).then(addToGraph);


    function addToGraph() {
      let dx = (maxX + minX) / 2;
      let dy = (maxY + minY) / 2;

      coordinates.forEach(p => {
        graph.addNode(p.id, {
          x: p.x - dx,
          y: p.y - dy
        });
      });
    }
  }

  function readLinks() {
    return forEachLine(graphFileName, (line) => {
      if (line[0] !== 'a') return; // Skip non-arcs


      let parts = line.split(' ');

      let fromId = parse(parts[1]);
      let toId = parse(parts[2]);
      let weight = parse(parts[3]);

      graph.addLink(fromId, toId, weight);
    })
  }
}


function parse(segment) {
  let num = Number.parseInt(segment, 10);
  if (Number.isNaN(num)) throw new Error('Not a number: ' + segment);

  return num;
}