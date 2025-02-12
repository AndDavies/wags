// components/FeaturedBlog.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  featured_image?: string;
}

export default async function FeaturedBlog() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, published_at, featured_image")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Error loading featured blog posts:", error);
    return (
      <section className="py-16 bg-gray-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-black dark:text-white">From Our Blog</h2>
          <p className="text-center text-gray-600 dark:text-neutral-300">Error loading blog posts.</p>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-black dark:text-white">From Our Blog</h2>
          <p className="text-center text-gray-600 dark:text-neutral-300">No featured posts available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-black dark:text-white">From Our Blog</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post: BlogPost) => (
            <div
              key={post.id}
              className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {post.featured_image ? (
                <div className="relative w-full h-48 overflow-hidden rounded-t-2xl">
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 ease-in-out"
                  />
                </div>
              ) : (
                <div className="relative w-full h-48 bg-gray-200 rounded-t-2xl" />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">{post.title}</h3>
                <p className="text-sm mb-4 text-gray-600 dark:text-neutral-300">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-primary font-medium hover:underline"
                >
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
