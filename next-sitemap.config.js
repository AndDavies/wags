/** @type {import('next-sitemap').IConfig} */
const { getAllBlogSlugs } = require('./lib/blog');


module.exports = {
  siteUrl: 'https://wagsandwanders.com',
  generateRobotsTxt: true,
  additionalPaths: async (config) => {
    const staticPaths = ['/', '/directory', '/about', '/blog', '/contact'];
    
    let blogSlugs = [];
    try {
      blogSlugs = await getAllBlogSlugs(); // ensure this returns an array of slugs
    } catch (error) {
      console.error('Error fetching blog slugs:', error);
    }
    const blogPaths = blogSlugs.map((slug) => `/blog/${slug}`);

    // Debug log (you can remove this later)
    console.log('Static paths:', staticPaths);
    console.log('Dynamic blog paths:', blogPaths);

    return [
      ...staticPaths.map((path) => config.transform(config, path)),
      ...blogPaths.map((path) => config.transform(config, path)),
    ];
  },
};
