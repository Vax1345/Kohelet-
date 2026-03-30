import { useState, useEffect } from 'react';
import { db, auth, signInWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Chapter } from './types';
import { ChapterCard } from './components/ChapterCard';
import { AddChapterModal } from './components/AddChapterModal';
import { EditChapterModal } from './components/EditChapterModal';
import { LogIn, LogOut, Plus, ScrollText, Loader2, Menu, X as CloseIcon, Share2, Search, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    const path = 'chapters';
    const q = query(collection(db, path)); // Remove server-side orderBy to show all docs
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const chaptersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chapter[];
      
      // Sort client-side: prioritize 'order', then 'createdAt'
      const sortedChapters = [...chaptersData].sort((a, b) => {
        const orderA = a.order ?? 999999;
        const orderB = b.order ?? 999999;
        if (orderA !== orderB) return orderA - orderB;
        
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setChapters(sortedChapters);
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

  const isAdmin = user?.email?.toLowerCase() === 'tzachi@vax-man.com';

  const filteredChapters = chapters.filter(chapter => 
    chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chapter.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-24">
      <Toaster position="top-center" richColors />
      {/* Header */}
      <header className="bg-white border-b border-accent/10 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto px-6 py-3 sm:py-4 flex justify-between items-center">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
            title="פתח תוכן עניינים"
          >
            <div className="bg-accent p-1.5 sm:p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
              <ScrollText className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <div className="text-right">
              <h1 className="text-xl sm:text-2xl font-bold text-accent">בלוג קהלת 2026</h1>
              <p className="text-[8px] sm:text-[10px] font-classic uppercase tracking-widest text-ink/40">הבל הבלים, הכל הבל (לחץ לתוכן)</p>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => {
                const url = window.location.origin;
                if (navigator.share) {
                  navigator.share({
                    title: 'בלוג קהלת 2026',
                    text: 'מחשבות אקטואליות מנוסחות בסגנון קהלת',
                    url: url
                  }).catch(() => {
                    navigator.clipboard.writeText(url);
                    toast.success('הקישור הועתק ללוח');
                  });
                } else {
                  navigator.clipboard.writeText(url);
                  toast.success('הקישור הועתק ללוח');
                }
              }}
              className="p-1.5 sm:p-2 hover:bg-accent/5 rounded-full transition-colors text-accent/60 hover:text-accent"
              title="שתף את הבלוג"
            >
              <Share2 className="w-4 h-4 sm:w-5 h-5" />
            </button>
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm font-medium text-ink/60 hidden md:inline">שלום, {user.displayName}</span>
                <button
                  onClick={() => logout()}
                  className="p-1.5 sm:p-2 hover:bg-accent/5 rounded-full transition-colors text-ink/40 hover:text-ink/80"
                  title="התנתקות"
                >
                  <LogOut className="w-4 h-4 sm:w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-accent/5 hover:bg-accent/10 text-accent rounded-full font-bold text-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 h-4" />
                התחברות
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sticky Search Bar */}
      <div className="sticky top-[61px] sm:top-[73px] z-30 bg-white/90 backdrop-blur-md border-b border-accent/5 py-2 sm:py-3 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 relative group">
          <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none text-accent/40 group-focus-within:text-accent transition-colors">
            <Search className="w-4 h-4 sm:w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפשו בפרקים..."
            className="w-full py-2.5 sm:py-3 pr-10 sm:pr-12 pl-10 bg-accent/5 border border-transparent focus:bg-white focus:border-accent/20 rounded-xl outline-none transition-all text-base sm:text-lg font-classic italic"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 left-10 flex items-center text-ink/20 hover:text-ink/60 transition-colors"
            >
              <CloseIcon className="w-4 h-4 sm:w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-12 sm:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl sm:text-6xl font-serif font-bold text-accent mb-4 sm:mb-6">מחשבות אקטואליות</h2>
          <p className="text-lg sm:text-xl font-classic italic text-ink/60 max-w-2xl mx-auto leading-relaxed">
            "מַה-שֶּׁהָיָה הוּא שֶׁיִּהְיֶה, וּמַה-שֶּׁנַּעֲשָׂה הוּא שֶׁיֵּעָשֶׂה; וְאֵין כָּל-חָדָשׁ תַּחַת הַשָּׁמֶשׁ."
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6">
        {/* Chapters List */}
        <main>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
          ) : filteredChapters.length > 0 ? (
            <div className="space-y-8">
              {filteredChapters.map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  id={chapter.id}
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
              <p className="text-ink/40 font-classic italic">
                {searchQuery ? `לא נמצאו תוצאות עבור "${searchQuery}"` : 'טרם נכתבו פרקים בבלוג זה...'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button */}
      {isAdmin && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 bg-accent text-white p-3 sm:p-4 rounded-full shadow-2xl z-50 flex items-center gap-2 px-5 sm:px-6"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="font-bold text-sm sm:text-base">הוספת פרק</span>
        </motion.button>
      )}

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-white border border-accent/20 text-accent p-3 sm:p-4 rounded-full shadow-xl z-50 hover:bg-accent hover:text-white transition-all group"
            title="חזרה למעלה"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddChapterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditChapterModal chapter={editingChapter} onClose={() => setEditingChapter(null)} />

      {/* Chapter Navigation Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-80 bg-parchment z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-accent/10 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <ScrollText className="w-6 h-6 text-accent" />
                  <h3 className="text-lg font-serif font-bold text-accent">תוכן העניינים</h3>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-accent/5 rounded-full transition-colors"
                >
                  <CloseIcon className="w-6 h-6 text-accent" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-6 space-y-4">
                {chapters.length > 0 ? (
                  chapters.map((chapter) => (
                    <a
                      key={chapter.id}
                      href={`#${chapter.id}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="block p-4 rounded-xl hover:bg-accent/5 text-ink/70 hover:text-accent transition-all font-classic italic border border-transparent hover:border-accent/10 group"
                    >
                      <span className="text-accent/30 group-hover:text-accent ml-2">§</span>
                      {chapter.title}
                    </a>
                  ))
                ) : (
                  <p className="text-center text-ink/40 italic py-10">אין פרקים להצגה</p>
                )}
              </nav>
              <div className="p-6 border-t border-accent/10 bg-accent/5">
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">אודות הבלוג</p>
                <p className="text-xs text-ink/60 leading-relaxed italic">
                  "מַה-שֶּׁהָיָה הוּא שֶׁיִּהְיֶה, וּמַה-שֶּׁנַּעֲשָׂה הוּא שֶׁיֵּעָשֶׂה; וְאֵין כָּל-חָדָשׁ תַּחַת הַשָּׁמֶשׁ."
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-accent/10 text-center">
        <p className="text-xs font-classic text-ink/30 uppercase tracking-[0.2em]">
          קהלת 2026 &copy; כל הזכויות שמורות להבל
        </p>
      </footer>
    </div>
  );
}

