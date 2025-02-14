import { createClient } from "@/lib/supabase-server"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ShareButtons from "@/components/ShareButtons"
import Breadcrumbs from "@/components/Breadcrumbs"

interface PageProps {
  params: { slug: string }
}

interface RecentPost {
  id: string
  title: string
  slug: string
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).single()

  if (error || !post) {
    notFound()
  }

  let author = null
  if (post.author_id) {
    const { data: authorData } = await supabase
      .from("authors")
      .select("id, name, avatar_url, bio")
      .eq("id", post.author_id)
      .single()
    author = authorData
  }

  const { data: recentPosts = [] } = await supabase
    .from("blog_posts")
    .select("id, title, slug")
    .eq("author_id", post.author_id)
    .neq("id", post.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]

  return (
    <div className="min-h-screen bg-background">
      {post.featured_image && (
        <div className="relative w-full h-[40vh] md:h-[50vh] lg:h-[60vh]">
          <Image
            src={post.featured_image || "/placeholder.svg"}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center max-w-4xl px-4">
              {post.title}
            </h1>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbs} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <article className="lg:col-span-2 space-y-8">
            {!post.featured_image && <h1 className="text-4xl font-bold">{post.title}</h1>}
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </article>

          <aside className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>About the Author</CardTitle>
              </CardHeader>
              <CardContent>
                {author ? (
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={author.avatar_url} alt={author.name} />
                      <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{author.name}</p>
                      <p className="text-sm text-muted-foreground">{author.bio}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Author information not available.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Share This Article</CardTitle>
              </CardHeader>
              <CardContent>
                <ShareButtons url={`https://wagsandwanders.com/blog/${post.slug}`} title={post.title} />
              </CardContent>
            </Card>

            {(recentPosts || []).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Posts by {author?.name || "Author"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                  {(recentPosts || []).map((recentPost: RecentPost) => (
                      <li key={recentPost.id}>
                        <Link href={`/blog/${recentPost.slug}`} className="text-primary hover:underline">
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

        <div className="mt-12 flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/blog" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
          <Button asChild>
            <Link href="#" className="flex items-center">
              Next Article
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="bg-muted mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Published on: {format(new Date(post.published_at), "MMMM d, yyyy")}</p>
          <p className="mt-2">&copy; 2023 Wags Travel Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

