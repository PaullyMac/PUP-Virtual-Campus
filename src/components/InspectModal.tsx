import React from 'react';
import { X, Monitor, Landmark, ClipboardList, BookOpen } from 'lucide-react';
import { InspectableItem } from '../campus/campusData';

interface InspectModalProps {
  item: InspectableItem;
  onClose: () => void;
}

export const InspectModal: React.FC<InspectModalProps> = ({ item, onClose }) => {
  const Icon =
    item.kind === 'computer'
      ? Monitor
      : item.kind === 'plaque'
        ? Landmark
        : item.kind === 'desk'
          ? BookOpen
          : ClipboardList;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(12, 9, 10, 0.72)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspect-modal-title"
    >
      <div className="w-full max-w-xl rounded-xl bg-[#181314] border border-[#e5a91a]/35 shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-5 bg-[#23191a] border-b border-white/10">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#7b1113] text-[#e5a91a] shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="inspect-modal-title"
                className="font-display text-xl font-semibold text-[#f5f2eb]"
              >
                {item.title}
              </h2>
              <p className="mt-0.5 text-xs text-[#d6ccbc]">{item.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspection view"
            className="p-2 rounded-lg text-[#d6ccbc] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto campus-scroll">
          {item.body.map((paragraph, idx) => (
            <p key={idx} className="text-sm leading-relaxed text-[#ece5d9]">
              {paragraph}
            </p>
          ))}
          {item.verificationNote && (
            <div className="pt-3 border-t border-white/10 text-xs text-[#c7baa6]">
              Reference Note: {item.verificationNote}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-[#141011] border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#7b1113] hover:bg-[#961619] text-sm font-medium text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    </div>
  );
};
