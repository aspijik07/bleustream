import React from 'react';

interface LockerModalProps {
  mediaId?: number;
  onUnlocked?: () => void;
}

// Neutralized Locker Modal - Prevents any verification modal or popup from ever mounting
export const LockerModal: React.FC<LockerModalProps> = () => {
  return null;
};
