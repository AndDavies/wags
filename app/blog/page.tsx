// app/blog/page.tsx
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';


// Define an interface to type the blog post data.
interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string; // You might later convert this to Date if needed.
  featured_image?: string;
}

export default async function BlogIndexPage() {
  const supabase = await createClient();
  // Fetch the blog posts with the selected columns.
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
        {posts?.map((post: BlogPost) => (
          <div
            key={post.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
          >
            {post.featured_image && (
              <div className="relative h-48">
                {/* Option 1: Replace <img> with Next.js <Image>
                    Uncomment the following code and remove the <img> block
                    if you want to use optimized images.
                
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  className="object-cover w-full h-full"
                />
                */}
                {/* Option 2: Use <img> but disable the Next.js rule */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
              <Link
                href={`/blog/${post.slug}`}
                className="text-primary font-medium hover:underline"
              >
                Read More &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
