
export interface Timer {
  id: number;
  title: string;
  description: string;
  isRunning: boolean;
  timeLeft: number; // in seconds
}
