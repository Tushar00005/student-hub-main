import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { PostEditor } from '@/components/blog/PostEditor';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

function EditPostContent() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }

    if (id && user) {
      fetchPost();
    }
  }, [id, user, authLoading, navigate]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('author_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate('/dashboard');
        return;
      }

      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !post) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar onOpenAuth={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <PostEditor post={post} />
      </main>
    </div>
  );
}

export default function EditPost() {
  return (
    <AuthProvider>
      <EditPostContent />
    </AuthProvider>
  );
}
