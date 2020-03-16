export default {
  // server : {
  //   port: 80
  // },
  env: {
    nuxtURL: process.env.nuxtURL || 'http://127.0.0.1:3000',
    feathersURL: process.env.feathersURL || 'http://127.0.0.1:3030',
    flaskURL: process.env.flaskURL || 'http://127.0.0.1:5000',
  },
  server: {
    host: '0.0.0.0', // default: localhost
  },
  modules: [
    '@nuxtjs/vuetify'
  ],
  css: [
    '@/css/main.css'
  ],
  build: {
    extend (config, {isDev, isClient}) {
      config.externals = {
        oimo: true,
        cannon: true,
        // earcut: true
      }
      // if (isDev && isClient) {
      //   config.module.rules.push({
      //     enforce: 'pre',
      //     test: /\.(js|vue)$/,
      //     loader: 'eslint-loader',
      //     exclude: /(node_modules)/
      //   })
      // }
    // transpile: ['pixi.js']
    }
  },
  plugins: [
    {
      src: '~/plugins/pixiPlug',
      ssr: false,
      // mode: 'client'
    },
    { src: '~plugins/ga.js', ssr: false },
  ]
}
