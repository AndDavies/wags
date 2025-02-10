// app/blog/page.tsx
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';

export default async function BlogIndexPage() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, published_at, featured_image')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return <div>Error loading blog posts.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-center">Our Blog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts?.map((post: any) => (
          <div key={post.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
            {post.featured_image && (
              <div className="relative h-48">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div className="p-4">
              <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
              <p className="text-sm mb-4">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="text-primary font-medium hover:underline">
                Read More &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
