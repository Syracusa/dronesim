import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

rules.push({
  test: /\.(png|svg|jpg|jpeg|gif|glb)$/i,
  type: 'asset/resource',
});

rules.push({
  test: /\.(resource)$/i,
  type: 'asset/inline',
  generator: {
    dataUrl: (content: any) => content
  }
});


export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
