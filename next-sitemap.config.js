/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://wagsandwanders.com',
    generateRobotsTxt: true,
    additionalPaths: async (config) => {
      // Define your static routes
      const staticPaths = ['/', '/directory', '/about', '/blog', '/contact'];
  
      // Optionally, fetch dynamic routes (for example, blog posts)
      // Replace this with your own data source/API call
      const blogData = await fetch('https://your-api.com/blog-slugs')
        .then((res) => res.json())
        .catch(() => []);
      const blogPaths = blogData.map((slug) => `/blog/${slug}`);
  
      // Combine static and dynamic paths, then transform them as required by next-sitemap
      return [
        ...staticPaths.map((path) => config.transform(config, path)),
        ...blogPaths.map((path) => config.transform(config, path)),
      ];
    },
  }
  