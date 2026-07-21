import { create } from 'zustand';

interface StoreState {
  cursorPosition: { x: number; y: number };
  setCursorPosition: (x: number, y: number) => void;
  hovering: boolean;
  setHovering: (hovering: boolean) => void;
  cursorVariant: 'default' | 'button' | 'card' | 'input';
  setCursorVariant: (variant: 'default' | 'button' | 'card' | 'input') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  cursorPosition: { x: -100, y: -100 },
  setCursorPosition: (x, y) => set({ cursorPosition: { x, y } }),
  hovering: false,
  setHovering: (hovering) => set({ hovering }),
  cursorVariant: 'default',
  setCursorVariant: (cursorVariant) => set({ cursorVariant }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen })
}));
