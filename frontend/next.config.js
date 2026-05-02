module.exports = {
  i18n: {
    locales: ["en", "es", "zh", "ja", "pt-br"],
    defaultLocale: "en"
  },
  rewrites: [
    { source: "/api/v1/:path*", destination: "/api/v1/:path*" }
  ]
};
