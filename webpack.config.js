const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");

console.log('PORT')
module.exports = {
  stats: {
    //errorDetails: true,
  },
  mode: "development",
  entry: {
    app: "./src/index.ts",
  },
  devtool: "source-map",
  resolve: {
    extensions: [".js", ".ts"],
    alias: {
      process: "process/browser",
    },
    fallback: {
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      buffer: require.resolve("buffer"),
      path: require.resolve("path-browserify"),
      stream: require.resolve("stream-browserify"),
      zlib: require.resolve("browserify-zlib"),
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: "Development",
      template: "index.html",
      inject: true,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "bundle",
          to: "bundle",
        },
      ],
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
    new Dotenv(),
  ],
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: "ts-loader",
      },
    ],
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    // https: true,
    
    // TODO: It did not take it from the .env file. It used 8080. I do not know why.
    // port: process.env.PORT,
    port: 8000,
  },
  externals: ["tls", "net", "fs"],
};
