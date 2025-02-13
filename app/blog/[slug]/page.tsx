// app/blog/[slug]/page.tsx
import { createClient } from '@/lib/supabase-server';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  // Await the params before destructuring
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !post) {
    return <div>Post not found.</div>;
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-16">
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
      {/* Wrap the content in a container with typography classes */}
      <div
        className="prose prose-lg text-gray-700"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      <div className="mt-8 text-sm text-gray-500">
        Published on: {new Date(post.published_at).toLocaleDateString()}
      </div>
    </article>
  );
}
