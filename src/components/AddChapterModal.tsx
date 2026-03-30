import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface AddChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddChapterModal({ isOpen, onClose }: AddChapterModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('יש למלא כותרת ותוכן');
      return;
    }

    if (!auth.currentUser) {
      toast.error('עליך להיות מחובר כדי לפרסם פרק');
      return;
    }
    
    setIsSaving(true);
    const path = 'chapters';
    try {
      await addDoc(collection(db, path), {
        title: title.trim(),
        content: content.trim(),
        order: parseInt(order) || 0,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'אלמוני',
        createdAt: serverTimestamp(),
      });
      toast.success('הפרק פורסם בהצלחה!');
      onClose();
      setTitle('');
      setContent('');
      setOrder('1');
    } catch (error: any) {
      console.error('Error saving chapter:', error);
      if (error.message?.includes('permission-denied') || error.code === 'permission-denied') {
        toast.error('אין לך הרשאות לפרסם פרק. וודא שאתה מחובר כ-Admin.');
      } else {
        toast.error('שגיאה בפרסום הפרק. נסה שוב מאוחר יותר.');
      }
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-parchment w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-accent/20"
          >
            <div className="p-6 border-b border-accent/10 flex justify-between items-center bg-white">
              <h2 className="text-2xl font-serif font-bold text-accent">הוספת פרק חדש</h2>
              <button onClick={onClose} className="p-2 hover:bg-accent/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-bold text-accent uppercase tracking-wider">כותרת הפרק</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="למשל: על החיים ב-2026"
                  className="w-full p-3 bg-white border border-accent/20 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
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

              <div className="space-y-2">
                <label className="text-sm font-bold text-accent uppercase tracking-wider">תוכן הפרק</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="כתבו כאן את דבריכם..."
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
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  פרסמו את הפרק
                </button>
              </div>
              {(!title.trim() || !content.trim()) && (
                <p className="text-[10px] text-center text-red-500 italic">
                  {!title.trim() ? 'יש להזין כותרת' : 'יש להזין תוכן'} כדי לפרסם
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
