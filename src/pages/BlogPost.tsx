import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { blogAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowLeft, PencilSimple, Trash, Clock, User } from "@phosphor-icons/react";

const BLOG_ADMIN_EMAILS = ["nadeemtalha24@gmail.com"];
function isBlogAdmin(user: any) {
  return user?.role === "admin" || BLOG_ADMIN_EMAILS.includes(user?.email);
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isAdmin = isBlogAdmin(user);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["blog-post", slug, isAdmin],
    queryFn: () => isAdmin ? blogAPI.getBySlugAdmin(slug!) : blogAPI.getBySlug(slug!),
    enabled: !!slug,
  });

  const deleteMutation = useMutation({
    mutationFn: () => blogAPI.delete(slug!),
    onSuccess: () => {
      toast({ title: "Post deleted" });
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      navigate("/blog");
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded-2xl mt-6" />
        </div>
      </Layout>
    );
  }

  if (isError || !data?.data) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display font-black text-2xl uppercase">Post not found</h2>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const post = data.data;

  return (
    <Layout>
      <Helmet>
        <title>{post.title} | PB Draw Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.pbdraw.com/blog/${post.slug}`} />
        <meta property="article:published_time" content={post.publishedAt} />
        <link rel="canonical" href={`https://www.pbdraw.com/blog/${post.slug}`} />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back + admin actions */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/blog"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Posts
          </Link>
          {isBlogAdmin(user) && (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-2 font-display font-bold uppercase tracking-wide text-xs">
                <Link to={`/blog/${post.slug}/edit`}>
                  <PencilSimple className="w-3.5 h-3.5" />
                  Edit
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 font-display font-bold uppercase tracking-wide text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm("Delete this post?")) deleteMutation.mutate();
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Draft banner */}
        {post.status === "draft" && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs font-display font-bold uppercase tracking-widest">
            Draft — not visible to the public
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-[10px] font-display uppercase tracking-widest px-2">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-foreground mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border/50">
          {post.author?.name && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.author.name}
            </span>
          )}
          {post.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {format(new Date(post.publishedAt), "MMMM d, yyyy")}
            </span>
          )}
        </div>

        {/* Content */}
        <div
          className="prose prose-sm sm:prose max-w-none dark:prose-invert
            prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tight
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-primary prose-blockquote:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </Layout>
  );
}
