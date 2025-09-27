import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface InterviewQuota {
  used: number;
  total: number;
  resetDate: Date;
}

interface InterviewQuotaContextType {
  quota: InterviewQuota;
  loading: boolean;
  useInterview: () => Promise<boolean>;
  refreshQuota: () => Promise<void>;
}

const InterviewQuotaContext = createContext<InterviewQuotaContextType | undefined>(undefined);

export const useInterviewQuota = () => {
  const context = useContext(InterviewQuotaContext);
  if (context === undefined) {
    throw new Error('useInterviewQuota must be used within an InterviewQuotaProvider');
  }
  return context;
};

export const InterviewQuotaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [quota, setQuota] = useState<InterviewQuota>({
    used: 0,
    total: 5,
    resetDate: new Date()
  });
  const [loading, setLoading] = useState(true);

  // Get the start of next month for reset date
  const getNextMonthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  };

  // Check if quota should be reset
  const shouldResetQuota = (resetDate: Date) => {
    return new Date() >= resetDate;
  };

  // Load user's quota from Firestore
  const loadQuota = async () => {
    if (!currentUser) {
      return;
    }

    try {
      const quotaRef = doc(db, 'user_quotas', currentUser.uid);
      const quotaSnap = await getDoc(quotaRef);

      if (quotaSnap.exists()) {
        const data = quotaSnap.data();
        const resetDate = data.resetDate?.toDate() || getNextMonthStart();

        // Check if quota should be reset
        if (shouldResetQuota(resetDate)) {
          const newQuota = {
            used: 0,
            total: 5,
            resetDate: getNextMonthStart()
          };

          await setDoc(quotaRef, {
            ...newQuota,
            resetDate: newQuota.resetDate
          });

          setQuota(newQuota);
        } else {
          setQuota({
            used: data.used || 0,
            total: data.total || 5,
            resetDate
          });
        }
      } else {
        // Create initial quota for new user
        const initialQuota = {
          used: 0,
          total: 5,
          resetDate: getNextMonthStart()
        };

        await setDoc(quotaRef, {
          ...initialQuota,
          resetDate: initialQuota.resetDate
        });

        setQuota(initialQuota);
      }
    } catch (error) {
      console.error('Error loading quota:', error);
      // Keep existing quota on error to prevent app from breaking
    }
  };

  // Use one interview from quota
  const useInterview = async (): Promise<boolean> => {
    console.log('useInterview called', { currentUser: !!currentUser, quota });

    if (!currentUser) {
      console.error('No current user when trying to use interview');
      return false;
    }

    if (quota.used >= quota.total) {
      console.warn('Quota already reached', quota);
      return false;
    }

    try {
      const quotaRef = doc(db, 'user_quotas', currentUser.uid);
      const newUsed = quota.used + 1;

      console.log('Updating quota from', quota.used, 'to', newUsed);
      await updateDoc(quotaRef, { used: newUsed });

      setQuota(prev => ({
        ...prev,
        used: newUsed
      }));

      console.log('Quota updated successfully');
      return true;
    } catch (error) {
      console.error('Error using interview quota:', error);
      // Even if quota update fails, we can still allow the interview
      // This is better UX than blocking the user
      return true;
    }
  };

  // Refresh quota data
  const refreshQuota = async () => {
    setLoading(true);
    await loadQuota();
  };

  useEffect(() => {
    if (currentUser) {
      // Set loading to false with default quota immediately, then load actual quota
      setQuota({ used: 0, total: 5, resetDate: getNextMonthStart() });
      setLoading(false);

      // Load actual quota in background
      loadQuota().catch((error) => {
        console.error('Error loading quota, using defaults:', error);
        // Keep default quota if loading fails
      });
    } else {
      setQuota({ used: 0, total: 5, resetDate: new Date() });
      setLoading(false);
    }
  }, [currentUser]);

  const value = {
    quota,
    loading,
    useInterview,
    refreshQuota
  };

  return (
    <InterviewQuotaContext.Provider value={value}>
      {children}
    </InterviewQuotaContext.Provider>
  );
};