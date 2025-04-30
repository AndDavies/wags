import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase-server"
import { Card } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  published_at: string
  featured_image?: string
}

export default async function FeaturedBlog() {
  const supabase = await createClient()
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, published_at, featured_image")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(3)

  if (error) {
    console.error("Error loading featured blog posts:", error)
    return <section className="py-10 bg-white font-sans tracking-tight shadow-md"><div className="container mx-auto px-4 text-center text-red-700">Error loading blog posts.</div></section>
  }

  if (!posts || posts.length === 0) {
    return <section className="py-10 bg-white font-sans tracking-tight shadow-md"><div className="container mx-auto px-4 text-center text-gray-700">No featured posts available at the moment.</div></section>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <section className="py-10 md:py-16 bg-white font-sans tracking-tight shadow-md">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-12 text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-teal-500 mb-4">Insights for Pet Travelers</h2>
          <p className="text-gray-700 text-lg">Expert advice and stories from our community of pet-loving travelers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post: BlogPost) => (
            <Card
              key={post.id}
              className="overflow-hidden bg-white border border-teal-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              {post.featured_image && (
                <div className="relative h-40 w-full">
                  <Image
                    src={post.featured_image || "/placeholder.svg"}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4 flex flex-col flex-grow">
                <div className="text-sm text-gray-500 mb-2">{formatDate(post.published_at)}</div>
                <h3 className="text-xl font-semibold text-black mb-2 line-clamp-2 flex-grow">{post.title}</h3>
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center text-teal-500 hover:text-teal-600 font-medium text-sm mt-auto"
                  aria-label={`Read article: ${post.title}`}
                >
                  Read Article
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-teal-500 hover:bg-teal-600 shadow hover:shadow-md transition-colors duration-200"
            aria-label="View all blog articles"
          >
            View All Articles
          </Link>
        </div>
      </div>
    </section>
  )
}
