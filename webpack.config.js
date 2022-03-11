const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const DotEnvPlugin = require("dotenv-webpack");

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
          to: "dist/bundle",
        },
      ],
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
    new DotEnvPlugin(),
    // new webpack.DefinePlugin({
    //   'process.env.NODE_ENV': JSON.stringify('development')
    // }),
    //new webpack.EnvironmentPlugin(['MY_ENV_VAR']), // <--This is shorthand, does the same thing as the DefinePlugin
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
    port: 8085,
  },
  externals: ["tls", "net", "fs"],
};
