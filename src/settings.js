module.exports = getSettings

function getSettings(qs) {
  const graphSettings = getAvailableGraphs(qs); 
  const pathFinderSettings = getAvailablePathfinders(qs); 

  return {
    graphSettings,
    pathFinderSettings
  };
}


function getAvailableGraphs(qs) {
  let graphs = [{
    value: 'amsterdam-roads',
    name: 'Amsterdam (76K edges, 1.1 MB)'
  }, {
    value: 'seattle-roads',
    name: 'Seattle (173K edges, 2.4 MB)'
  }, {
    value: 'rome-roads',
    name: 'Rome (258K edges, 3.8 MB)'
  }, {
    value: 'delhi-roads',
    name: 'Delhi (280K edges, 3.9 MB)'
  }, {
    value: 'moscow-roads',
    name: 'Moscow (451K edges, 6.5 MB)'
  }, {
    value: 'USA-road-d.NY',
    name: 'New York (730K edges, 7.6 MB)'
  },
  // Commenting this out, as on mobile devices it may crash the browser.
  //  {
  //   value: 'tokyo-roads',
  //   name: 'Tokyo (879K edges, 12.3 MB)'
  // }
];

  return {
    selected: qs.get('graph'),
    graphs
  };
}

function getAvailablePathfinders(qs) {
  return {
    selected: qs.get('finder') || 'nba',
    algorithms: [{
      value: 'a-greedy-star',
      name: 'Greedy A* (suboptimal)'
    }, {
      value: 'nba',
      name: 'NBA*'
    }, {
      value: 'astar-uni',
      name: 'Unidirectional A*'
    }, {
      value: 'dijkstra',
      name: 'Dijkstra'
    }]
  };
}