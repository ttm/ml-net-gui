exports.basic = function () {
  return 'Multilevel hi!'
}

exports.initialize = function () {
  return 'multilevel  initialized!'
}

exports.MLHierarchy = class {
  constructor (network, settings) {
    this.networks = network
    this.settings = settings
  }

  match () { // for matching nodes and yielding the supernodes
  }

  collapse () { // for instantiating the network in the next level with the superlinks yield by supernodes
  }
}
