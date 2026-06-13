'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useNowStore } from '@/zustand/now';
import { useHistoryStore } from '@/zustand/history';
import { getBestMove, AiDecision } from '@/ai/solver';

// shadcn/ui importlari
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, History, RotateCcw, Terminal, Brain, Pause } from "lucide-react";

export default function GamePage() {
  const { board, score, isGameOver, resetGame, move } = useNowStore();
  const { history, saveToHistory } = useHistoryStore();
  
  const touchStart = useRef({ x: 0, y: 0 });
  const lastClickTime = useRef<number>(0);

  // States
  const [isCheatOpen, setIsCheatOpen] = useState(false);
  const [cheatScore, setCheatScore] = useState('');
  const [isAiPlaying, setIsAiPlaying] = useState(false);
  const [aiLog, setAiLog] = useState<AiDecision | null>(null);

  // AI sikli (250ms daho tezligida)
  useEffect(() => {
    let aiInterval: NodeJS.Timeout;

    if (isAiPlaying && !isGameOver) {
      aiInterval = setInterval(() => {
        // To'g'ri fayl va funksiya nomiga moslandi
        const decision = getBestMove(board);
        setAiLog(decision);

        if (decision.bestMove) {
          move(decision.bestMove);
        } else {
          setIsAiPlaying(false);
        }
      }, 250);
    }

    return () => clearInterval(aiInterval);
  }, [isAiPlaying, board, isGameOver, move]);

  // 🔥 KLAVIATURA BOSHQARUVI (Kompyuter va Brauzer barqarorligi uchun)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // O'yin tugaganda yoki AI o'zi o'ynayotganda klaviaturani vaqtincha o'chiramiz
      if (isGameOver || isAiPlaying) return;

      const keys: Record<string, 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'> = {
        ArrowUp: 'UP', w: 'UP', W: 'UP',
        ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
        ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT'
      };

      if (e.key in keys) {
        e.preventDefault(); // Sahifa yuqori-pastga g'ildrab ketishini to'sadi
        move(keys[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, isGameOver, isAiPlaying]);

  // Yangi o'yin yoki cheat trigger
  const handleNewGameClick = () => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime.current;
    if (timeDiff < 300) { 
      setIsCheatOpen(true);
    } else {
      setIsAiPlaying(false);
      setAiLog(null);
      resetGame();
    }
    lastClickTime.current = currentTime;
  };

  useEffect(() => {
    if (isGameOver) {
      saveToHistory(score);
      setIsAiPlaying(false);
    }
  }, [isGameOver, score, saveToHistory]);

  // Mobil qurilmalar uchun Touch hodisalari
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAiPlaying) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isAiPlaying) return;
    const diffX = e.changedTouches[0].clientX - touchStart.current.x;
    const diffY = e.changedTouches[0].clientY - touchStart.current.y;
    const min = 40;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > min) move(diffX > 0 ? 'RIGHT' : 'LEFT');
    } else {
      if (Math.abs(diffY) > min) move(diffY > 0 ? 'DOWN' : 'UP');
    }
  };

  const getTileStyle = (value: number) => {
    const base = "w-full h-full rounded-md flex items-center justify-center font-black text-lg transition-all duration-150 border-b-2";
    const styles: Record<number, string> = {
      2: `${base} bg-slate-100 text-slate-800 border-slate-200`,
      4: `${base} bg-slate-200 text-slate-800 border-slate-300`,
      8: `${base} bg-orange-200 text-orange-900 border-orange-300`,
      16: `${base} bg-orange-400 text-white border-orange-500`,
      32: `${base} bg-orange-500 text-white border-orange-600`,
      64: `${base} bg-red-500 text-white border-red-600`,
      128: `${base} bg-yellow-400 text-white border-yellow-500 shadow-sm`,
      256: `${base} bg-yellow-500 text-white border-yellow-600 shadow-sm`,
      512: `${base} bg-yellow-600 text-white border-yellow-700 shadow-sm`,
      1024: `${base} bg-emerald-500 text-white border-emerald-600 shadow-sm`,
      2048: `${base} bg-emerald-600 text-white border-emerald-700 shadow-sm`,
      
      // Cyberpunk dizayndagi yangi yirik rekordlar uchun ranglar master-klass
      4096: `${base} bg-cyan-500 text-white border-cyan-600 shadow-md shadow-cyan-500/20 animate-pulse`,
      8192: `${base} bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/30`,
      16384: `${base} bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-600/40`,
      32768: `${base} bg-purple-600 text-white border-purple-700 shadow-lg shadow-purple-600/40`,
      65536: `${base} bg-pink-600 text-white border-pink-700 shadow-xl shadow-pink-600/50`,
      131072: `${base} bg-slate-950 text-amber-400 border-amber-500 shadow-2xl ring-2 ring-amber-400/50 animate-bounce`
    };
    return styles[value] || `${base} bg-slate-300/30 text-transparent border-transparent`;
  };

  return (
    // Eng yuqori konteynerdagi touch-none olib tashlandi, elementlar endi to'liq bosiluvchan!
    <div className="fixed inset-0 w-screen h-screen bg-slate-50 flex flex-col items-center justify-between p-2 font-sans select-none overflow-hidden overscroll-none">
      
      {/* 1. HEADER SECTION */}
      <div className="w-full max-w-[320px] flex items-center justify-between mt-0.5">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">2048</h1>
          <p className="text-slate-400 font-bold ml-0.5 uppercase text-[9px] tracking-widest">Next.js AI</p>
        </div>
        
        <Card className="bg-slate-800 border-none shadow-sm">
          <CardContent className="p-1.5 px-3 text-center">
            <p className="text-[8px] uppercase font-bold text-slate-400 tracking-widest mb-0.5 flex items-center justify-center gap-1">
              <Trophy size={8} /> Score
            </p>
            <p className="text-base font-black text-white leading-none">{score}</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. CONTROLS */}
      <div className="w-full max-w-[320px] flex gap-2">
        <Button onClick={handleNewGameClick} variant="outline" className="flex-1 h-8 border-2 border-slate-200 rounded-lg font-bold text-[11px] gap-1 hover:bg-slate-100 transition-all">
          <RotateCcw size={12} /> New Game
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" className="flex-1 h-8 rounded-lg font-bold text-[11px] gap-1 transition-all">
              <History size={12} /> History
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2">
                <History className="text-slate-500" /> Game History
              </DialogTitle>
            </DialogHeader>
            <div className="mt-1 max-h-[220px] overflow-auto rounded-xl border">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-xs py-1.5">Score</TableHead>
                    <TableHead className="text-right font-bold text-xs py-1.5">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length > 0 ? history.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-black text-orange-600 py-1.5 text-xs">{item.score}</TableCell>
                      <TableCell className="text-right text-[9px] text-slate-500 py-1.5">{item.date}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4 text-sm text-slate-400">No records yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 3. GAME BOARD (Inline style yordamida pointer hodisalari muvozanatlandi) */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
        className="relative w-full max-w-[310px] aspect-square bg-slate-300 rounded-[1.2rem] p-1.5 shadow-md border-2 border-slate-300 ring-2 ring-slate-200/30 overscroll-none"
      >
        <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-1.5">
          {board.map((row, r) => 
            row.map((cell, c) => (
              <div key={`${r}-${c}`} className={getTileStyle(cell)}>
                {cell !== 0 ? cell : ''}
              </div>
            ))
          )}
        </div>

        {isGameOver && (
          <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-sm rounded-[1rem] flex flex-col items-center justify-center p-4 text-center">
            <h2 className="text-xl font-black text-white mb-2">Game Over</h2>
            <Button onClick={resetGame} size="sm" className="w-full max-w-[160px] bg-orange-500 text-white font-bold h-9 rounded-lg shadow-sm">
              Play Again
            </Button>
          </div>
        )}
      </div>

      {/* 4. JOYSTIK PANEL */}
      <div className="w-full max-w-[320px] flex items-center justify-center bg-transparent">
        <div className="relative w-28 h-28 flex items-center justify-center bg-slate-100/60 border border-slate-200 rounded-full shadow-inner">
          
          {/* TEPAGA */}
          <div className={`absolute top-1 w-7 h-7 rounded-md border flex items-center justify-center text-xs font-black transition-all ${
            isAiPlaying && aiLog?.bestMove === 'UP' 
              ? 'bg-purple-600 border-purple-700 text-white shadow-sm scale-105' 
              : 'bg-white border-slate-200 text-slate-300'
          }`}>
            ▲
          </div>

          {/* CHAPGA */}
          <div className={`absolute left-1 w-7 h-7 rounded-md border flex items-center justify-center text-xs font-black transition-all ${
            isAiPlaying && aiLog?.bestMove === 'LEFT' 
              ? 'bg-purple-600 border-purple-700 text-white shadow-sm scale-105' 
              : 'bg-white border-slate-200 text-slate-300'
          }`}>
            ◀
          </div>

          {/* CENTRE AI ACTIVATOR BUTTON */}
          <Button
            onClick={() => {
              setIsAiPlaying(!isAiPlaying);
              if(!isAiPlaying) setAiLog(null);
            }}
            size="icon"
            className={`w-10 h-10 rounded-full border transition-all z-10 shadow-sm active:scale-90 ${
              isAiPlaying 
                ? 'bg-red-500 hover:bg-red-600 border-red-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 border-purple-700 text-white'
            }`}
          >
            {isAiPlaying ? <Pause size={14} /> : <Brain size={14} className="animate-pulse" />}
          </Button>

          {/* O'NGGA */}
          <div className={`absolute right-1 w-7 h-7 rounded-md border flex items-center justify-center text-xs font-black transition-all ${
            isAiPlaying && aiLog?.bestMove === 'RIGHT' 
              ? 'bg-purple-600 border-purple-700 text-white shadow-sm scale-105' 
              : 'bg-white border-slate-200 text-slate-300'
          }`}>
            ▶
          </div>

          {/* PASTGA */}
          <div className={`absolute bottom-1 w-7 h-7 rounded-md border flex items-center justify-center text-xs font-black transition-all ${
            isAiPlaying && aiLog?.bestMove === 'DOWN' 
              ? 'bg-purple-600 border-purple-700 text-white shadow-sm scale-105' 
              : 'bg-white border-slate-200 text-slate-300'
          }`}>
            ▼
          </div>

        </div>
      </div>

      {/* 5. FOOTER CREDITS */}
      <div className="text-[9px] text-slate-400 font-bold mb-1 tracking-wider">
        📅 2026 Next.js Edition • Created by <span className="text-slate-600 font-extrabold underline decoration-purple-400">Ozod Tirkachev</span>
      </div>

      {/* YASHIRIN CHEAT DIALOG */}
      <Dialog open={isCheatOpen} onOpenChange={setIsCheatOpen}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl border-2 border-slate-800 bg-slate-950 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-red-500 animate-pulse">
              <Terminal size={18} /> Developer Cheat Menu
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const parsed = parseInt(cheatScore);
            if (!isNaN(parsed) && parsed > 0) { saveToHistory(parsed); setCheatScore(''); setIsCheatOpen(false); }
          }} className="space-y-4 mt-2">
            <Input type="number" placeholder="Masalan: 65536" value={cheatScore} onChange={(e) => setCheatScore(e.target.value)} className="bg-slate-900 border-slate-800 text-white font-black text-lg h-12 rounded-xl" autoFocus />
            <Button type="submit" className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 font-bold transition-all">Inject Score 🚀</Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}