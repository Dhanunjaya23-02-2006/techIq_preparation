import { create } from 'zustand';

const useTestStore = create((set) => ({
  currentTest: null,
  attemptId: null,
  questions: [],
  answers: {},
  markedQuestions: new Set(),
  currentIndex: 0,
  timeLeft: 0,

  setTest: (data) => {
    const timeLimit = data.time_limit || data.test?.time_limit || 60;
    set({
      currentTest: data,
      attemptId: data.attempt_id,
      questions: data.questions || [],
      answers: {},
      markedQuestions: new Set(),
      currentIndex: 0,
      timeLeft: parseInt(timeLimit) * 60,
    });
  },

  selectAnswer: (questionId, option) => set((state) => ({
    answers: { ...state.answers, [questionId]: option },
  })),

  toggleMark: (questionId) => set((state) => {
    const marked = new Set(state.markedQuestions);
    if (marked.has(questionId)) {
      marked.delete(questionId);
    } else {
      marked.add(questionId);
    }
    return { markedQuestions: marked };
  }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  tick: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),

  reset: () => set({
    currentTest: null,
    attemptId: null,
    questions: [],
    answers: {},
    markedQuestions: new Set(),
    currentIndex: 0,
    timeLeft: 0,
  }),
}));

export default useTestStore;
