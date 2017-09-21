<template>
  <div class='about'>
    <div class='background absolute' @click.prevent='close'></div>
    <div class='content'>
      <h3>ngraph.path <a class='close bold' href='#' @click.prevent='close'>close</a></h3>
      <p>
        This website is a demo for the <a href='https://github.com/anvaka/ngraph.path' class='highlighted'>ngraph.path</a>
        library. The library implements pathfinding algorithms for generic graphs (not limited to grids).
      </p><p>
        Don't use this website for actual navigation :).
      </p>

      <p>My goal was to build a very fast library, that could help many developers
        find their paths. In my tests, the library showed great performance with median
        path finding speed <span class='bold'>34ms</span> on <span class='bold'>733,844</span> edges graph.
      </p>
      <p>I built the roads graph for this demo using amazing <a href='http://www.openstreetmap.org/' target='_blank' class='highlighted'>OpenStreetMap</a>.
      </p>
      <ul>
        <li>
          <a href='https://github.com/anvaka/ngraph.path' class='highlighted'>Learn more </a> about this project on GitHub
        </li><li>
        Stay tuned for updates on <a href='https://twitter.com/anvaka' class='highlighted'>Twitter.</a>
        </li><li>
        <a href='https://www.youtube.com/watch?v=hGeZuIEV6KU' class='highlighted'> Watch a video</a> demo.
        </li>
      </ul>
      <p>With passion,<br/> Anvaka</p>
      <a href='#' @click.prevent='close' class='large-close bold'>
        close
      </a>
    </div>
  </div>
</template>
<script>

export default {
  mounted() {
    this.closeHandler = (e) => {
      if (e.keyCode === 27) {
        e.preventDefault();
        this.close();
      }
    }
    document.addEventListener('keyup', this.closeHandler);
  },
  beforeDestroy() {
    document.removeEventListener('keyup', this.closeHandler);
  },
  methods: {
    close() {
      this.$emit('close');
    }
  }
}
</script>

<style lang='stylus'>
.about {
  position: absolute;
  overflow-y: auto;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;

  .close {
    position: absolute;
    right: 15px;
    font-size: 12px;
  }

  .large-close {
    width: 100%;
    height: 32px;
    display: block;
    text-align: center;
  }

  .content {
    color: hsla(215, 37%, 55%, 1);
    position: absolute;
    background-color: hsla(215, 74%, 18%, 1.0);
    width: 400px;
    padding: 14px;
    border: 1px solid hsla(215, 37%, 55%, 1);
    h3 {
      margin: 0;
      font-weight: normal;
    }
  }
}

.background {
  position: absolute;
  background-color: hsla(215, 74%, 18%, 0.8);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

@media (max-width: 800px) {
  .about {
    justify-content: initial;
  }
  .about .content {
    width: 100%;
    border: none;
  }
}
</style>

