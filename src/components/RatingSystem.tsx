import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface RatingSystemProps {
  chapterId: string;
  initialRatingSum?: number;
  initialRatingCount?: number;
}

export function RatingSystem({ chapterId, initialRatingSum = 0, initialRatingCount = 0 }: RatingSystemProps) {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);

  const averageRating = initialRatingCount > 0 ? (initialRatingSum / initialRatingCount).toFixed(1) : '0';

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const ratingId = `${auth.currentUser.uid}_${chapterId}`;
    const path = `ratings/${ratingId}`;
    const ratingRef = doc(db, 'ratings', ratingId);
    
    getDoc(ratingRef).then((docSnap) => {
      if (docSnap.exists()) {
        setUserRating(docSnap.data().score);
      }
    }).catch(error => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, [chapterId, auth.currentUser]);

  const handleRate = async (score: number) => {
    if (!auth.currentUser || isRating) return;
    setIsRating(true);

    const userId = auth.currentUser.uid;
    const ratingId = `${userId}_${chapterId}`;
    const ratingRef = doc(db, 'ratings', ratingId);
    const chapterRef = doc(db, 'chapters', chapterId);

    try {
      await runTransaction(db, async (transaction) => {
        const ratingDoc = await transaction.get(ratingRef);
        const chapterDoc = await transaction.get(chapterRef);

        if (!chapterDoc.exists()) throw "Chapter does not exist!";

        const oldScore = ratingDoc.exists() ? ratingDoc.data().score : 0;
        const currentSum = chapterDoc.data().ratingSum || 0;
        const currentCount = chapterDoc.data().ratingCount || 0;

        let newSum = currentSum;
        let newCount = currentCount;

        if (ratingDoc.exists()) {
          newSum = currentSum - oldScore + score;
        } else {
          newSum = currentSum + score;
          newCount = currentCount + 1;
        }

        transaction.set(ratingRef, {
          chapterId,
          userId,
          score,
          createdAt: serverTimestamp()
        });

        transaction.update(chapterRef, {
          ratingSum: newSum,
          ratingCount: newCount
        });
      });
      setUserRating(score);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `ratings/${ratingId}`);
    } finally {
      setIsRating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-accent/5 rounded-xl border border-accent/10">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={!auth.currentUser || isRating}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(null)}
            onClick={() => handleRate(star)}
            className={cn(
              "p-1 transition-all duration-200",
              !auth.currentUser && "cursor-not-allowed opacity-50",
              (hoverRating || userRating || 0) >= star ? "text-yellow-500 scale-110" : "text-ink/20"
            )}
          >
            <Star className={cn("w-6 h-6", (hoverRating || userRating || 0) >= star && "fill-current")} />
          </button>
        ))}
      </div>
      <div className="text-xs font-classic text-ink/60">
        דירוג ממוצע: <span className="font-bold text-accent">{averageRating}</span> ({initialRatingCount} מדרגים)
      </div>
      {!auth.currentUser && (
        <span className="text-[10px] text-ink/40 italic">התחברו כדי לדרג</span>
      )}
    </div>
  );
}
