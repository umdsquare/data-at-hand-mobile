module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      "module-resolver",
      {
        root: ['./'],
        alias: {
          '^@credentials/(.+)': "./credentials/\\1",
          '^@style/(.+)': "./src/style/\\1",
          '^@core/(.+)': "./src/core/\\1",
          '^@state/(.+)': "./src/state/\\1",
          '^@measure/(.+)': "./src/measure/\\1",
          '^@components/(.+)': "./src/components/\\1",
          '^@utils/(.+)': "./src/utils/\\1",
        }
      }
    ]
  ]
};
