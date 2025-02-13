// app/tags/[tag]/page.tsx
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";

interface PageProps {
  params: { tag: string };
}

interface TagPost {
  id: string;
  title: string;
  slug: string;
  published_at: string;
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = params;
  const supabase = await createClient();

  // Fetch posts that include the specified tag.
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, published_at")
    .contains("tags", [tag])
    .order("created_at", { ascending: false });

  if (error || !posts) {
    return <div>No posts found for tag: {tag}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">
        Posts tagged with &quot;{tag}&quot;
      </h1>
      <ul className="space-y-4">
        {(posts as TagPost[]).map((post: TagPost) => (
          <li key={post.id} className="border p-4 rounded-md">
            <Link href={`/blog/${post.slug}`} className="text-blue-500 hover:underline">
              {post.title}
            </Link>
            <p className="text-sm text-gray-500">
              Published on: {new Date(post.published_at).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
