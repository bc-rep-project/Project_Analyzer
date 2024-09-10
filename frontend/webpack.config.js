const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); //  Simplify HTML management

module.exports = {
  mode: 'development', //  Switch to 'production' for optimized builds 
  entry: './src/main.ts',  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }, 
      {  
        test: /\.css$/, // For basic CSS files
        use: [ 'style-loader', 'css-loader' ]  // Processes CSS files
      }
      // ... other loaders for images or other asset types  ... 
    ], 
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devtool: 'inline-source-map',  // Generates inline source maps for debugging  
  devServer: { // Basic development server configuration
    static: './dist', // Serve static files from 'dist' 
    port: 9000,  // Port to run on
    hot: true,   // Hot reloading 
    open: true   // Opens the browser on start 
  }, 
  plugins: [
    new HtmlWebpackPlugin({ //  Configures index.html injection/management  
       template: './src/index.html'  
    })  
  ],
  output: {
    filename: 'bundle.js',  
    path: path.resolve(__dirname, 'dist'),
    clean: true   //  Clean 'dist' folder before each build 
  }
};