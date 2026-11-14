import { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, SlidersHorizontal, Sun, Volume2, VolumeX } from 'lucide-react';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TodoList } from './components/TodoList';
import { SettingsModal } from './components/SettingsModal';
import {
  DEFAULT_SETTINGS,
  getTodayKey,
  type DailyStats,
  type TaskFilter,
  type TaskItem,
  type TimerMode,
  type TimerSettings,
} from './types';
import { playCompletionChime } from './utils/sound';

const STORAGE_KEYS = {
  tasks: 'kanso_tasks_v1',
  activeTaskId: 'kanso_active_task_v1',
  settings: 'kanso_settings_v1',
  stats: 'kanso_daily_stats_v1',
  theme: 'kanso_theme_v1',
};

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'starter-1',
    title: '整理今日最重要的三項工作',
    completed: false,
    estimatedPomodoros: 1,
    completedPomodoros: 0,
    createdAt: Date.now() - 2000,
  },
  {
    id: 'starter-2',
    title: '深度專注處理核心任務',
    completed: false,
    estimatedPomodoros: 2,
    completedPomodoros: 0,
    createdAt: Date.now() - 1000,
  },
];

function getDurationForMode(mode: TimerMode, settings: TimerSettings): number {
  if (mode === 'focus') return settings.focusMinutes * 60;
  if (mode === 'shortBreak') return settings.shortBreakMinutes * 60;
  return settings.longBreakMinutes * 60;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [settings, setSettings] = useState<TimerSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...loadJSON<Partial<TimerSettings>>(STORAGE_KEYS.settings, {}),
  }));

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.tasks);
      if (raw === null) return INITIAL_TASKS;
      return JSON.parse(raw) as TaskItem[];
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [activeTaskId, setActiveTaskId] = useState<string | null>(() =>
    loadJSON<string | null>(STORAGE_KEYS.activeTaskId, 'starter-1')
  );

  const [stats, setStats] = useState<DailyStats>(() => {
    const today = getTodayKey();
    const saved = loadJSON<DailyStats | null>(STORAGE_KEYS.stats, null);
    if (saved && saved.date === today) return saved;
    return { date: today, completedPomodoros: 0, focusMinutes: 0 };
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  const [mode, setMode] = useState<TimerMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    getDurationForMode('focus', {
      ...DEFAULT_SETTINGS,
      ...loadJSON<Partial<TimerSettings>>(STORAGE_KEYS.settings, {}),
    })
  );
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);

  const targetEndTimeRef = useRef<number | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);

  // Sync theme class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
  }, [isDark]);

  // Persist tasks, settings, stats, activeTaskId
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeTaskId, JSON.stringify(activeTaskId));
  }, [activeTaskId]);

  // Keep activeTaskId valid if task was deleted or completed
  useEffect(() => {
    if (activeTaskId && !tasks.some((t) => t.id === activeTaskId && !t.completed)) {
      setActiveTaskId(null);
    }
  }, [tasks, activeTaskId]);

  // Update browser tab title when timer is active
  useEffect(() => {
    const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const secs = String(secondsLeft % 60).padStart(2, '0');
    if (isRunning) {
      const label = mode === 'focus' ? '專注中' : mode === 'shortBreak' ? '短休息' : '長休息';
      document.title = `${mins}:${secs} · ${label} — 靜刻`;
    } else {
      document.title = '靜刻 Kanso — 極簡番茄鐘與待辦事項';
    }
  }, [secondsLeft, isRunning, mode]);

  const showNotice = useCallback((message: string) => {
    setCompletionNotice(message);
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }
    noticeTimeoutRef.current = window.setTimeout(() => {
      setCompletionNotice(null);
    }, 5000);
  }, []);

  const handleSessionComplete = useCallback(
    (skipped = false) => {
      if (!skipped && settings.soundEnabled) {
        playCompletionChime(mode === 'focus' ? 'focus' : 'break');
      }

      if (mode === 'focus') {
        const nextCycleCount = skipped ? cycleCount : cycleCount + 1;

        if (!skipped) {
          const today = getTodayKey();
          setStats((prev) => ({
            date: today,
            completedPomodoros: (prev.date === today ? prev.completedPomodoros : 0) + 1,
            focusMinutes:
              (prev.date === today ? prev.focusMinutes : 0) + settings.focusMinutes,
          }));

          if (activeTaskId) {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === activeTaskId
                  ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
                  : task
              )
            );
          }

          setCycleCount(nextCycleCount);
          showNotice('已完成一顆番茄專注，進入休息時間。');
        }

        const nextMode: TimerMode =
          nextCycleCount > 0 && nextCycleCount % settings.longBreakInterval === 0
            ? 'longBreak'
            : 'shortBreak';
        const nextDuration = getDurationForMode(nextMode, settings);

        setMode(nextMode);
        setSecondsLeft(nextDuration);
        if (!skipped && settings.autoStartBreaks) {
          targetEndTimeRef.current = Date.now() + nextDuration * 1000;
          setIsRunning(true);
        } else {
          targetEndTimeRef.current = null;
          setIsRunning(false);
        }
      } else {
        if (!skipped) {
          showNotice('休息結束，準備開始下一段專注。');
        }
        const nextDuration = getDurationForMode('focus', settings);
        setMode('focus');
        setSecondsLeft(nextDuration);
        if (!skipped && settings.autoStartFocus) {
          targetEndTimeRef.current = Date.now() + nextDuration * 1000;
          setIsRunning(true);
        } else {
          targetEndTimeRef.current = null;
          setIsRunning(false);
        }
      }
    },
    [mode, settings, cycleCount, activeTaskId, showNotice]
  );

  // Accurate wall-clock countdown loop
  useEffect(() => {
    if (!isRunning) {
      targetEndTimeRef.current = null;
      return;
    }

    if (targetEndTimeRef.current === null) {
      targetEndTimeRef.current = Date.now() + secondsLeft * 1000;
    }

    const intervalId = window.setInterval(() => {
      if (targetEndTimeRef.current === null) return;
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(intervalId);
        targetEndTimeRef.current = null;
        handleSessionComplete(false);
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [isRunning, handleSessionComplete, secondsLeft]);

  const handleToggleRun = useCallback(() => {
    setIsRunning((prev) => {
      if (!prev) {
        targetEndTimeRef.current = Date.now() + secondsLeft * 1000;
        return true;
      }
      targetEndTimeRef.current = null;
      return false;
    });
  }, [secondsLeft]);

  const handleModeChange = (nextMode: TimerMode) => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setMode(nextMode);
    setSecondsLeft(getDurationForMode(nextMode, settings));
  };

  const handleReset = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setSecondsLeft(getDurationForMode(mode, settings));
  };

  const handleSkip = () => {
    targetEndTimeRef.current = null;
    handleSessionComplete(true);
  };

  const handleSaveSettings = (nextSettings: TimerSettings) => {
    setSettings(nextSettings);
    if (!isRunning) {
      setSecondsLeft(getDurationForMode(mode, nextSettings));
    }
  };

  // Global Space shortcut for Play/Pause when not typing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isSettingsOpen) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        tagName === 'button' ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      handleToggleRun();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleToggleRun, isSettingsOpen]);

  // Task handlers
  const handleAddTask = (title: string, estimatedPomodoros: number) => {
    const newTask: TaskItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      completed: false,
      estimatedPomodoros,
      completedPomodoros: 0,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
    if (!activeTaskId) {
      setActiveTaskId(newTask.id);
    }
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const handleUpdateTask = (id: string, title: string, estimatedPomodoros: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, title, estimatedPomodoros } : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((task) => !task.completed));
  };

  const activeTask = tasks.find((t) => t.id === activeTaskId && !t.completed) ?? null;
  const totalSeconds = getDurationForMode(mode, settings);

  // Ensure daily stats reflect current day even across midnight
  const todayKey = getTodayKey();
  const displayStats =
    stats.date === todayKey ? stats : { date: todayKey, completedPomodoros: 0, focusMinutes: 0 };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-[#0C0E12]/80 backdrop-blur-sm">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => e.preventDefault()}
            className="font-display text-lg font-semibold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap shrink-0"
          >
            靜刻
          </a>

          {/* Zone 2: Quiet Today's Summary (unboxed metadata) */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums whitespace-nowrap">
            <span>今日完成 {displayStats.completedPomodoros} 顆番茄</span>
            <span aria-hidden="true">·</span>
            <span>{displayStats.focusMinutes} 分鐘專注</span>
          </div>

          {/* Zone 3: Minimal Utility Controls & Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
              }
              aria-label={settings.soundEnabled ? '關閉提示音' : '開啟提示音'}
              title={settings.soundEnabled ? '提示音：開啟' : '提示音：靜音'}
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200"
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? '切換至淺色模式' : '切換至深色模式'}
              title={isDark ? '切換至淺色模式' : '切換至深色模式'}
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#14171D] text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>設定</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-[1160px] mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col justify-center">
        {/* Mobile Daily Stats Row */}
        <div className="sm:hidden mb-4 flex items-center justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
          <span>今日完成 {displayStats.completedPomodoros} 顆番茄</span>
          <span aria-hidden="true">·</span>
          <span>{displayStats.focusMinutes} 分鐘專注</span>
        </div>

        {/* Non-blocking Session Completion Banner */}
        {completionNotice && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/30 text-sm text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-4"
          >
            <span>{completionNotice}</span>
            <button
              type="button"
              onClick={() => setCompletionNotice(null)}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline whitespace-nowrap shrink-0"
            >
              知道了
            </button>
          </div>
        )}

        {/* Two-Column Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col">
            <PomodoroTimer
              mode={mode}
              secondsLeft={secondsLeft}
              totalSeconds={totalSeconds}
              isRunning={isRunning}
              cycleCount={cycleCount}
              longBreakInterval={settings.longBreakInterval}
              activeTask={activeTask}
              onModeChange={handleModeChange}
              onToggleRun={handleToggleRun}
              onReset={handleReset}
              onSkip={handleSkip}
              onClearActiveTask={() => setActiveTaskId(null)}
            />
          </div>

          <div className="lg:col-span-6 flex flex-col">
            <TodoList
              tasks={tasks}
              activeTaskId={activeTaskId}
              filter={filter}
              onFilterChange={setFilter}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onSelectActiveTask={setActiveTaskId}
              onClearCompleted={handleClearCompleted}
            />
          </div>
        </div>

        {/* Quiet Footer Hint */}
        <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
          按空白鍵可快速開始或暫停計時 · 所有任務與紀錄皆自動儲存在本機瀏覽器
        </p>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
