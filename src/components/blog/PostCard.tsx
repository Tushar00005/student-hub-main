import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    excerpt: string | null;
    cover_image: string | null;
    created_at: string;
    status: string;
    author: {
      name: string;
      avatar_url: string | null;
    };
    likes_count: number;
    comments_count: number;
  };
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/post/${post.id}`}>
        <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 group h-full">
          {post.cover_image && (
            <div className="aspect-video overflow-hidden">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              {post.status === 'draft' && (
                <Badge variant="secondary" className="text-xs">Draft</Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                {post.excerpt}
              </p>
            )}
          </CardContent>
          <CardFooter className="px-5 pb-5 pt-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={post.author.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {post.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{post.author.name}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {post.likes_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {post.comments_count}
                </span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
