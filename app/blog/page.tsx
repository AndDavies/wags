import { createClient } from "@/lib/supabase-server"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Define an interface to type the blog post data.
interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  published_at: string
  featured_image?: string
}

export default async function BlogIndexPage() {
  const supabase = await createClient()
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, published_at, featured_image")
    .order("published_at", { ascending: false })

  if (error) {
    console.error("Error fetching posts:", error)
    return <div>Error loading blog posts.</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-5xl md:text-6xl font-display text-brand-teal text-center mb-12">Our Blog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts?.map((post: BlogPost) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
            {post.featured_image && (
              <div className="relative h-64">
                <Image src={post.featured_image || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
              </div>
            )}
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-3 text-brand-teal">{post.title}</h2>
              <p className="text-offblack mb-4">{post.excerpt}</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="link" className="text-brand-teal hover:text-brand-pink">
                <Link href={`/blog/${post.slug}`}>Read More &rarr;</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

