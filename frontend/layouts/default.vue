<template>
  <v-app>
    <v-content>
      <v-container>
        <nuxt />
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
export default {
  head () {
    return {
      script: [
        { src: "https://www.googletagmanager.com/gtag/js?id=UA-145065993-1" },
      ],
      meta: [
        { name: "google-site-verification", content: "_7QyOvNFeTE-F03YCYZWs15DeiokzdL7ykVdJqy-3hk" }
      ]
    }
  },
}
</script>

<style>
html, body {
  overflow: scroll;
}
</style>
