import { create } from 'zustand';

const useUIStore = create((set) => ({
  isChatOpen: false,
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
}));

export default useUIStore;
