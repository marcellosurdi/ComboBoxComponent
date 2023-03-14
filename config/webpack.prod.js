const version = JSON.stringify( require( '../package.json' ).version ).replace( /"/g, '' );
const paths = require( './project-paths' );
const common = require( './webpack.common' );
const { merge } = require( 'webpack-merge' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const TerserWebpackPlugin = require( 'terser-webpack-plugin' );
const CssMinimizerWebpackPlugin = require( 'css-minimizer-webpack-plugin' );

module.exports = ( env, argv ) => {
   return merge( common, {
      mode: 'production',

      // https://webpack.js.org/concepts/entry-points/#entrydescription-object
      entry: {
        'combobox-component': {
          import: paths.src + '/export.js',
          library: {
            name: 'ComboBoxComponent',
            type: 'umd',
          }
        }
      },

      output: {
        filename: 'js/[name].min.js',
      },

      devtool: false,

      module: {
        rules: [
          {
            test: /\.(css|scss)$/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
              },
              'css-loader',
              'sass-loader',
            ],
          },
        ],
      },

      plugins: [
        new MiniCssExtractPlugin({
          filename: 'css/[name].min.css',
        }),

        new HtmlWebpackPlugin({
          filename: 'index.html',
          title: 'combobox-component@' + version,
          template: paths.static + '/tpl/export.html',
          inject: false,
          minify: false,
        }),
        
      ],

      optimization: {
        minimizer: [
          new TerserWebpackPlugin( {} ),
          new CssMinimizerWebpackPlugin()
        ],
      },
    }
  );
}
