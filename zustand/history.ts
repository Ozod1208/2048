import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface historyType {
  history: { score: number; date: string }[];
  // Funksiyaga score tashqaridan kirib kelishi shart
  saveToHistory: (currentScore: number) => void; 
}

export const useHistoryStore = create<historyType>()(
  persist(
    (set, get) => ({
      history: [],
      
      saveToHistory: (currentScore) => {
        const { history } = get();
        
        if (currentScore === 0) return; // Nol ballni saqlamaymiz
        
        const newEntry = { 
          score: currentScore, 
          date: new Date().toLocaleString() 
        };
        
        // Yangi natijani ro'yxat boshiga qo'shib, faqat oxirgi 10 tasini qoldiramiz
        set({ history: [newEntry, ...history].slice(0, 10) }); 
      },
    }), 
    { name: '2048-history' }
  )
);