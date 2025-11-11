module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.jsx', '.js', '.json'],
        alias: {
          '@': './src',
          '@data': './src/data',
          '@domain': './src/domain',
          '@presentation': './src/presentation',
          '@utils': './src/utils',
          '@components': './src/presentation/components',
          '@screens': './src/presentation/screens',
          '@hooks': './src/presentation/hooks',
          '@navigation': './src/presentation/navigation',
          '@theme': './src/presentation/theme',
        },
      },
    ],
  ],
};
