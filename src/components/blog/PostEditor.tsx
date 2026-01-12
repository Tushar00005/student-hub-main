import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, Send, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostEditorProps {
  post?: {
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    cover_image: string | null;
    status: string;
  };
}

export function PostEditor({ post }: PostEditorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    cover_image: post?.cover_image || '',
  });

  const handleSave = async (status: 'draft' | 'published') => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);

    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || formData.content.substring(0, 150) + '...',
        cover_image: formData.cover_image.trim() || null,
        status,
        author_id: user.id,
        published_at: status === 'published' ? new Date().toISOString() : null,
      };

      if (post) {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', post.id);
        if (error) throw error;
        toast.success(status === 'published' ? 'Post published!' : 'Draft saved!');
      } else {
        const { error } = await supabase.from('posts').insert(postData);
        if (error) throw error;
        toast.success(status === 'published' ? 'Post published!' : 'Draft saved!');
      }

      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{post ? 'Edit Post' : 'Create New Post'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter your post title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt (optional)</Label>
            <Textarea
              id="excerpt"
              placeholder="A brief summary of your post..."
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_image">Cover Image URL (optional)</Label>
            <Input
              id="cover_image"
              placeholder="https://example.com/image.jpg"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your post content here..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={15}
              className="font-mono"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave('published')}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Publish
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
