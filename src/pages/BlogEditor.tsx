import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { blogAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import RichEditor from "@/components/blog/RichEditor";
import { ArrowLeft, FloppyDisk, Eye } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const BLOG_ADMIN_EMAILS = ["nadeemtalha24@gmail.com"];
function isBlogAdmin(user: any) {
  return user?.role === "admin" || BLOG_ADMIN_EMAILS.includes(user?.email);
}

export default function BlogEditor() {
  const { slug } = useParams<{ slug?: string }>();
  const isEditing = !!slug;
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  // Load existing post if editing
  const { data: postData } = useQuery({
    queryKey: ["blog-post-edit", slug],
    queryFn: () => blogAPI.getBySlug(slug!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (postData?.data) {
      const p = postData.data;
      setTitle(p.title ?? "");
      setContent(p.content ?? "");
      setExcerpt(p.excerpt ?? "");
      setTagsInput(p.tags?.join(", ") ?? "");
      setStatus(p.status ?? "draft");
    }
  }, [postData]);

  const createMutation = useMutation({
    mutationFn: () =>
      blogAPI.create({
        title,
        content,
        excerpt,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        status,
      }),
    onSuccess: (data) => {
      toast({ title: status === "published" ? "Post published!" : "Draft saved!" });
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      navigate(`/blog/${data.data.slug}`);
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to save", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      blogAPI.update(slug!, {
        title,
        content,
        excerpt,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        status,
      }),
    onSuccess: (data) => {
      toast({ title: "Post updated!" });
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-post", slug] });
      navigate(`/blog/${data.data.slug}`);
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to update", variant: "destructive" }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isBlogAdmin(user)) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display font-black text-2xl uppercase">Not authorized</h2>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleSave = (s: "draft" | "published") => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!content || content === "<p></p>") {
      toast({ title: "Content is required", variant: "destructive" });
      return;
    }
    setStatus(s);
    if (isEditing) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <Layout variant="minimal">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/blog"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Blog
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleSave("draft")}
              className="gap-2 font-display font-bold uppercase tracking-wide text-xs"
            >
              <FloppyDisk className="w-3.5 h-3.5" />
              Save Draft
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => handleSave("published")}
              className="gap-2 font-display font-bold uppercase tracking-wide text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              {isPending ? "Saving..." : "Publish"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label className="font-display font-bold text-xs uppercase tracking-wide">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="How to Improve Your Third Shot Drop..."
              className="text-lg font-display font-bold rounded-xl h-12"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="font-display font-bold text-xs uppercase tracking-wide">
              Tags <span className="text-muted-foreground font-normal normal-case tracking-normal">(comma separated)</span>
            </Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="strategy, beginner, tournament tips"
              className="rounded-xl"
            />
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label className="font-display font-bold text-xs uppercase tracking-wide">
              Excerpt <span className="text-muted-foreground font-normal normal-case tracking-normal">(shown in listing — auto-generated if blank)</span>
            </Label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short summary of the post..."
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Rich editor */}
          <div className="space-y-2">
            <Label className="font-display font-bold text-xs uppercase tracking-wide">Content</Label>
            <RichEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your pickleball post..."
            />
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                status === "published" ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
            {status === "published" ? "Published" : "Draft"}
          </div>
        </div>
      </div>
    </Layout>
  );
}
