// app/blog/[slug]/page.tsx
import { createClient } from "@/lib/supabase-server";
import Image from "next/image";
import Link from "next/link";
import ShareButtons from "@/components/ShareButtons";
import Breadcrumbs from "@/components/Breadcrumbs";

// Define types for recent posts.
interface RecentPost {
  id: string;
  title: string;
  slug: string;
}

// Next.js App Router supports dynamic metadata.
// This function generates metadata for SEO, including the meta description.
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_description")
    .eq("slug", params.slug)
    .single();

  return {
    title: post?.title || "Blog Post",
    description: post?.meta_description || "Read our latest blog post.",
    openGraph: {
      title: post?.title || "Blog Post",
      description: post?.meta_description || "Read our latest blog post.",
      url: `https://wagsandwanders.com/blog/${params.slug}`,
    },
  };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  // Await params before using its properties.
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const supabase = await createClient();

  // Fetch the post by slug.
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !post) {
    return <div>Post not found.</div>;
  }

  // Fetch author data (assuming an "authors" table exists).
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

  // Fetch 8 recent posts by the same author.
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

  // Breadcrumbs: Home / Blog / [Post Title]
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-8">
      {/* Featured Image spanning the top */}
      {post.featured_image && (
        <div className="relative h-96 w-full mb-8">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover rounded-lg"
          />
        </div>
      )}

      {/* Blog Content */}
      <article className="prose prose-sm leading-snug text-gray-700">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
        {/* Display Tags as clickable links */}
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

      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbs} />

      {/* Author and Sharing Details */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        {/* Author Info */}
        <div className="flex items-center space-x-4">
          {author && author.avatar_url && (
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
            <p className="font-bold">{author ? author.name : "Unknown Author"}</p>
          </div>
        </div>
        {/* Social Sharing */}
        <div>
          <ShareButtons
            url={`https://wagsandwanders.com/blog/${post.slug}`}
            title={post.title}
          />
        </div>
      </div>

      {/* (Optional) Recent Posts by Author */}
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
    </div>
  );
}
