
import type { Timer } from './types';

export const INITIAL_TIME_SECONDS = 30 * 60; // 30 minutes
export const RATE_PER_MINUTE_VND = 10000;

export const TIMER_CONFIGS: Omit<Timer, 'isRunning' | 'timeLeft'>[] = [
  { id: 1, title: 'Zalo Group Messaging', description: 'Build an app for Zalo group messaging.' },
  { id: 2, title: 'Zalo Software Integration', description: 'Create an app using Zalo messaging software like Akbiz and Zinbox.' },
  { id: 3, title: 'Message Effectiveness Analysis', description: 'Develop an app to evaluate the effectiveness of Zalo messages.' },
  { id: 4, title: 'Zalo Group Finder', description: 'Design an app to find Zalo groups on social media platforms.' },
  { id: 5, title: 'Competitor Message Analysis', description: 'Build a tool to analyze competitors\' Zalo messages for insights.' },
  { id: 6, title: 'Zalo Account Creator', description: 'Create an app to manage the creation of 19 Zalo nicks.' },
];
