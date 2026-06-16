export interface MonthlyReviewData {
  year: number;
  month: number;
  pactCompletionRate: number;
  totalPacts: number;
  completedPacts: number;
  activePacts: number;
  moodDistribution: {
    happy: number;
    normal: number;
    tired: number;
    excited: number;
    grateful: number;
  };
  topMood: string;
  totalCheckins: number;
  normalCheckins: number;
  makeupCheckins: number;
  keyEvents: {
    id: string;
    date: string;
    type: string;
    title: string;
    description: string;
    icon: string;
  }[];
  reminderStats: {
    total: number;
    active: number;
    byType: {
      pact: number;
      anniversary: number;
      custom: number;
    };
    responseRate: number;
  };
  growthPoints: number;
  longestStreak: number;
  bestPact: {
    id: string;
    title: string;
    icon: string;
    color: string;
    streak: number;
    checkins: number;
  } | null;
}
