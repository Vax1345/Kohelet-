import { useState, useEffect } from 'react';
import { db, auth, signInWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Chapter } from './types';
import { ChapterCard } from './components/ChapterCard';
import { AddChapterModal } from './components/AddChapterModal';
import { EditChapterModal } from './components/EditChapterModal';
import { LogIn, LogOut, Plus, ScrollText, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    const path = 'chapters';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const chaptersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chapter[];
      setChapters(chaptersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, []);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white border-b border-accent/10 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-accent p-2 rounded-lg text-white">
              <ScrollText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-accent">בלוג קהלת 2026</h1>
              <p className="text-[10px] font-classic uppercase tracking-widest text-ink/40">הבל הבלים, הכל הבל</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-ink/60 hidden sm:inline">שלום, {user.displayName}</span>
                <button
                  onClick={() => logout()}
                  className="p-2 hover:bg-accent/5 rounded-full transition-colors text-ink/40 hover:text-ink/80"
                  title="התנתקות"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-2 px-4 py-2 bg-accent/5 hover:bg-accent/10 text-accent rounded-full font-bold text-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                התחברות
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-6xl font-serif font-bold text-accent mb-6">מחשבות אקטואליות</h2>
          <p className="text-xl font-classic italic text-ink/60 max-w-2xl mx-auto leading-relaxed">
            "מַה-שֶּׁהָיָה הוּא שֶׁיִּהְיֶה, וּמַה-שֶּׁנַּעֲשָׂה הוּא שֶׁיֵּעָשֶׂה; וְאֵין כָּל-חָדָשׁ תַּחַת הַשָּׁמֶשׁ."
          </p>
        </motion.div>
      </section>

      {/* Chapters List */}
      <main className="max-w-4xl mx-auto px-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
          </div>
        ) : chapters.length > 0 ? (
          <div className="space-y-8">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ChapterCard chapter={chapter} onEdit={(c) => setEditingChapter(c)} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-accent/10 rounded-3xl">
            <p className="text-ink/40 font-classic italic">טרם נכתבו פרקים בבלוג זה...</p>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {user && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 left-8 bg-accent text-white p-4 rounded-full shadow-2xl z-50 flex items-center gap-2 px-6"
        >
          <Plus className="w-6 h-6" />
          <span className="font-bold">הוספת פרק</span>
        </motion.button>
      )}

      {/* Modals */}
      <AddChapterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditChapterModal chapter={editingChapter} onClose={() => setEditingChapter(null)} />

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-accent/10 text-center">
        <p className="text-xs font-classic text-ink/30 uppercase tracking-[0.2em]">
          קהלת 2026 &copy; כל הזכויות שמורות להבל
        </p>
      </footer>
    </div>
  );
}

