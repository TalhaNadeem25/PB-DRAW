import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { blogAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { PencilSimple, Plus, BookOpen, Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const BLOG_ADMIN_EMAILS = ["nadeemtalha24@gmail.com"];

function isBlogAdmin(user: any) {
  return user?.role === "admin" || BLOG_ADMIN_EMAILS.includes(user?.email);
}

export default function Blog() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["blog", page],
    queryFn: () => blogAPI.getAll({ page, limit: 9 }),
  });

  const { data: draftsData } = useQuery({
    queryKey: ["blog-drafts"],
    queryFn: () => blogAPI.getDrafts(),
    enabled: isBlogAdmin(user),
  });

  const posts = data?.data ?? [];
  const allPosts = isBlogAdmin(user) ? (draftsData?.data ?? posts) : posts;
  const totalPages = data?.pages ?? 1;

  return (
    <Layout>
      <Helmet>
        <title>Pickleball Blog – Tips, News & Strategy | PB Draw</title>
        <meta name="description" content="Expert pickleball tips, tournament news, strategy guides, and community updates from PB Draw." />
        <meta property="og:title" content="Pickleball Blog – PB Draw" />
        <meta property="og:description" content="Expert pickleball tips, tournament news, and strategy guides." />
        <link rel="canonical" href="https://www.pbdraw.com/blog" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tight text-foreground">
              Blog
            </h1>
            <p className="text-muted-foreground mt-2">
              Pickleball tips, news, and strategy — straight from the court.
            </p>
          </div>
          {isBlogAdmin(user) && (
            <Button asChild className="gap-2 font-display font-bold uppercase tracking-wide text-xs">
              <Link to="/blog/new">
                <Plus className="w-4 h-4" />
                New Post
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl border border-border/50 p-5 space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : allPosts.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-display font-bold uppercase tracking-wide">No posts yet</p>
            <p className="text-sm mt-1">Check back soon for pickleball content.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allPosts.map((post: any) => (
              <Link
                key={post._id}
                to={`/blog/${post.slug}`}
                className="glass-card rounded-2xl border border-border/50 p-5 flex flex-col gap-3 hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags?.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-[10px] font-display uppercase tracking-widest px-2">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {post.status === "draft" && (
                    <Badge variant="outline" className="text-[10px] font-display uppercase tracking-widest bg-amber-500/10 text-amber-600 border-amber-500/30">
                      Draft
                    </Badge>
                  )}
                </div>

                <h2 className="font-display font-black text-lg uppercase tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2 border-t border-border/30">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.publishedAt
                      ? format(new Date(post.publishedAt), "MMM d, yyyy")
                      : format(new Date(post.updatedAt), "MMM d, yyyy")}
                  </span>
                  {post.author?.name && (
                    <span className="truncate">by {post.author.name}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-10">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="flex items-center text-sm text-muted-foreground px-3">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
