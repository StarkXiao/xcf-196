export interface CountdownItem {
  id: string;
  title: string;
  targetDate: string;
  type: 'anniversary' | 'special_pact' | 'custom';
  icon: string;
  color: string;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  isToday: boolean;
  isNear: boolean;
  pactId?: string;
  atmosphere: 'romantic' | 'festive' | 'none';
  description?: string;
}

export interface AtmosphereStatus {
  active: boolean;
  type: 'romantic' | 'festive' | 'none';
  source: string;
  daysLeft: number;
  autoSwitch: boolean;
}
