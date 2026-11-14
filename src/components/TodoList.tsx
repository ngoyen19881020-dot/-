import { useState, useRef, type FormEvent } from 'react';
import { Check, Pencil, Plus, Target, Trash2, X } from 'lucide-react';
import type { TaskFilter, TaskItem } from '../types';

interface TodoListProps {
  tasks: TaskItem[];
  activeTaskId: string | null;
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onAddTask: (title: string, estimatedPomodoros: number) => void;
  onToggleTask: (id: string) => void;
  onUpdateTask: (id: string, title: string, estimatedPomodoros: number) => void;
  onDeleteTask: (id: string) => void;
  onSelectActiveTask: (id: string | null) => void;
  onClearCompleted: () => void;
}

const FILTER_LABELS: Record<TaskFilter, string> = {
  all: '全部',
  active: '待完成',
  completed: '已完成',
};

export function TodoList({
  tasks,
  activeTaskId,
  filter,
  onFilterChange,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onSelectActiveTask,
  onClearCompleted,
}: TodoListProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newEstimate, setNewEstimate] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEstimate, setEditEstimate] = useState(1);

  const inputRef = useRef<HTMLInputElement>(null);

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.length - activeCount;

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAddTask(trimmed, newEstimate);
    setNewTitle('');
    setNewEstimate(1);
  };

  const startEditing = (task: TaskItem) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditEstimate(task.estimatedPomodoros);
  };

  const saveEdit = (id: string) => {
    const trimmed = editTitle.trim();
    if (trimmed) {
      onUpdateTask(id, trimmed, editEstimate);
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <section
      aria-label="待辦事項清單"
      className="flex-1 bg-white dark:bg-[#14171D] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 flex flex-col min-h-[540px]"
    >
      {/* Header & Metadata */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800/80">
        <div>
          <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-white tracking-tight">
            待辦事項
          </h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
            {activeCount} 項待完成 · {completedCount} 項已完成
          </p>
        </div>

        {/* Segmented Filter */}
        <div
          role="tablist"
          aria-label="篩選待辦事項"
          className="inline-flex items-center gap-1 p-1 bg-neutral-100 dark:bg-[#1C2028] rounded-lg"
        >
          {(['all', 'active', 'completed'] as TaskFilter[]).map((key) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onFilterChange(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200 ${
                  isActive
                    ? 'bg-white dark:bg-[#262B35] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {FILTER_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1 flex items-center bg-neutral-50 dark:bg-[#1B1F27] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 focus-within:border-neutral-400 dark:focus-within:border-neutral-600 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="新增待辦事項，按 Enter 加入..."
            aria-label="待辦事項內容"
            maxLength={120}
            className="w-full min-h-[42px] bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none"
          />
          <div
            className="flex items-center gap-1.5 pl-2 border-l border-neutral-200 dark:border-neutral-700 shrink-0"
            title="預估所需番茄鐘數"
          >
            <label htmlFor="new-task-estimate" className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
              預估
            </label>
            <select
              id="new-task-estimate"
              value={newEstimate}
              onChange={(e) => setNewEstimate(Number(e.target.value))}
              aria-label="預估番茄數"
              className="bg-transparent text-xs font-medium tabular-nums text-neutral-700 dark:text-neutral-300 py-1 pr-1 focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n} className="bg-white dark:bg-[#1C2028] text-neutral-900 dark:text-white">
                  {n} 顆
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200"
        >
          <Plus className="w-4 h-4" />
          <span>新增</span>
        </button>
      </form>

      {/* Task List */}
      <div className="mt-5 flex-1 flex flex-col">
        {filteredTasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              {tasks.length === 0
                ? '目前還沒有待辦事項'
                : filter === 'active'
                ? '所有待辦事項皆已完成'
                : '目前沒有已完成的事項'}
            </p>
            <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 max-w-xs">
              {tasks.length === 0
                ? '寫下今天想完成的一件事，搭配番茄鐘保持節奏。'
                : '可切換上方篩選檢視其他任務。'}
            </p>
            {tasks.length === 0 && (
              <button
                type="button"
                onClick={() => inputRef.current?.focus()}
                className="mt-5 min-h-[40px] px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
              >
                新增第一個任務
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {filteredTasks.map((task) => {
              const isSelected = task.id === activeTaskId;
              const isEditing = task.id === editingId;

              return (
                <li
                  key={task.id}
                  className={`group py-3 px-2 -mx-2 rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/25'
                      : 'hover:bg-neutral-50/80 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(task.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        aria-label="編輯任務名稱"
                        className="flex-1 min-h-[38px] px-3 bg-white dark:bg-[#1B1F27] border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500"
                      />
                      <select
                        value={editEstimate}
                        onChange={(e) => setEditEstimate(Number(e.target.value))}
                        aria-label="編輯預估番茄數"
                        className="min-h-[38px] px-2 bg-white dark:bg-[#1B1F27] border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs tabular-nums text-neutral-700 dark:text-neutral-200 focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                          <option key={n} value={n}>
                            {n} 顆
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => saveEdit(task.id)}
                        aria-label="儲存修改"
                        className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        aria-label="取消編輯"
                        className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      {/* Checkbox */}
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={task.completed}
                        aria-label={`標記「${task.title}」為${task.completed ? '未完成' : '已完成'}`}
                        onClick={() => onToggleTask(task.id)}
                        className="w-9 h-9 -ml-1 flex items-center justify-center shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200"
                      >
                        <span
                          className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center transition-colors ${
                            task.completed
                              ? 'bg-emerald-700 border-emerald-700 dark:bg-emerald-600 dark:border-emerald-600 text-white'
                              : 'border-neutral-300 dark:border-neutral-600 group-hover:border-neutral-500 dark:group-hover:border-neutral-400'
                          }`}
                        >
                          {task.completed && <Check className="w-3 h-3 stroke-[2.5]" />}
                        </span>
                      </button>

                      {/* Title & Unboxed Metadata */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!task.completed) {
                            onSelectActiveTask(isSelected ? null : task.id);
                          }
                        }}
                        className="flex-1 min-w-0 text-left py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200 rounded"
                      >
                        <span
                          className={`block text-sm leading-snug truncate ${
                            task.completed
                              ? 'line-through text-neutral-400 dark:text-neutral-500'
                              : isSelected
                              ? 'font-medium text-emerald-900 dark:text-emerald-300'
                              : 'text-neutral-800 dark:text-neutral-100'
                          }`}
                        >
                          {task.title}
                        </span>
                      </button>

                      {/* Unboxed Tabular Tomato Count & Active Text */}
                      <div className="flex items-center gap-2.5 shrink-0 text-xs tabular-nums text-neutral-400 dark:text-neutral-500">
                        {isSelected && !task.completed && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium whitespace-nowrap">
                            專注中
                          </span>
                        )}
                        <span
                          title={`已完成 ${task.completedPomodoros} 顆 / 預估 ${task.estimatedPomodoros} 顆番茄`}
                          className="whitespace-nowrap"
                        >
                          {task.completedPomodoros}/{task.estimatedPomodoros} 顆
                        </span>
                      </div>

                      {/* Row Actions */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {!task.completed && (
                          <button
                            type="button"
                            onClick={() => onSelectActiveTask(isSelected ? null : task.id)}
                            title={isSelected ? '取消專注此任務' : '設為目前專注任務'}
                            aria-label={isSelected ? '取消專注此任務' : '設為目前專注任務'}
                            className={`w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200 ${
                              isSelected
                                ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40'
                                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'
                            }`}
                          >
                            <Target className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditing(task)}
                          title="編輯任務"
                          aria-label={`編輯「${task.title}」`}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          title="刪除任務"
                          aria-label={`刪除「${task.title}」`}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer Actions when completed items exist */}
      {completedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>點擊任務文字可切換為目前專注目標</span>
          <button
            type="button"
            onClick={onClearCompleted}
            className="py-1 px-2 -mr-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-200 rounded"
          >
            清除已完成 ({completedCount})
          </button>
        </div>
      )}
    </section>
  );
}
