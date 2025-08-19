import { defineConfig, loadEnv } from "vite";
import path from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import bundleAnalyzer from "rollup-plugin-bundle-analyzer";
import postCssPxToRem from "postcss-pxtorem";
import autoprefixer from "autoprefixer";
import terser from "@rollup/plugin-terser";
// 雪碧图
import Spritesmith from "vite-plugin-spritesmith";
import spriteTemplate from "./src/common/js/spriteTemplate.js";

// 获取执行时的参数 --report, 用于打包分析
const npm_lifecycle_script = process.env.npm_lifecycle_script || "";
const isReport = npm_lifecycle_script.indexOf("--report") > -1;
// 雪碧图功能开关
const enableSprite = process.env.VITE_ENABLE_SPRITE === 'true';

// https://vitejs.dev/config/
export default ({ mode }) => {
	const env = loadEnv(mode, process.cwd());
	console.log("🚀 ~ file: vite.config.js:20 ~ env:", env);
	const isProduction = mode !== "development";
	return defineConfig({
		base: "./",
		// 优化依赖预构建
		optimizeDeps: {
			include: [
				"svelte",
				"svelte/transition",
				"svelte/store",
				"svelte-spa-router",
				"svelte-i18n",
				"axios"
			],
			exclude: ["@shareit/ad-lib", "@shareit/hummer-components-anyjs"]
		},
		server: {
			port: 5173,
			proxy: {
				"/video": {
					target: env.VITE_VIDEO_API_HOST,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/video/, "")
				}
			}
			// 配置后可以在DEV模式访问该目录
			// fs: {
			// 	strict: false,
			// 	allow: ["games"]
			// }
		},
		plugins: [
			svelte(),
			isReport ? bundleAnalyzer() : null,
			isProduction
				? terser({
						format: {
							comments: false
						},
						compress: {
							drop_console: true,
							drop_debugger: true
						}
					})
				: null,
			enableSprite
				? Spritesmith({
						watch: isProduction ? false : true,
						src: {
							cwd: "./src/assets/images/spriteIcons",
							glob: "*.png"
						},
						target: {
							image: "./src/assets/images/sprite.png",
							css: [
								[
									"./src/common/scss/sprite.scss",
									{
										format: "function_based_template"
									}
								]
							]
						},
						apiOptions: {
							cssImageRef: "@/assets/images/sprite.png"
						},
						customTemplates: {
							function_based_template: spriteTemplate
						}
					})
				: null
		],
		build: {
			rollupOptions: {
				output: {
					chunkFileNames: "js/[name]-[hash].js",
					entryFileNames: "js/app-[hash].js",
					assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
					// 手动分包配置 - 将公共资源抽离到 vendor
					manualChunks: (id) => {
						// 将 node_modules 中的第三方库分离到不同的 vendor 包
						if (id.includes("node_modules")) {
							// 视频播放器相关 - 单独分包（较大）
							if (id.includes("xgplayer")) {
								return "vendor-xgplayer";
							}

							// 其他小型第三方库统一打包到 vendor
							return "vendor";
						}
					}
				},
				// 开启tree shaking
				treeshake: true
			},
			// 优化构建性能
			target: "es2015",
			minify: isProduction ? "terser" : false,
			// 分包大小限制和警告
			chunkSizeWarningLimit: 1000,
			// 启用 CSS 代码分割
			cssCodeSplit: true,
			// 构建时生成 sourcemap（生产环境可关闭）
			sourcemap: !isProduction,
			// 显示 gzip 压缩后的文件大小
			reportCompressedSize: true,
			// 优化资源内联阈值
			assetsInlineLimit: 4096
		},
		resolve: {
			alias: {
				"@": path.resolve("./src"),
				$components: path.resolve("./src/components"),
				$routes: path.resolve("./src/routes"),
				$stores: path.resolve("./src/stores")
			}
		},
		css: {
			postcss: {
				plugins: [
					postCssPxToRem({
						rootValue: 36, // 2倍图(720px)
						unitPrecision: 5,
						propList: ["*"],
						selectorBlackList: [],
						replace: true,
						mediaQuery: false,
						minPixelValue: 0,
						exclude: /node_modules/i
					}),
					autoprefixer()
				]
			}
			// preprocessorOptions: {
			// 	scss: {
			// 		additionalData: `@import "./src/common/scss/mixin.scss";`
			// 	}
			// }
		}
	});
};
