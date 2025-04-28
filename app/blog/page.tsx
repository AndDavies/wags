import { createClient } from "@/lib/supabase-server"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, TrendingUp, Bookmark } from "lucide-react"
import { format } from "date-fns"
import { BlogSubscribeForm } from "@/components/BlogSubscribeForm"

/**
 * Blog Index Page Component
 * 
 * Displays the main landing page for the blog with featured post,
 * latest articles, and popular tags.
 * 
 * @returns {JSX.Element} The rendered blog index page
 */
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

    const featuredPost = featuredPosts && featuredPosts.length > 0 ? featuredPosts[0] : null
    const posts = regularPosts || []
    const uniqueTags = Array.from(
      new Set(allTags?.filter((post) => post.tags && post.tags.length > 0).flatMap((post) => post.tags) || []),
    ).slice(0, 8)

    // Split posts for layout variation
    const mainPosts = posts.slice(0, 3)
    const secondaryPosts = posts.slice(3, 6)
    const tertiaryPosts = posts.slice(6)

    return (
      <div className="min-h-screen bg-white pt-20">
        {/* Hero Banner - Full-width Featured Image */}
        <div className="relative w-full h-[60vh] min-h-[400px] mb-16">
          {featuredPost && (
            <>
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={featuredPost.featured_image || "/placeholder.svg"}
                  alt="Blog Hero"
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
              </div>
              <div className="container mx-auto px-4 h-full flex flex-col justify-end pb-16 relative z-10">
                <div className="max-w-3xl">

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
                    {featuredPost.title}
                  </h1>
                  <p className="text-lg text-white/80 mb-6 max-w-2xl">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-6">
                    <Button asChild size="lg" className="bg-white text-[#249ab4] hover:bg-[#FFA9DE]/90 hover:text-white">
                      <Link href={`/blog/${featuredPost.slug}`} className="flex items-center gap-2">
                        Read Article
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {featuredPost.published_at
                          ? format(new Date(featuredPost.published_at), "MMM d, yyyy")
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="container mx-auto px-4">
          {/* Topics/Tags Filter Bar */}
          <div className="mb-16 overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-1.5 w-10 bg-[#249ab4] rounded-full"></div>
              <h2 className="text-2xl font-bold text-[#249ab4]">Explore Topics</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
              <Link
                href="/blog"
                className="bg-[#249ab4] text-white px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap"
              >
                All Posts
              </Link>
              {uniqueTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${tag}`}
                  className="bg-white hover:bg-[#249ab4] hover:text-white text-[#249ab4] px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border border-[#249ab4]/20"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Main Posts Section - Feature Layout */}
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-[#249ab4]" />
                <h2 className="text-2xl font-bold text-[#493f40]">Trending Now</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {mainPosts.length > 0 && (
                <div className="lg:col-span-7 space-y-8">
                  {/* Large Featured Post */}
                  <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white">
                    <div className="relative h-80 overflow-hidden">
                      <Image
                        src={mainPosts[0]?.featured_image || "/placeholder.svg"}
                        alt={mainPosts[0]?.title || "Featured post"}
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                      {mainPosts[0]?.tags && mainPosts[0].tags.length > 0 && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/90 backdrop-blur-sm text-[#249ab4] px-3 py-1.5 font-medium">
                            {mainPosts[0].tags[0]}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6 flex-grow">
                      <div className="flex items-center justify-between text-sm text-[#493f40]/70 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {mainPosts[0]?.published_at 
                              ? format(new Date(mainPosts[0].published_at), "MMM d, yyyy") 
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[#FFA9DE]">
                          <Bookmark className="h-4 w-4" />
                          <span>Editor's Pick</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-3 text-[#493f40]">{mainPosts[0]?.title}</h3>
                      <p className="text-[#493f40]/80 mb-4">
                        {mainPosts[0]?.excerpt || "No excerpt available"}
                      </p>
                    </CardContent>
                    <CardFooter className="px-6 pb-6 pt-0">
                      <Button
                        asChild
                        className="bg-[#249ab4] hover:bg-[#FFA9DE] text-white hover:text-[#493f40] w-full"
                      >
                        <Link href={`/blog/${mainPosts[0]?.slug}`}>Read Article</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {mainPosts.length > 1 && (
                <div className="lg:col-span-5 space-y-8">
                  {/* Medium Posts - Vertical Stack */}
                  {mainPosts.slice(1, 3).map((post) => (
                    <Card
                      key={post.id}
                      className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col bg-white"
                    >
                      <div className="grid grid-cols-5 gap-0">
                        <div className="col-span-2">
                          <div className="relative h-full w-full min-h-[140px]">
                            <Image
                              src={post.featured_image || "/placeholder.svg"}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="col-span-3 p-5">
                          {post.tags && post.tags.length > 0 && (
                            <Badge className="bg-[#FFA9DE]/10 text-[#249ab4] mb-3">{post.tags[0]}</Badge>
                          )}
                          <h3 className="text-lg font-bold mb-2 text-[#493f40] line-clamp-2">{post.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-[#493f40]/70 mt-2">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "N/A"}
                            </span>
                          </div>
                          <Link 
                            href={`/blog/${post.slug}`} 
                            className="mt-3 inline-flex items-center text-[#249ab4] text-sm font-medium hover:text-[#FFA9DE]"
                          >
                            Read More <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Secondary Posts - Alternating Layout */}
          {secondaryPosts.length > 0 && (
            <section className="mb-20 border-t border-b border-gray-100 py-16">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-1.5 w-10 bg-[#FFA9DE] rounded-full"></div>
                <h2 className="text-2xl font-bold text-[#493f40]">Latest Stories</h2>
              </div>

              <div className="space-y-12">
                {secondaryPosts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${
                      index % 2 !== 0 ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`${index % 2 !== 0 ? 'md:order-2' : ''}`}>
                      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
                        <Image
                          src={post.featured_image || "/placeholder.svg"}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-700 hover:scale-105"
                        />
                      </div>
                    </div>
                    <div className={`${index % 2 !== 0 ? 'md:order-1' : ''}`}>
                      <div className="flex gap-2 mb-3">
                        {post.tags && post.tags.map((tag: string, idx: number) => (
                          <Link 
                            key={`${tag}-${idx}`} 
                            href={`/blog/tag/${tag}`}
                            className="bg-[#249ab4]/10 text-[#249ab4] px-3 py-1 rounded-full text-xs font-medium"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-4 text-[#493f40]">{post.title}</h3>
                      <p className="text-[#493f40]/80 mb-6">{post.excerpt || "No excerpt available"}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-[#493f40]/70">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "N/A"}
                          </span>
                        </div>
                        <Button
                          asChild
                          variant="outline"
                          className="border-[#249ab4] text-[#249ab4] hover:bg-[#249ab4] hover:text-white"
                        >
                          <Link href={`/blog/${post.slug}`} className="flex items-center gap-1">
                            Read Article
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tertiary Posts - Compact Grid */}
          {tertiaryPosts.length > 0 && (
            <section className="mb-20">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-10 bg-[#249ab4] rounded-full"></div>
                  <h2 className="text-2xl font-bold text-[#493f40]">More To Explore</h2>
                </div>
                <Link
                  href="/blog/"
                  className="text-[#249ab4] hover:text-[#FFA9DE] text-sm font-medium flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tertiaryPosts.map((post) => (
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
                      <h3 className="text-xl font-bold mb-3 text-[#493f40] line-clamp-2">{post.title}</h3>
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
          )}

          {/* Newsletter Subscription - Unchanged */}
          <BlogSubscribeForm />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Unexpected error in BlogIndexPage:", error instanceof Error ? error.message : error)
    return <div>Unexpected error loading blog posts. Check server logs.</div>
  }
}

