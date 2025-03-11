// app/blog/tag/[tag]/page.tsx
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Mail } from "lucide-react";
import { format } from "date-fns";
import { notFound } from "next/navigation";

// BlogPost interface (matches schema)
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
  featured_image?: string | null;
  tags?: string[] | null;
  is_featured?: boolean | null;
}

interface TagPageProps {
  params: Promise<{ tag: string }>; // Next.js 15 async params
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params; // Await dynamic param
  const supabase = await createClient();

  // Fetch posts with the specified tag
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, published_at, featured_image, tags, is_featured")
    .contains("tags", [tag]) // Filter posts where tags array contains the tag
    .order("published_at", { ascending: false });

  // Fetch all unique tags for the hero section
  const { data: allTags, error: tagsError } = await supabase.from("blog_posts").select("tags");

  if (error || tagsError) {
    console.error("Error fetching posts for tag:", { tagError: error?.message, tagsError: tagsError?.message });
    return <div>Error loading posts for tag: {tag}. Check server logs.</div>;
  }

  if (!posts || posts.length === 0) {
    notFound(); // Return 404 if no posts found for the tag
  }

  const uniqueTags = Array.from(
    new Set(allTags?.filter((post) => post.tags && post.tags.length > 0).flatMap((post) => post.tags) || [])
  ).slice(0, 8);

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-brand-teal/10 to-brand-pink/10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-brand-teal mb-6">
              Posts Tagged: #{tag}
            </h1>
            <p className="text-lg text-offblack mb-8 max-w-2xl mx-auto">
              Explore all articles related to {tag} for your pet travel adventures.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {uniqueTags.map((t) => (
                <Link
                  key={t}
                  href={`/blog/tag/${t}`}
                  className={`bg-white hover:bg-brand-pink/20 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    t === tag ? "text-brand-pink font-bold" : "text-brand-teal"
                  }`}
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="h-1 w-6 bg-brand-teal rounded-full"></div>
              <h2 className="text-xl font-semibold text-brand-teal">Articles</h2>
            </div>
            <Link
              href="/blog"
              className="text-brand-teal hover:text-brand-pink text-sm font-medium flex items-center gap-1"
            >
              Back to Blog
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: BlogPost) => (
              <Card
                key={post.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 border-none h-full flex flex-col"
              >
                {post.featured_image && (
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={post.featured_image || "/placeholder.svg"}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                    {post.tags && post.tags.length > 0 && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/80 backdrop-blur-sm text-brand-teal">{post.tags[0]}</Badge>
                      </div>
                    )}
                  </div>
                )}
                <CardContent className="p-6 flex-grow">
                  <div className="flex items-center gap-4 text-xs text-offblack/70 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "N/A"}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-brand-teal line-clamp-2">{post.title}</h3>
                  <p className="text-offblack/80 text-sm line-clamp-3 mb-4">{post.excerpt || "No excerpt available"}</p>
                </CardContent>
                <CardFooter className="px-6 pb-6 pt-0">
                  <Button
                    asChild
                    variant="outline"
                    className="text-brand-teal border-brand-teal hover:bg-brand-pink/10 hover:text-brand-teal w-full"
                  >
                    <Link href={`/blog/${post.slug}`}>Read More</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-brand-teal/10 to-brand-pink/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-2 relative h-48 md:h-auto">
                <Image src="/placeholders/newsletter_pet.jpg" alt="Dog with travel bag" fill className="object-cover" />
              </div>
              <div className="p-6 md:p-8 md:col-span-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-brand-pink/20 p-2 rounded-full">
                    <Mail className="h-5 w-5 text-brand-teal" />
                  </div>
                  <h3 className="text-xl font-semibold text-brand-teal">Subscribe to Our Blog</h3>
                </div>
                <p className="text-offblack mb-6">
                  Get the latest pet travel tips, stories, and guides delivered straight to your inbox.
                </p>
                <form className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-teal"
                      required
                    />
                    <Button type="submit" className="bg-brand-teal text-white hover:bg-brand-pink">
                      Subscribe
                    </Button>
                  </div>
                  <p className="text-xs text-offblack/60">We respect your privacy. Unsubscribe at any time.</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}