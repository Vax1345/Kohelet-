import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Comment } from '../types';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Trash2, MessageSquare, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommentSystemProps {
  chapterId: string;
  chapterAuthorId: string;
}

export function CommentSystem({ chapterId, chapterAuthorId }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = 'comments';
    const q = query(
      collection(db, path),
      where('chapterId', '==', chapterId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chapterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !auth.currentUser || isSubmitting) return;

    setIsSubmitting(true);
    const path = 'comments';
    try {
      await addDoc(collection(db, path), {
        chapterId,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'אלמוני',
        content: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('האם אתם בטוחים שברצונכם למחוק תגובה זו?')) return;
    const path = `comments/${commentId}`;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-accent/10">
      <div className="flex items-center gap-2 mb-6 text-accent">
        <MessageSquare className="w-5 h-5" />
        <h3 className="text-xl font-serif font-bold">תגובות ({comments.length})</h3>
      </div>

      {/* Add Comment Form */}
      {auth.currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="הוסיפו תגובה..."
            className="w-full p-4 bg-white border border-accent/20 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all resize-none h-24 text-sm"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="absolute bottom-4 left-4 p-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-accent/5 border border-accent/10 rounded-xl text-center text-sm text-ink/60 italic">
          התחברו כדי להגיב
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : comments.length > 0 ? (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-white/50 p-4 rounded-xl border border-accent/5 hover:border-accent/20 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-sm text-accent">{comment.authorName}</span>
                    <span className="text-[10px] text-ink/40 mr-2">
                      {comment.createdAt?.toDate ? format(comment.createdAt.toDate(), 'd בMMMM HH:mm', { locale: he }) : 'עכשיו'}
                    </span>
                  </div>
                  {(auth.currentUser?.uid === comment.authorId || auth.currentUser?.uid === chapterAuthorId) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-ink/20 hover:text-red-500 transition-all"
                      title="מחיקת תגובה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-ink/80 leading-relaxed">{comment.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <p className="text-center text-xs text-ink/30 italic">אין עדיין תגובות לפרק זה...</p>
        )}
      </div>
    </div>
  );
}
