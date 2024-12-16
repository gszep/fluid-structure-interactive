const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	mode: "development",
	entry: {
		index: "./src/index.ts",
	},
	devtool: "inline-source-map",
	devServer: {
		static: "./docs",
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: "Fluid Structure Interactive",
			template: "src/index.html",
		}),
	],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.wgsl/,
				type: "asset/source",
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "docs"),
		clean: true,
	},
	optimization: {
		runtimeChunk: "single",
	},
};
