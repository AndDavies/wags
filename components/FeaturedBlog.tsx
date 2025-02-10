// components/FeaturedBlog.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";

// Define an interface to type the blog post data.
interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  featured_image?: string;
}

export default async function FeaturedBlog() {
  // Create a Supabase server client instance.
  const supabase = await createClient();

  // Query for the 3 most recent featured blog posts.
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, published_at, featured_image")
    .eq("is_featured", true) // Assumes a boolean column "is_featured" exists.
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Error loading featured blog posts:", error);
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">From Our Blog</h2>
          <p className="text-center">Error loading blog posts.</p>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">From Our Blog</h2>
          <p className="text-center">No featured posts available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">From Our Blog</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post: BlogPost) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              {post.featured_image ? (
                <div className="relative w-full h-48">
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
              ) : (
                <div className="relative w-full h-48 bg-gray-200 rounded-t-lg" />
              )}
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                <p className="text-sm mb-4">{post.excerpt}</p>
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
