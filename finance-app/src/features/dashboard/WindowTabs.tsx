import { TIME_WINDOWS } from '../../lib/timeWindows';
import type { TimeWindow } from '../../types/market';

interface WindowTabsProps {
  value: TimeWindow;
  onChange: (next: TimeWindow) => void;
}

export function WindowTabs({ value, onChange }: WindowTabsProps) {
  return (
    <div className="tabs" role="group" aria-label="Time window">
      {TIME_WINDOWS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          className={`tabs__tab${entry.id === value ? ' tabs__tab--active' : ''}`}
          aria-pressed={entry.id === value}
          title={entry.description}
          onClick={() => onChange(entry.id)}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}
