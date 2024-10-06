import viteRawPlugin from "./.vite/vite-raw-plugin.js";

// vite.config.js
export default {
  // config options
  plugins: [
    viteRawPlugin({
      fileRegex: /\.navy$/,
    }),
  ],
}