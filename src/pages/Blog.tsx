import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { PostCard } from '@/components/blog/PostCard';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { AuthProvider } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';

function BlogContent() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          excerpt,
          cover_image,
          created_at,
          status,
          author_id,
          profiles!posts_author_id_fkey (name, avatar_url)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post: any) => {
          const [likesRes, commentsRes] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id),
          ]);

          return {
            ...post,
            author: {
              name: post.profiles?.name || 'Unknown',
              avatar_url: post.profiles?.avatar_url,
            },
            likes_count: likesRes.count || 0,
            comments_count: commentsRes.count || 0,
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar onOpenAuth={openAuth} />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Explore Posts</h1>
          <p className="text-muted-foreground mb-8">
            Discover stories, insights, and knowledge from students around the world.
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-muted-foreground">
              {search ? 'No posts found matching your search.' : 'No posts yet. Be the first to write one!'}
            </p>
          </motion.div>
        )}
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

export default function Blog() {
  return (
    <AuthProvider>
      <BlogContent />
    </AuthProvider>
  );
}
