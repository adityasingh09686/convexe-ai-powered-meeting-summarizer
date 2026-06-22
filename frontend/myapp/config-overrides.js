module.exports = function override(config, env) {
  config.module.rules.forEach((rule) => {
    (rule.oneOf || []).forEach((oneOf) => {
      if (oneOf.type === "javascript/auto") {
        oneOf.resolve = { fullySpecified: false };
      }
    });
  });
  
  // A more robust catch for fullySpecified issues in Webpack 5:
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
        fullySpecified: false
    }
  });

  return config;
};
