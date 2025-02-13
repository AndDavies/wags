import { createClient } from '@/lib/supabase-server';
import Image from 'next/image';
import Link from 'next/link';
import ShareButtons from '@/components/ShareButtons';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface RecentPost {
  id: string;
  title: string;
  slug: string;
}

export default async function BlogPostPage({ params }: PageProps) {
  // Await params before using its properties
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const supabase = await createClient();

  // Fetch the post by slug
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !post) {
    return <div>Post not found.</div>;
  }

  // Fetch author data (assuming an "authors" table exists)
  let author = null;
  if (post.author_id) {
    const { data: authorData, error: authorError } = await supabase
      .from('authors')
      .select('id, name, avatar_url')
      .eq('id', post.author_id)
      .single();
    if (!authorError) {
      author = authorData;
    }
  }

  // Fetch 8 recent posts by the same author
  let recentPosts: RecentPost[] = [];
  if (post.author_id) {
    const { data: postsData, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, slug')
      .eq('author_id', post.author_id)
      .neq('id', post.id)
      .order('created_at', { ascending: false })
      .limit(8);
    if (!postsError && postsData) {
      recentPosts = postsData;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col md:flex-row gap-8">
      {/* Main Content Column */}
      <article className="flex-1">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        {post.featured_image && (
          <div className="relative h-64 mb-8">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}
        {/* Render article content with refined typography */}
        <div
          className="prose prose-sm leading-snug text-gray-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Display Tags if available */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4">
            <span className="font-bold mr-2">Tags:</span>
            {post.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-block bg-blue-100 text-blue-800 px-2 py-1 mr-1 rounded text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          Published on: {new Date(post.published_at).toLocaleDateString()}
        </div>
      </article>

      {/* Sidebar Column */}
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
            <p className="text-sm text-gray-500">Author information not available.</p>
          )}
          <div className="mt-4 text-sm text-gray-500">
            <p>{new Date(post.published_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Social Sharing */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Share This Article</h2>
          <ShareButtons url={`https://wagsandwanders.com/blog/${post.slug}`} title={post.title} />
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
                  <Link href={`/blog/${recentPost.slug}`} className="text-blue-500 hover:underline">
                    {recentPost.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
