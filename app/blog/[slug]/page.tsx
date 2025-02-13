// app/blog/[slug]/page.tsx
import { createClient } from "@/lib/supabase-server";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButtons from "@/components/ShareButtons";
import Head from "next/head";         // optional if you want to inject <title>, <meta>, or JSON-LD
import JsonLd from "@/components/JsonLd"; // optional if you want structured data

interface PageProps {
  params: { slug: string };   // plain object, NOT a promise
}

interface RecentPost {
  id: string;
  title: string;
  slug: string;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = params;

  const supabase = await createClient();

  // 1. Fetch the post by slug
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !post) {
    return <div>Post not found.</div>;
  }

  // 2. Fetch author data
  let author = null;
  if (post.author_id) {
    const { data: authorData, error: authorError } = await supabase
      .from("authors")
      .select("id, name, avatar_url")
      .eq("id", post.author_id)
      .single();
    if (!authorError) {
      author = authorData;
    }
  }

  // 3. Fetch recent posts by the same author
  let recentPosts: RecentPost[] = [];
  if (post.author_id) {
    const { data: postsData, error: postsError } = await supabase
      .from("blog_posts")
      .select("id, title, slug")
      .eq("author_id", post.author_id)
      .neq("id", post.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (!postsError && postsData) {
      recentPosts = postsData;
    }
  }

  // 4. Prepare breadcrumbs
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title },
  ];

  // 5. (Optional) Prepare JSON-LD structured data for SEO
  // Remove this entire block if you do NOT want JSON-LD
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.published_at
      ? new Date(post.published_at).toISOString().slice(0, 10)
      : undefined,
    author: author ? { "@type": "Person", name: author.name } : undefined,
    image: post.featured_image,
    description: post.meta_description || post.excerpt,
    url: `https://yourdomain.com/blog/${post.slug}`,
  };

  return (
    <>
      {/* If you still want to manage <title> or <meta> tags manually, do it here. */}
      <Head>
        {/* Optional: <title>{post.title} | My Site</title> */}
        <JsonLd data={jsonLdData} />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-8">
        {/* Featured Image */}
        {post.featured_image && (
          <div className="relative h-96 w-full mb-4">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}

        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Main layout: content on left, author+sharing+recent on right */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Article Content */}
          <article className="flex-1">
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            <div
              className="prose prose-sm leading-snug text-gray-700"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags as clickable links */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-4">
                <span className="font-bold mr-2">Tags:</span>
                {post.tags.map((tag: string, index: number) => (
                  <Link key={index} href={`/tags/${encodeURIComponent(tag)}`}>
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 mr-1 rounded text-sm cursor-pointer hover:bg-blue-200">
                      {tag}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 text-sm text-gray-500">
              Published on: {new Date(post.published_at).toLocaleDateString()}
            </div>
          </article>

          {/* Right Column: Author & Sharing & Recent Posts */}
          <aside className="w-full md:w-1/3 space-y-8">
            {/* Author Info */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-2">About the Author</h2>
              {author ? (
                <div className="flex items-center space-x-4">
                  {author.avatar_url && (
                    <div className="relative w-16 h-16">
                      <Image
                        src={author.avatar_url}
                        alt={author.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{author.name}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Author information not available.
                </p>
              )}
            </div>

            {/* Social Sharing */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Share This Article</h2>
              <ShareButtons
                url={`https://yourdomain.com/blog/${post.slug}`}
                title={post.title}
              />
            </div>

            {/* Recent Posts by This Author */}
            {recentPosts.length > 0 && (
              <div className="p-4 border rounded-lg">
                <h2 className="text-xl font-semibold mb-2">
                  Recent Posts by {author ? author.name : "Author"}
                </h2>
                <ul className="space-y-2">
                  {recentPosts.map((recentPost) => (
                    <li key={recentPost.id}>
                      <Link
                        href={`/blog/${recentPost.slug}`}
                        className="text-blue-500 hover:underline"
                      >
                        {recentPost.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
