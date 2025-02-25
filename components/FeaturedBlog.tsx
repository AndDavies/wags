import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    return <div>Error loading blog posts.</div>;
  }

  if (!posts || posts.length === 0) {
    return <div>No featured posts available.</div>;
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-display text-brand-teal text-center mb-12">
          From Our Blog
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post: BlogPost) => (
            <Card key={post.id} className="overflow-hidden bg-brand-pink">
              {post.featured_image && (
                <div className="relative h-48">
                  <Image
                    src={post.featured_image || "/placeholder.svg"}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl text-brand-teal">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-offblack">{post.excerpt}</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="link" className="text-brand-teal hover:text-brand-pink">
                  <Link href={`/blog/${post.slug}`}>Read More</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
