import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PenSquare, FileText, Eye, Edit, Trash2, Heart, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function DashboardContent() {
  const { user, profile, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }

    if (role === 'admin') {
      navigate('/admin');
      return;
    }

    if (user) {
      fetchPosts();
    }
  }, [user, authLoading, role, navigate]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const [likesRes, commentsRes] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id),
          ]);
          return {
            ...post,
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

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await supabase.from('posts').delete().eq('id', postId);
      setPosts(posts.filter((p) => p.id !== postId));
      toast.success('Post deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const drafts = posts.filter((p) => p.status === 'draft');
  const published = posts.filter((p) => p.status === 'published');

  const PostItem = ({ post }: { post: any }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-card transition-all"
    >
      <div className="flex-1 min-w-0">
        <Link to={`/post/${post.id}`} className="block">
          <h3 className="font-medium truncate hover:text-primary transition-colors">
            {post.title}
          </h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {post.likes_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {post.comments_count}
            </span>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
          {post.status}
        </Badge>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/post/${post.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/edit/${post.id}`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(post.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar onOpenAuth={() => {}} />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {profile?.name}!</p>
            </div>
            <Button onClick={() => navigate('/create')}>
              <PenSquare className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{posts.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Published
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{published.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Drafts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{drafts.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All ({posts.length})</TabsTrigger>
                  <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3 mt-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : posts.length > 0 ? (
                    posts.map((post) => <PostItem key={post.id} post={post} />)
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No posts yet. Create your first post!
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="published" className="space-y-3 mt-4">
                  {published.length > 0 ? (
                    published.map((post) => <PostItem key={post.id} post={post} />)
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No published posts yet.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="drafts" className="space-y-3 mt-4">
                  {drafts.length > 0 ? (
                    drafts.map((post) => <PostItem key={post.id} post={post} />)
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No drafts yet.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
