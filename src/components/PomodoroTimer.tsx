import { Play, Pause, RotateCcw, SkipForward, X } from 'lucide-react';
import type { TaskItem, TimerMode } from '../types';

interface PomodoroTimerProps {
  mode: TimerMode;
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  cycleCount: number;
  longBreakInterval: number;
  activeTask: TaskItem | null;
  onModeChange: (mode: TimerMode) => void;
  onToggleRun: () => void;
  onReset: () => void;
  onSkip: () => void;
  onClearActiveTask: () => void;
}

const MODE_LABELS: Record<TimerMode, string> = {
  focus: '專注',
  shortBreak: '短休息',
  longBreak: '長休息',
};

const MODE_SUBTITLES: Record<TimerMode, string> = {
  focus: '保持單一目標，排除干擾',
  shortBreak: '離開螢幕，伸展雙肩與眼睛',
  longBreak: '完整放鬆，準備下一組專注',
};

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function PomodoroTimer({
  mode,
  secondsLeft,
  totalSeconds,
  isRunning,
  cycleCount,
  longBreakInterval,
  activeTask,
  onModeChange,
  onToggleRun,
  onReset,
  onSkip,
  onClearActiveTask,
}: PomodoroTimerProps) {
  const radius = 122;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, 1 - secondsLeft / totalSeconds)) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const ringColorClass =
    mode === 'focus'
      ? 'stroke-emerald-700 dark:stroke-emerald-500'
      : mode === 'shortBreak'
      ? 'stroke-sky-700 dark:stroke-sky-400'
      : 'stroke-indigo-700 dark:stroke-indigo-400';

  const primaryBtnClass =
    mode === 'focus'
      ? 'bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
      : mode === 'shortBreak'
      ? 'bg-sky-800 hover:bg-sky-900 dark:bg-sky-600 dark:hover:bg-sky-500 text-white'
      : 'bg-indigo-800 hover:bg-indigo-900 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white';

  const currentRound = (cycleCount % longBreakInterval) + 1;

  return (
    <section
      aria-label="番茄鐘計時器"
      className="flex-1 bg-white dark:bg-[#14171D] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-between"
    >
      {/* Mode Segmented Control */}
      <div
        role="tablist"
        aria-label="計時模式"
        className="w-full max-w-sm grid grid-cols-3 gap-1 p-1 bg-neutral-100 dark:bg-[#1C2028] rounded-xl"
      >
        {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((itemMode) => {
          const isActive = mode === itemMode;
          return (
            <button
              key={itemMode}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onModeChange(itemMode)}
              className={`min-h-[40px] px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200 ${
                isActive
                  ? 'bg-white dark:bg-[#262B35] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {MODE_LABELS[itemMode]}
            </button>
          );
        })}
      </div>

      {/* Circular Timer Display */}
      <div className="my-8 sm:my-10 flex flex-col items-center">
        <div className="relative w-[272px] h-[272px] sm:w-[288px] sm:h-[288px] flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 280 280"
            aria-hidden="true"
          >
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              strokeWidth="4"
              className="stroke-neutral-100 dark:stroke-neutral-800/90"
            />
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${ringColorClass} transition-[stroke-dashoffset] duration-300 ease-out`}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <span className="text-xs font-medium tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              {MODE_LABELS[mode]}
            </span>
            <time
              aria-live="off"
              className="font-mono-tabular text-[3.5rem] sm:text-[4rem] leading-none font-medium tracking-tight text-neutral-900 dark:text-white select-none"
            >
              {formatTime(secondsLeft)}
            </time>
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 max-w-[190px] leading-relaxed">
              {MODE_SUBTITLES[mode]}
            </p>
          </div>
        </div>

        {/* Active Task Line */}
        <div className="mt-5 min-h-[32px] flex items-center justify-center text-center max-w-full px-2">
          {activeTask ? (
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 max-w-xs sm:max-w-sm">
              <span className="text-neutral-400 dark:text-neutral-500 shrink-0">進行任務：</span>
              <span className="font-medium text-neutral-900 dark:text-white truncate">
                {activeTask.title}
              </span>
              <button
                type="button"
                onClick={onClearActiveTask}
                title="取消綁定任務"
                aria-label="取消綁定任務"
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              可從右側待辦清單選擇要專注的任務
            </p>
          )}
        </div>
      </div>

      {/* Timer Controls */}
      <div className="w-full flex flex-col items-center gap-6">
        <div className="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={onReset}
            aria-label="重設計時器"
            title="重設"
            className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-white transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleRun}
            className={`min-h-[44px] min-w-[148px] px-7 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200 dark:focus-visible:ring-offset-[#14171D] ${primaryBtnClass}`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>暫停</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{mode === 'focus' ? '開始專注' : '開始休息'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSkip}
            aria-label="跳過此段"
            title="跳過此段"
            className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-white transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Cycle Progress Row */}
        <div className="w-full pt-5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>
            循環進度 · <span className="tabular-nums text-neutral-700 dark:text-neutral-300 font-medium">第 {currentRound} / {longBreakInterval} 輪</span>
          </span>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: longBreakInterval }).map((_, index) => {
              const completedInCycle = cycleCount % longBreakInterval;
              const isFilled = index < completedInCycle;
              const isCurrent = index === completedInCycle && mode === 'focus';
              return (
                <span
                  key={index}
                  className={`h-1.5 rounded-sm transition-colors ${
                    isFilled
                      ? 'w-5 bg-emerald-700 dark:bg-emerald-500'
                      : isCurrent
                      ? 'w-5 bg-neutral-400 dark:bg-neutral-500'
                      : 'w-3 bg-neutral-200 dark:bg-neutral-800'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
