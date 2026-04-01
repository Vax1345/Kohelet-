import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Save } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Chapter, Book } from '../types';
import { toast } from 'sonner';

interface EditChapterModalProps {
  chapter: Chapter | null;
  onClose: () => void;
}

export function EditChapterModal({ chapter, onClose }: EditChapterModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState('1');
  const [book, setBook] = useState<Book>('kohelet');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title);
      setContent(chapter.content);
      setOrder(chapter.order?.toString() || '1');
      setBook(chapter.book || 'kohelet');
    }
  }, [chapter]);

  const handleSave = async () => {
    if (!chapter || !title.trim() || !content.trim()) {
      toast.error('יש למלא כותרת ותוכן');
      return;
    }

    if (!auth.currentUser) {
      toast.error('עליך להיות מחובר כדי לערוך פרק');
      return;
    }
    
    setIsSaving(true);
    const path = `chapters/${chapter.id}`;
    try {
      const chapterRef = doc(db, 'chapters', chapter.id);
      await updateDoc(chapterRef, {
        title: title.trim(),
        content: content.trim(),
        order: parseInt(order) || 0,
        book,
        updatedAt: serverTimestamp(),
      });
      toast.success('השינויים נשמרו בהצלחה!');
      onClose();
    } catch (error: any) {
      console.error('Error updating chapter:', error);
      if (error.message?.includes('permission-denied') || error.code === 'permission-denied') {
        toast.error('אין לך הרשאות לערוך פרק זה.');
      } else {
        toast.error('שגיאה בשמירת השינויים. נסה שוב מאוחר יותר.');
      }
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {chapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-parchment w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-accent/20"
          >
            <div className="p-6 border-b border-accent/10 flex justify-between items-center bg-white">
              <h2 className="text-2xl font-serif font-bold text-accent">עריכת פרק</h2>
              <button onClick={onClose} className="p-2 hover:bg-accent/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-accent uppercase tracking-wider">ספר</label>
                  <select
                    value={book}
                    onChange={(e) => setBook(e.target.value as Book)}
                    className="w-full p-3 bg-white border border-accent/20 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                  >
                    <option value="kohelet">קהלת 2026</option>
                    <option value="mishlei">משלי 2026</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-accent uppercase tracking-wider">סדר תצוגה (מספר)</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full p-3 bg-white border border-accent/20 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-accent uppercase tracking-wider">כותרת הפרק</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-white border border-accent/20 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-accent uppercase tracking-wider">תוכן הפרק</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 bg-white border border-accent/20 rounded-lg text-xl h-64 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-6 bg-white border-t border-accent/10 flex flex-col gap-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-full font-bold text-ink/60 hover:bg-accent/5 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || !content.trim()}
                  className="px-8 py-2 bg-accent text-white rounded-full font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-accent/20"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  שמירת שינויים
                </button>
              </div>
              {(!title.trim() || !content.trim()) && (
                <p className="text-[10px] text-center text-red-500 italic">
                  {!title.trim() ? 'יש להזין כותרת' : 'יש להזין תוכן'} כדי לשמור
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
