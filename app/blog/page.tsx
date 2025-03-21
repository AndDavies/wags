import { createClient } from "@/lib/supabase-server"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar } from "lucide-react"
import { format } from "date-fns"
import { BlogSubscribeForm } from "@/components/BlogSubscribeForm"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  published_at: string | null
  featured_image?: string | null
  tags?: string[] | null
  is_featured?: boolean | null
}

export default async function BlogIndexPage() {
  try {
    const supabase = await createClient()
    //console.log("Supabase client initialized:", !!supabase); // Debug client

    const [
      { data: featuredPosts, error: featuredError },
      { data: regularPosts, error: regularError },
      { data: allTags, error: tagsError },
    ] = await Promise.all([
      supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, published_at, featured_image, tags, is_featured")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(1),
      supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, published_at, featured_image, tags, is_featured")
        .order("published_at", { ascending: false })
        .limit(9),
      supabase.from("blog_posts").select("tags"),
    ])

    if (featuredError || regularError || tagsError) {
      const errorDetails = {
        featured: featuredError
          ? { message: featuredError.message, details: featuredError.details, hint: featuredError.hint }
          : null,
        regular: regularError
          ? { message: regularError.message, details: regularError.details, hint: regularError.hint }
          : null,
        tags: tagsError ? { message: tagsError.message, details: tagsError.details, hint: tagsError.hint } : null,
      }
      console.error("Error fetching posts:", errorDetails)
      return <div>Error loading blog posts. Check server logs for details.</div>
    }

    // console.log("Featured posts:", featuredPosts); // Debug data
    // console.log("Regular posts:", regularPosts);
    // console.log("All tags:", allTags);

    const featuredPost = featuredPosts && featuredPosts.length > 0 ? featuredPosts[0] : null
    const posts = regularPosts || []
    const uniqueTags = Array.from(
      new Set(allTags?.filter((post) => post.tags && post.tags.length > 0).flatMap((post) => post.tags) || []),
    ).slice(0, 8)

    return (
      <div className="min-h-screen bg-gradient-to-t from-brand-pink/20 to-white pt-24">
        <div className="container mx-auto px-4">
          {/* Hero Section - Styled like Directory */}
          <div className="relative mb-12 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#93dcec]/10 to-[#FFA9DE]/10 z-0"></div>
            <div className="relative z-10 p-8 md:p-10">
              <div className="max-w-3xl mx-auto text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-[#249ab4] mb-4">Wags & Wanders Blog</h1>
                <p className="text-lg text-[#493f40] mb-6">
                  Expert advice, travel stories, and essential tips for traveling the world with your furry companions.
                </p>
                <div className="h-1 w-20 bg-[#FFA9DE] mx-auto mb-6"></div>
                <div className="flex flex-wrap justify-center gap-3">
                  {uniqueTags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${tag}`}
                      className="bg-white hover:bg-brand-pink/20 text-[#249ab4] px-4 py-2 rounded-full text-sm font-medium transition-colors border border-gray-200"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Post Section */}
          {featuredPost && (
            <section className="mb-16">
              <div className="flex items-center gap-2 mb-8">
                <div className="h-1 w-6 bg-[#249ab4] rounded-full"></div>
                <h2 className="text-2xl font-bold text-[#249ab4] mb-0">Featured Article</h2>
              </div>

              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                  <div className="lg:col-span-3 relative">
                    <div className="relative h-64 md:h-96 lg:h-full">
                      <Image
                        src={featuredPost.featured_image || "/placeholder.svg"}
                        alt={featuredPost.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent lg:hidden"></div>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-[#249ab4] text-white">Featured</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2 p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 text-sm text-[#493f40]/70 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {featuredPost.published_at
                            ? format(new Date(featuredPost.published_at), "MMM d, yyyy")
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-[#249ab4] mb-4">{featuredPost.title}</h3>
                    <p className="text-[#493f40] mb-6">{featuredPost.excerpt || "No excerpt available"}</p>
                    <div className="mt-auto">
                      <Button asChild className="bg-[#249ab4] hover:bg-[#FFA9DE] text-white hover:text-[#493f40]">
                        <Link href={`/blog/${featuredPost.slug}`} className="flex items-center gap-2">
                          Read Article
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Latest Posts Grid */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="h-1 w-6 bg-[#249ab4] rounded-full"></div>
                <h2 className="text-2xl font-bold text-[#249ab4] mb-0">Latest Articles</h2>
              </div>
              <Link
                href="/blog/"
                className="text-[#249ab4] hover:text-[#FFA9DE] text-sm font-medium flex items-center gap-1"
              >
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: BlogPost) => (
                <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 h-full flex flex-col bg-white"
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
                          <Badge className="bg-white/80 backdrop-blur-sm text-[#249ab4]">{post.tags[0]}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                  <CardContent className="p-6 flex-grow">
                    <div className="flex items-center gap-4 text-xs text-[#493f40]/70 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "N/A"}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-[#249ab4] line-clamp-2">{post.title}</h3>
                    <p className="text-[#493f40]/80 text-sm line-clamp-3 mb-4">
                      {post.excerpt || "No excerpt available"}
                    </p>
                  </CardContent>
                  <CardFooter className="px-6 pb-6 pt-0">
                    <Button
                      asChild
                      variant="outline"
                      className="text-[#249ab4] border-[#249ab4] hover:bg-[#FFA9DE]/10 hover:text-[#249ab4] w-full"
                    >
                      <Link href={`/blog/${post.slug}`}>Read More</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          {/* Keep the BlogSubscribeForm component */}
          <BlogSubscribeForm />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Unexpected error in BlogIndexPage:", error instanceof Error ? error.message : error)
    return <div>Unexpected error loading blog posts. Check server logs.</div>
  }
}

