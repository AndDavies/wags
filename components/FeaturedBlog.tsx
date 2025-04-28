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
    return <div>Error loading blog posts.</div>
  }

  if (!posts || posts.length === 0) {
    return <div>No featured posts available.</div>
  }

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <section className="py-10 bg-gradient-to-r from-[#93dcec]/10 to-[#FFA9DE]/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl font-bold text-[#30B8C4] mb-4">Insights for Pet Travelers</h2>
          <p className="text-gray-600 text-lg">Expert advice and stories from our community of pet-loving travelers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post: BlogPost) => (
            <Card
              key={post.id}
              className="overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {post.featured_image && (
                <div className="relative h-56 w-full">
                  <Image
                    src={post.featured_image || "/placeholder.svg"}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">{formatDate(post.published_at)}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">{post.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center text-[#30B8C4] hover:text-[#FFA9DE] font-medium"
                >
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#30B8C4] hover:bg-[#FFA9DE] shadow-sm transition-colors duration-200"
          >
            View All Articles
          </Link>
        </div>
      </div>
    </section>
  )
}
