<template>
  <g :transform='screenScale'>
    <circle :r='r' fill='red' stroke='white' :stroke-width='strokeWidth' ></circle>
    <text :font-size='fontSize' fill='white' text-anchor='middle' :y='textY' class='no-pointer'>{{symbol}}</text>
  </g>
</template>
<script>
export default {
  name: 'RoutePoint',
  props: {
    point: Object,
    scale: Number,
    symbol: String,
    r: Number,
    strokeWidth: {
      type: Number,
      default: 2
    },
    fontSize: {
      type: Number,
      default: 28
    },
    textY: {
      type: Number,
      default: 10
    }
  },
  computed: {
    screenScale() {
      let scale = 1/this.scale;
      let dx = this.point.x;
      let dy = this.point.y;
      return `matrix(${scale}, 0, 0, ${scale}, ${dx}, ${dy})`;
    },
  }
}
</script>