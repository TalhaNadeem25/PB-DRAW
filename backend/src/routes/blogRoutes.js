import express from 'express';
import Blog from '../models/Blog.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const BLOG_ADMIN_EMAILS = ['nadeemtalha24@gmail.com', 'awk.hafiz@gmail.com'];

// Middleware — only blog admins or app admins can write
const blogAdminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (req.user.role === 'admin' || BLOG_ADMIN_EMAILS.includes(req.user.email)) return next();
  return res.status(403).json({ success: false, message: 'Not authorized to manage blog posts' });
};

// Slug generator
function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// GET /api/blog — public, published posts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, tag } = req.query;
    const query = { status: 'published' };
    if (tag) query.tags = tag;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Blog.countDocuments(query);
    const posts = await Blog.find(query)
      .populate('author', 'name')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-content');

    res.json({ success: true, data: posts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/blog/drafts — blog admin only, all posts
router.get('/drafts', protect, blogAdminOnly, async (req, res) => {
  try {
    const posts = await Blog.find()
      .populate('author', 'name')
      .sort({ updatedAt: -1 })
      .select('-content');
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/blog/admin/:slug — blog admin only, returns any post including drafts
router.get('/admin/:slug', protect, blogAdminOnly, async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug }).populate('author', 'name');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/blog/:slug — public, single post
router.get('/:slug', async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug })
      .populate('author', 'name');

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.status !== 'published') return res.status(404).json({ success: false, message: 'Post not found' });

    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/blog — create post
router.post('/', protect, blogAdminOnly, async (req, res) => {
  try {
    const { title, content, excerpt, tags, status } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });

    let slug = toSlug(title);
    // Ensure unique slug
    const existing = await Blog.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const publishedAt = status === 'published' ? new Date() : undefined;

    const post = await Blog.create({
      title,
      slug,
      content,
      excerpt: excerpt || content.replace(/<[^>]+>/g, '').substring(0, 160),
      author: req.user._id,
      status: status || 'draft',
      tags: tags || [],
      publishedAt,
    });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/blog/:slug — update post
router.put('/:slug', protect, blogAdminOnly, async (req, res) => {
  try {
    const { title, content, excerpt, tags, status } = req.body;
    const post = await Blog.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (title) post.title = title;
    if (content) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (tags !== undefined) post.tags = tags;
    if (status) {
      if (status === 'published' && post.status !== 'published') post.publishedAt = new Date();
      post.status = status;
    }
    if (excerpt === undefined && content) {
      post.excerpt = content.replace(/<[^>]+>/g, '').substring(0, 160);
    }

    await post.save();
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/blog/:slug — delete post
router.delete('/:slug', protect, blogAdminOnly, async (req, res) => {
  try {
    const post = await Blog.findOneAndDelete({ slug: req.params.slug });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
