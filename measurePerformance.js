const randomAPI = require('ngraph.random').random;
const graphPath = require('ngraph.path');

const loadGraph = require('./lib/loadGraph');
loadGraph('./data/USA-road-d.NY.co', './data/USA-road-d.NY.gr')
 .then(g => {
   console.log('graph loaded: ' + g.getLinksCount() + ' links; ' + g.getNodesCount() + ' nodes')
   runPerfTests(g);
})


function runPerfTests(graph) {
  var V = graph.getNodesCount();
  var testCount = 250;

  var aStarBI = graphPath.aGreedy(graph, {
    distance: distance,
    heuristic: distance
  });
  runTests('A* greedy suboptimal', aStarBI, V, testCount);

  var nbaGreedy = graphPath.nba(graph, {
    quitFast: true,
    distance: distance,
    heuristic: distance
  });
  runTests('NBA* greedy suboptimal', nbaGreedy, V, testCount);

  var aStarUni = graphPath.aStar(graph, {
    distance: distance,
    heuristic: distance
  });
  runTests('A* unidirectional', aStarUni, V, testCount);

  var nba = graphPath.nba(graph, {
    distance: distance,
    heuristic: distance
  });
  runTests('NBA*', nba, V, testCount);

  var dijkstra = graphPath.aStar(graph, {
    distance: distance,
    heuristic() { return 0; }
  });

  runTests('Dijkstra', dijkstra, V, testCount);
}

function runTests(name, pathFinder, V, testCount) {
  var random = randomAPI(42);
  var durations = []

  for (var i = 0; i < testCount; ++i) {
    var fromId = random.next(V);
    var toId = random.next(V);
    if (fromId === toId) {
      i -= 1;
      continue;
    }
    var start = clock();

    pathFinder.find(fromId, toId);

    var duration = clock(start);
    durations.push(duration);
  }

  var stats = collectStats(durations);
  console.log('Finished ' + name +'; Stats: ');
  console.log(JSON.stringify(stats));
}

function collectStats(testResults) {
  var sum = 0;

  testResults.sort((a, b) => a - b);
  for (var i = 0; i < testResults.length; ++i) {
    sum += testResults[i];
  }
  var n = testResults.length;

  return {
    avg: sum/n,
    p99: testResults[Math.floor(n * 0.99)],
    p90: testResults[Math.floor(n * 0.9)],
    p50: testResults[Math.floor(n * 0.5)],
    min: testResults[0],
    max: testResults[testResults.length - 1]
  }
}

function distance(a, b) {
  let aPos = a.data;
  let bPos = b.data;
  let dx = aPos.x - bPos.x;
  let dy = aPos.y - bPos.y;

  return Math.sqrt(dx * dx + dy * dy)
}

function clock(start) {
  if ( !start ) return process.hrtime();
  var end = process.hrtime(start);
  return Math.round((end[0]*1000) + (end[1]/1000000));
}
