class DrawnNet {
  constructor (net, drawer, positions) {
    if (positions === []) {
      net.forEachNode((key, attr) => {
        positions.push([Math.random(), Math.random()])
      })
    }
    this._plot(net, drawer, positions)
  }

  _plot (net, drawer, positions) {
  }
}

module.exports = { use: { DrawnNet } }
