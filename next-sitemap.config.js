/** @type {import('next-sitemap').IConfig} */
const { createClient } = require("@supabase/supabase-js");

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
  siteUrl: "https://wagsandwanders.com", // Updated to your domain
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: ["/admin/*", "/dashboard/*"],

  // Fetch dynamic routes from Supabase with error logging
  additionalPaths: async (config) => {
    try {
      // Fetch airline slugs
      const { data: airlines, error: airlineError } = await supabase
        .from("airline_pet_policies")
        .select("slug");
      if (airlineError) {
        console.error("Error fetching airlines:", airlineError);
      }
      console.log("Airlines fetched:", airlines?.length || 0);

      // Fetch country policy slugs
      const { data: policies, error: policyError } = await supabase
        .from("pet_policies")
        .select("slug");
      if (policyError) {
        console.error("Error fetching policies:", policyError);
      }
      console.log("Policies fetched:", policies?.length || 0);

      // Fetch blog posts (adjust table name if needed)
      const { data: blogPosts, error: blogError } = await supabase
        .from("blog_posts") // Replace with your actual blog table name
        .select("slug");
      if (blogError) {
        console.error("Error fetching blog posts:", blogError);
      }
      console.log("Blog posts fetched:", blogPosts?.length || 0);

      const airlinePaths = airlines?.map((airline) => ({
        loc: `/directory/airlines/${airline.slug}`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: 0.8,
      })) || [];

      const policyPaths = policies?.map((policy) => ({
        loc: `/directory/policies/${policy.slug}`,
        lastmod: new Date().toISOString(),
        changefreq: "monthly",
        priority: 0.7,
      })) || [];

      const blogPaths = blogPosts?.map((post) => ({
        loc: `/blog/${post.slug}`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: 0.6,
      })) || [];

      // Updated static paths to match your site
      const staticPaths = [
        { loc: "/", lastmod: new Date().toISOString(), changefreq: "daily", priority: 1.0 },
        { loc: "/directory", lastmod: new Date().toISOString(), changefreq: "daily", priority: 0.9 },
        { loc: "/directory/airlines", lastmod: new Date().toISOString(), changefreq: "daily", priority: 0.9 },
        { loc: "/directory/policies", lastmod: new Date().toISOString(), changefreq: "daily", priority: 0.9 },
        { loc: "/blog", lastmod: new Date().toISOString(), changefreq: "weekly", priority: 0.8 },
        { loc: "/how-it-works", lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.7 },
        { loc: "/about", lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.7 },
      ];

      return [...staticPaths, ...airlinePaths, ...policyPaths, ...blogPaths];
    } catch (error) {
      console.error("Error in additionalPaths:", error);
      return [];
    }
  },

  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/admin/*", "/dashboard/*"] },
    ],
  },
};