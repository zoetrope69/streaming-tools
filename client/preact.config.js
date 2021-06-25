module.exports = function (config) {
  if (process.env.NODE_ENV === "development" && config.devServer) {
    config.devServer.proxy = [
      {
        // proxy requests matching a pattern:
        path: "/",

        // where to proxy to:
        target: "http://localhost:4000",
      },
    ];
  }
};
