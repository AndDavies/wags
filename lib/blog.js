/* eslint-disable @typescript-eslint/no-require-imports */

// lib/blog.js

/**
 * @typedef {{ slug: string; published_at: string; }} SimpleBlogPost
 */

const blogData = require('../data/blogPosts.json');

/**
 * Returns a promise resolving to an array of blog slugs.
 * @returns {Promise<string[]>}
 */
async function getAllBlogSlugs() {
  return blogData.map((post) => post.slug);
}

module.exports = { getAllBlogSlugs };
