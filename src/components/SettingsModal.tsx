import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { DEFAULT_SETTINGS, type TimerSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: TimerSettings;
  onClose: () => void;
  onSave: (nextSettings: TimerSettings) => void;
}

export function SettingsModal({ isOpen, settings, onClose, onSave }: SettingsModalProps) {
  const [draft, setDraft] = useState<TimerSettings>(settings);

  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      ...draft,
      focusMinutes: Math.max(1, Math.min(90, Math.round(draft.focusMinutes) || 25)),
      shortBreakMinutes: Math.max(1, Math.min(30, Math.round(draft.shortBreakMinutes) || 5)),
      longBreakMinutes: Math.max(1, Math.min(60, Math.round(draft.longBreakMinutes) || 15)),
      longBreakInterval: Math.max(2, Math.min(8, Math.round(draft.longBreakInterval) || 4)),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/65 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className="w-full max-w-md bg-white dark:bg-[#14171D] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2
            id="settings-modal-title"
            className="font-display text-lg font-semibold text-neutral-900 dark:text-white"
          >
            計時設定
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉設定"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* Duration Grid */}
          <div>
            <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-3">
              時長設定（分鐘）
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="block text-xs text-neutral-600 dark:text-neutral-300 mb-1.5">
                  專注時間
                </span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={draft.focusMinutes}
                  onChange={(e) => setDraft({ ...draft, focusMinutes: Number(e.target.value) })}
                  className="w-full min-h-[42px] px-3 bg-neutral-50 dark:bg-[#1B1F27] border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono-tabular text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
                />
              </label>

              <label className="block">
                <span className="block text-xs text-neutral-600 dark:text-neutral-300 mb-1.5">
                  短休息
                </span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={draft.shortBreakMinutes}
                  onChange={(e) =>
                    setDraft({ ...draft, shortBreakMinutes: Number(e.target.value) })
                  }
                  className="w-full min-h-[42px] px-3 bg-neutral-50 dark:bg-[#1B1F27] border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono-tabular text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
                />
              </label>

              <label className="block">
                <span className="block text-xs text-neutral-600 dark:text-neutral-300 mb-1.5">
                  長休息
                </span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={draft.longBreakMinutes}
                  onChange={(e) => setDraft({ ...draft, longBreakMinutes: Number(e.target.value) })}
                  className="w-full min-h-[42px] px-3 bg-neutral-50 dark:bg-[#1B1F27] border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono-tabular text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
                />
              </label>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-3.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="long-break-interval" className="text-sm text-neutral-700 dark:text-neutral-200">
                長休息間隔（顆番茄）
              </label>
              <input
                id="long-break-interval"
                type="number"
                min={2}
                max={8}
                value={draft.longBreakInterval}
                onChange={(e) => setDraft({ ...draft, longBreakInterval: Number(e.target.value) })}
                className="w-20 min-h-[38px] px-3 bg-neutral-50 dark:bg-[#1B1F27] border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono-tabular text-center text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
              />
            </div>

            <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[40px]">
              <span className="text-sm text-neutral-700 dark:text-neutral-200">
                自動開始休息倒數
              </span>
              <input
                type="checkbox"
                checked={draft.autoStartBreaks}
                onChange={(e) => setDraft({ ...draft, autoStartBreaks: e.target.checked })}
                className="w-4 h-4 accent-emerald-700 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[40px]">
              <span className="text-sm text-neutral-700 dark:text-neutral-200">
                休息結束後自動開始專注
              </span>
              <input
                type="checkbox"
                checked={draft.autoStartFocus}
                onChange={(e) => setDraft({ ...draft, autoStartFocus: e.target.checked })}
                className="w-4 h-4 accent-emerald-700 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer min-h-[40px]">
              <span className="text-sm text-neutral-700 dark:text-neutral-200">
                計時完成播放提示音
              </span>
              <input
                type="checkbox"
                checked={draft.soundEnabled}
                onChange={(e) => setDraft({ ...draft, soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-700 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setDraft(DEFAULT_SETTINGS)}
              className="min-h-[40px] px-3 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              恢復預設值
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors whitespace-nowrap"
              >
                取消
              </button>
              <button
                type="submit"
                className="min-h-[40px] px-5 py-2 text-sm font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl transition-colors whitespace-nowrap"
              >
                儲存設定
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
