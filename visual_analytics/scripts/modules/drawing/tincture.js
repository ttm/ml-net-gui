const chooseUnique = require('../utils.js').chooseUnique
const c = require('chroma-js')
const S = require('color-scheme')
const s = new S()

const random = (ubezier, n, ncolors = 7) => {
  // chosse random color
  // create palette
  ubezier = ubezier || Math.random() > 0.5
  ubezier = ubezier ? bezier : scale
  n = n || (2 + Math.floor(Math.random() * 5))
  const colors = []
  for (let i = 0; i < n; i++) {
    colors.push(c.random())
  }
  return ubezier(colors, ncolors)
}

const bezier = (colors = ['black', 'yellow', 'red', 'white'], ncolors = 7) => {
  const s = c.bezier(colors)
  const cs = []
  for (let i = 0; i < ncolors; i++) {
    cs.push(s(i / (ncolors - 1)).num())
  }
  return cs
}

const scale = (colors = ['black', 'yellow', 'red', 'white'], ncolors = 7) => {
  return c.scale(colors).colors(ncolors, 'num')
}

const basicStruct = c => {
  c = c.map(i => Math.floor(i))
  console.log(c, 'YEY MAN, only int')
  return {
    bg: c[0],
    n: c[1],
    e: c[2],
    v: c[4],
    hl: {
      more: c[5],
      less: c[3],
      bw: c[6]
    }
  }
}

const basicStructPalette = c => {
  c = c.map(i => Math.floor(i))
  return {
    bg: c[11],
    v: c[0],
    e: c[4],
    n: c[8],
    hl: {
      more: c[1],
      less: c[3],
      more2: c[2],
      less2: c[9]
    }
  }
}

const palette = (hue = 75, scheme = 'tetrade', variation) => {
  // best schemes: triade, analogic, tetrade
  // best variations: default, soft, pastel
  let colors = s.from_hue(hue).scheme(scheme)
  if (variation !== undefined) {
    colors = colors.variation(variation)
  }
  return colors.colors().map(c => parseInt(c, 16))
}

const randomPalette = () => {
  const scheme = chooseUnique(['tetrade', 'triade', 'analogic'], 1)[0]
  const variation = chooseUnique(['default', 'soft', 'pastel'], 1)[0]
  console.log(scheme, variation, 'IUIQWEQ')
  return basicStruct(chooseUnique(
    palette(Math.random() * 360,
      scheme,
      variation
    ), 9
  ))
}

const randomPalette2 = () => {
  const p = palette(Math.random() * 360,
    'triade',
    'default'
  )
  return basicStructPalette(p)
}

const handPicked = { // made with:https://gka.github.io/palettes (chroma.js)
  white: {
    bg: 0xffffff,
    n: 0xcccc33,
    v: 0xff0000,
    e: 0x3333cc,
    hl: {
      more: 0x660099,
      less: 0xffff66,
      bw: 0x000000
    }
  },
  black: { // colorblind pallete:
    bg: 0x000000,
    n: 0x666600,
    v: 0xff0000,
    e: 0xffcc00,
    hl: {
      more: 0xff6600,
      less: 0xcccc00,
      bw: 0xffffff
    }
  },
  black2: basicStruct(bezier()),
  black3: basicStruct(bezier(['white', 'red', 'green', 'black']))
}

module.exports = { handPicked, random, scale, basicStruct, bezier, s, randomPalette, randomPalette2, c, S }
