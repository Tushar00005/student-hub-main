import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { CommentSection } from '@/components/blog/CommentSection';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Heart, ArrowLeft, Calendar, Edit, Trash2, Loader2 } from 'lucide-react';

function PostContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchPost();
      if (user) checkIfLiked();
    }
  }, [id, user]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate('/blog');
        return;
      }

      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('name, avatar_url, bio')
        .eq('user_id', data.author_id)
        .maybeSingle();

      setPost({
        ...data,
        author: {
          name: authorProfile?.name || 'Unknown',
          avatar_url: authorProfile?.avatar_url,
          bio: authorProfile?.bio,
        },
      });

      const { count } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', id);
      setLikesCount(count || 0);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    setLiked(!!data);
  };

  const handleLike = async () => {
    if (!user) {
      openAuth('login');
      return;
    }

    try {
      if (liked) {
        await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user.id);
        setLiked(false);
        setLikesCount((c) => c - 1);
      } else {
        await supabase.from('likes').insert({ post_id: id, user_id: user.id });
        setLiked(true);
        setLikesCount((c) => c + 1);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await supabase.from('posts').delete().eq('id', id);
      toast.success('Post deleted');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onOpenAuth={openAuth} />
        <div className="flex justify-center items-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!post) return null;

  const isAuthor = user?.id === post.author_id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar onOpenAuth={openAuth} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {post.cover_image && (
            <div className="aspect-video rounded-2xl overflow-hidden mb-8">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            {post.status === 'draft' && (
              <Badge variant="secondary">Draft</Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-6">{post.title}</h1>

          <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-8 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {post.author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{post.author.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.created_at), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={liked ? 'default' : 'outline'}
                size="sm"
                onClick={handleLike}
              >
                <Heart className={`mr-2 h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                {likesCount}
              </Button>

              {isAuthor && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/edit/${post.id}`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="prose prose-lg max-w-none mb-12">
            {post.content.split('\n').map((paragraph: string, i: number) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="border-t pt-8">
            <CommentSection postId={post.id} />
          </div>
        </motion.article>
      </main>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}

export default function Post() {
  return (
    <AuthProvider>
      <PostContent />
    </AuthProvider>
  );
}
