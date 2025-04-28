// app/blog/[slug]/page.tsx
import { createClient } from "@/lib/supabase-server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ShareButtons from "@/components/ShareButtons";
import Breadcrumbs from "@/components/Breadcrumbs";
import { BlogSubscribeForm } from "@/components/BlogSubscribeForm";

type BlogParams = Promise<{ slug: string }>;

interface PageProps {
  params: BlogParams;
}

interface RecentPost {
  id: string;
  title: string;
  slug: string;
}

// Generate dynamic metadata for the blog post
export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("title, description, tags, featured_image, meta_description")
    .eq("slug", slug)
    .single();

  if (error || !post) {
    return {
      title: "Blog Post Not Found | Wags & Wanders",
      description: "The blog post you are looking for does not exist.",
    };
  }

  // Use meta_description if available, otherwise fall back to description or default
  const description = post.meta_description || post.description || "Read the latest pet travel insights from Wags & Wanderssssss.";

  return {
    title: `${post.title} | Wags & Wanders`,
    description: description,
    keywords: post.tags ? [...post.tags, "pet travel", "Wags & Wanders"] : ["pet travel", "Wags & Wanders"],
    openGraph: {
      title: `${post.title} | Wags & Wanders`,
      description: description,
      url: `https://www.wagsandwanders.com/blog/${slug}`,
      siteName: "Wags & Wanders",
      images: [
        {
          url: post.featured_image || "/images/og-image.jpg",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: "en_US",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | Wags & Wanders`,
      description: description,
      images: [post.featured_image || "/images/og-image.jpg"],
      creator: "@WagsAndWanders",
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const supabase = await createClient();

  const { data: post, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).single();

  if (error || !post) {
    notFound();
  }

  let author = null;
  if (post.author_id) {
    const { data: authorData } = await supabase
      .from("authors")
      .select("id, name, avatar_url, bio")
      .eq("id", post.author_id)
      .single();
    author = authorData;
  }

  const { data: recentPosts = [] } = await supabase
    .from("blog_posts")
    .select("id, title, slug")
    .eq("author_id", post.author_id)
    .neq("id", post.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }];

  return (
    <div className="min-h-screen bg-offwhite pt-20">
      {post.featured_image && (
        <div className="relative w-full h-[40vh] md:h-[50vh] lg:h-[60vh]">
          <Image
            src={post.featured_image || "/placeholder.svg"}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-white text-center max-w-4xl px-4">
              {post.title}
            </h1>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-12">
        <Breadcrumbs items={breadcrumbs} />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <article className="lg:col-span-2 space-y-8">
            {!post.featured_image && <h1 className="text-4xl font-display text-brand-teal">{post.title}</h1>}
            <div
              className="prose prose-lg max-w-none text-offblack"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="bg-brand-pink text-offblack">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </article>

          <aside className="space-y-8">
            <Card className="bg-white border-brand-pink">
              <CardHeader>
                <CardTitle className="text-brand-teal">About the Author</CardTitle>
              </CardHeader>
              <CardContent>
                {author ? (
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={author.avatar_url} alt={author.name} />
                      <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-brand-teal">{author.name}</p>
                      <p className="text-sm text-offblack">{author.bio}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-offblack">Author information not available.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-brand-pink">
              <CardHeader>
                <CardTitle className="text-brand-teal">Share This Article</CardTitle>
              </CardHeader>
              <CardContent>
                <ShareButtons url={`https://wagsandwanders.com/blog/${post.slug}`} title={post.title} />
              </CardContent>
            </Card>

            {(recentPosts || []).length > 0 && (
              <Card className="bg-white border-brand-pink">
                <CardHeader>
                  <CardTitle className="text-brand-teal">Recent Posts by {author?.name || "Author"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(recentPosts || []).map((recentPost: RecentPost) => (
                      <li key={recentPost.id}>
                        <Link
                          href={`/blog/${recentPost.slug}`}
                          className="text-brand-teal hover:text-brand-pink transition-colors"
                        >
                          {recentPost.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
        <BlogSubscribeForm />
        <div className="mt-12 flex justify-between">
          <Button
            variant="outline"
            asChild
            className="border-brand-teal text-brand-teal hover:bg-brand-pink hover:text-offblack"
          >
            <Link href="/blog" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
          <Button asChild className="bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack">
            <Link href="#" className="flex items-center">
              Next Article
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="bg-brand-pink mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-offblack">
          <p>Published on: {format(new Date(post.published_at), "MMMM d, yyyy")}</p>
          <p className="mt-2">© 2025 Wags & Wanders. All rights reserved.</p> {/* Updated branding and year */}
        </div>
      </footer>
    </div>
  );
}