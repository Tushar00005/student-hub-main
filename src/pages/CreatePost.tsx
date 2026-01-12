import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { PostEditor } from '@/components/blog/PostEditor';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

function CreatePostContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar onOpenAuth={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <PostEditor />
      </main>
    </div>
  );
}

export default function CreatePost() {
  return (
    <AuthProvider>
      <CreatePostContent />
    </AuthProvider>
  );
}
