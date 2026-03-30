import { Chapter } from '../types';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { RatingSystem } from './RatingSystem';
import { CommentSystem } from './CommentSystem';
import { Edit2, Share2 } from 'lucide-react';
import { auth } from '../firebase';
import { toast } from 'sonner';

interface ChapterCardProps {
  chapter: Chapter;
  onEdit?: (chapter: Chapter) => void;
}

export function ChapterCard({ chapter, onEdit }: ChapterCardProps) {
  const date = chapter.createdAt?.toDate ? chapter.createdAt.toDate() : new Date();
  const formattedDate = format(date, 'd בMMMM yyyy', { locale: he });
  const isAuthor = auth.currentUser?.uid === chapter.authorId;

  const handleShare = () => {
    const url = `${window.location.origin}/#${chapter.id}`;
    if (navigator.share) {
      navigator.share({
        title: chapter.title,
        text: `קראו את הפרק "${chapter.title}" בבלוג קהלת 2026`,
        url: url
      }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success('הקישור לפרק הועתק ללוח');
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('הקישור לפרק הועתק ללוח');
    }
  };

  return (
    <div id={chapter.id} className="parchment-card mb-8 sm:mb-12 max-w-2xl mx-auto relative overflow-hidden scroll-mt-24 p-6 sm:p-8">
      <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 -mr-8 -mt-8 rounded-full" />
      
      <header className="mb-6 border-b border-accent/10 pb-4 relative">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-accent">{chapter.title}</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-accent/5 rounded-full transition-colors text-accent/40 hover:text-accent"
              title="שיתוף פרק"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {isAuthor && onEdit && (
              <button 
                onClick={() => onEdit(chapter)}
                className="p-2 hover:bg-accent/5 rounded-full transition-colors text-accent/40 hover:text-accent"
                title="עריכת פרק"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-ink/60 font-medium tracking-wide uppercase">
          <span>{chapter.authorName}</span>
          <span>{formattedDate}</span>
        </div>
      </header>

      <div className="kohelet-text mb-8 text-ink/90 text-xl sm:text-2xl">
        {chapter.content}
      </div>

      {/* Rating Section */}
      <div className="mt-12 pt-8 border-t border-accent/10 flex justify-center">
        <RatingSystem 
          chapterId={chapter.id} 
          initialRatingSum={chapter.ratingSum} 
          initialRatingCount={chapter.ratingCount} 
        />
      </div>

      {/* Comment Section */}
      <CommentSystem 
        chapterId={chapter.id} 
        chapterAuthorId={chapter.authorId} 
      />
    </div>
  );
}
