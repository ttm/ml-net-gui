import Vue from 'vue'
import feathersClient from '../static/js/feathers-client'
import feathersVuex from 'feathers-vuex'

const { FeathersVuex, service } = feathersVuex(feathersClient, {
  idField: '_id'
})

Vue.use(FeathersVuex)

export const plugins = [
  service('networks', {
    instanceDefaults: {
      data: null,
      layer: 0,
      coarsen_method: null,
      uncoarsened_network: null,
      title: null,
      filename: null,
      description: null,
      user: null,
      userObj: 'User'
    }
  }),
  service('usage', {
    instanceDefaults: {
      usageObj: 'Usage'
    }
  }),
  service('mynsa', {
    instanceDefaults: {
      usageObj: 'Mynsa'
    }
  }),
  service('ansettings', {
    instanceDefaults: {
      networkObj: 'Networks'
    }
  })
]


export const state = () => ({
  counter: 0
})

export const mutations = {
  increment (state) {
    state.counter++
  },
}
