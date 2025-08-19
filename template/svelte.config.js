import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { sveltePreprocess } from 'svelte-preprocess'

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: sveltePreprocess({
    scss: {
      // 注入到每个 <style lang="scss"> 之前 —— 只放变量 / mixin / function，避免样式输出重复
      prependData: `@use './src/common/scss/mixin.scss' as *;`
      // 也可以用 @import： `@import 'src/styles/_variables.scss';`
    },
    // 如果需要 postcss、typescript 等，也可以在这里配置
  }),
}
