import { create } from 'zustand';
import type { Goal } from '../models/types';
import * as dal from '../dal';

interface GoalState {
  goals: Goal[];

  load: () => void;
  addGoal: (data: Parameters<typeof dal.createGoal>[0]) => void;
  updateSaved: (id: string, saved: number) => void;
  removeGoal: (id: string) => void;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],

  load: () => {
    const goals = dal.getAllGoals();
    set({ goals });
  },

  addGoal: (data) => {
    dal.createGoal(data);
    get().load();
  },

  updateSaved: (id, saved) => {
    dal.updateGoalSaved(id, saved);
    get().load();
  },

  removeGoal: (id) => {
    dal.deleteGoal(id);
    get().load();
  },
}));
