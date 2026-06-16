"use client";

export type Tab = "blog" | "challenge" | "monvelo";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

function TrophyIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? "fill-[#f5c000]" : "fill-gray-400"}`}>
      <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.28 5 8zm14 0c0 1.28-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? "fill-[#f5c000]" : "fill-gray-400"}`}>
      <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
    </svg>
  );
}

function BikeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? "fill-[#f5c000]" : "fill-gray-400"}`}>
      <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9 1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
    </svg>
  );
}

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ active: boolean }> }[] = [
  { id: "challenge", label: "Challenge", Icon: TrophyIcon },
  { id: "blog", label: "Blog", Icon: BookIcon },
  { id: "monvelo", label: "Mon Vélo", Icon: BikeIcon },
];

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="shrink-0 bg-white border-t border-gray-200">
      <div className="flex">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1"
          >
            <Icon active={activeTab === id} />
            <span
              className={`text-[10px] font-semibold leading-tight ${
                activeTab === id ? "text-[#f5c000]" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
