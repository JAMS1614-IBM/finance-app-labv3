import { TIME_WINDOWS } from '../../config/companies';
import type { TimeWindow } from '../../domain/types';

export function WindowTabs({ active, onChange }: { active: TimeWindow; onChange: (w: TimeWindow) => void }) {
  return (
    <div role="tablist" aria-label="Time window" className="tabs">
      {TIME_WINDOWS.map((w) => (
        <button
          key={w.id}
          role="tab"
          type="button"
          aria-selected={w.id === active}
          className={w.id === active ? 'tab tab-active' : 'tab'}
          onClick={() => onChange(w.id)}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
