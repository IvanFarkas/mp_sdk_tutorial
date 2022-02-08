import path from 'path'; //path library from node.js
import paths from '../config/paths'; // *our helper paths config so we don't do path calcs in here*

// Plugins for webpack
import HtmlWebpackPlugin from 'html-webpack-plugin'; // docs -> https://webpack.js.org/plugins/html-webpack-plugin/
import tsConfigPathPlugin from 'tsconfig-paths-webpack-plugin'; // docs -> https://www.npmjs.com/package/tsconfig-paths-webpack-plugin
import TerserPlugin from 'terser-webpack-plugin'; // docs -> https://github.com/webpack-contrib/terser-webpack-plugin
import sass from 'sass'; // docs -> https://sass-lang.com/install
import ESLintPlugin from 'eslint-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

// Separate so we can call it differently pending on build environment
function getPlugins(env) {
  const htmlWebPackPlugin = new HtmlWebpackPlugin({
    title: 'Matterport - Nav Mesh',
    fileName: 'index.html', // You can set whatever filename you want here.
    template: paths.buildHtmlTemplatesLocalIndex,
    // inject: 'body', // Tell html webpack plugin where to inject scripts, body places them at end of body
    // publicPath: '/',
    // scriptLoading: 'blocking', // This is an SPA so we'll block, but you might want to defer for your use case
    // hash: true,
    // cache: true,
    // showErrors: true,

    // Test!!!
    inject: true,
    minify: false
  });

  return [
    htmlWebPackPlugin,
    new ESLintPlugin({
      context: paths.root,
      extensions: ['js', 'jsx', 'ts', 'tsx'],
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/assets/models', to: 'assets/models' },
        { from: 'src/assets/images', to: 'assets/images' },
        { from: 'src/bundle', to: 'bundle' }
      ],
    }),
  ];
}

// Separate function to get the config so we can call it from environment based config files.
export function getBaseWebPackConfig(env, argv) {
  let config = {};
  config.mode = 'development'; // We'll set the mode here, you could set this differently pending on the value of env or argv being passed in from command line
  const isLocalDev = argv.env.localdev ? true : false;

  // Get the plugins from our getPlugins helper
  config.plugins = getPlugins(env);

  // Read up on code splitting, you can use this entry object to define your app as separate entry chunks that depend on each other to optimize how webpack generates your bundle.
  config.entry = {
    // Here we are defining two entries which will be separate chunks and we are telling webpack that the app entry depends on the vendor entry.
    // We'll configure our vendor styles (bootstrap/overrides etc to be output in a separate chunk)
    vendor: {
      import: paths.srcScssVendorEntry,
    },
    app: {
      import: paths.srcIndexEntry,
      dependOn: 'vendor',
    },
    scss: {
      import: paths.srcScssEntry,
      dependOn: 'vendor',
    },
  };

  config.output = {
    filename: '[name].[contenthash].js', // We have more than one chunk, so we want webpack to output based on the chunks name (app or vendor) and it's content hash
    // The content hash will change when the files content changes
    path: paths.dst, // This tells webpack where to output the files, here we're using the path we calculating in our config paths helper
    clean: true, // This tells webpack to clean the output path first, so if the files exist they'll be cleaned up first.
    assetModuleFilename: 'assets/[name][ext]', // Make assets have friendly names
  };

  config.resolve = {
    extensions: ['.scss', '.js', '.jsx', '.tsx', '.ts'],
    plugins: [
      new tsConfigPathPlugin(), // This is the third final piece to using tsConfig as a source of truth for path aliases, it tells webpack to use it to resolve aliases in our actual code during compilation.
    ],
    fallback: {
      fs: false,
      util: require.resolve('util/'),
      url: require.resolve('url/'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      path: require.resolve('path-browserify'),
      zlib: require.resolve('browserify-zlib'),
      stream: require.resolve('stream-browserify')
    },
  };

  // Rules tell webpack what to do on specific tests, so we need to tell webpack what to do when it's processing a type script file or a scss file or an image, etc etc etc.
  config.module = {
    rules: [
      {
        test: /\.(js|ts)x?$/i, // Here we define a regex that will run on all ts or js files with tsx or jsx.
        exclude: /[\\/]node_modules[\\/]/, // We tell the loader to ignore node_modules, we will split all node modules out in the vendor chunk
        use: [
          {
            loader: 'babel-loader', // Use the babel loader
            options: {
              presets: [
                '@babel/preset-env', // Use presets for env, react, and typescript
                '@babel/preset-react',
                '@babel/preset-typescript',
              ],
            },
          },
          {
            loader: 'source-map-loader',
            options: {},
          },
        ],
      },
      {
        // This is another webpack 5 feature you don't get with CRA on webpack 4.
        // It can automatically pull any files we reference and spit them out as assets in the output folder.
        // In webpack 4 you had to use file loader, url loader, and so on no more with webpack 5, much simpler.
        test: /\.(woff(2)?|ttf|eot|svg|jpg|jpeg|png|gif|pdf)(\?v=\d+\.\d+\.\d+)?$/, // Here we tell webpack that all fonts, images, pdfs are are asset/resource
        type: 'asset/resource',
      },
      {
        test: /\.(scss|sass)$/, // Tell webpack how to process scss and sass files
        include: [
          paths.src,
          paths.nodemodules, // Our vendor files etc will resolve files from node_modules so we need to tell webpack sass to include node_modules
        ],
        use: [
          // Use tells this rule what loaders to use, loaders are used in a last to first order.
          // So the last loader is processed first, then the loader above it, till the first loader.
          {
            // Note, in production you should use a css extractor here instead but extracting css is slow so using style-loader is much faster in development
            loader: 'style-loader', // docs -> https://webpack.js.org/loaders/style-loader/
            options: {
              esModule: false,
              insert: 'head',
            },
          },
          {
            loader: 'css-loader', // docs -> https://www.npmjs.com/package/css-loader
            options: {
              modules: true, // Disable modules, this build isn't using styled components in react
              esModule: true, // Disable es module syntax
              sourceMap: true, // Enables/Disables generation of source maps
            },
          },
          {
            loader: 'postcss-loader', // docs -> https://github.com/webpack-contrib/postcss-loader
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              implementation: sass,
            },
          },
        ],
      },
    ],
  };

  // You have control over optimization here, i.e. you can tell webpack how to split chunks and can create test functions for say CSS so css get's extracted to it's own chunk.
  config.optimization = {
    // these are the defaults from  // docs -> https://webpack.js.org/plugins/split-chunks-plugin/#defaults
    splitChunks: {
      chunks: 'async',
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  };

  // Only run the dev server if we're in local dev passed in from command line args.
  if (isLocalDev) {
    console.log('DEV SERVER');
    config.devtool = 'eval-source-map';
    config.devServer = {
      historyApiFallback: true,
      hot: true, // Turns on hot module reloading capability so when we change src it reloads the module we changed, thus causing a react rerender!
      port: 4000,
      client: {
        progress: true,
        overlay: true,
        logging: 'info', // Give us all info logged to client when in local dev mode
      },
      static: {
        publicPath: '/',
        directory: paths.dst,
      },
    };
  } else {
    config.devtool = 'source-map';
  }

  return config;
}
