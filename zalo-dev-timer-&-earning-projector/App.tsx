import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Timer } from './types';
import { INITIAL_TIME_SECONDS, RATE_PER_MINUTE_VND, TIMER_CONFIGS } from './constants';
import TimerCard from './components/TimerCard';

const App: React.FC = () => {
  const [timers, setTimers] = useState<Timer[]>(() =>
    TIMER_CONFIGS.map(config => ({
      ...config,
      isRunning: false,
      timeLeft: INITIAL_TIME_SECONDS,
    }))
  );
  
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
  const [years, setYears] = useState<number>(15);
  const [dailyRate, setDailyRate] = useState<number>(0.5);
  const [projectedValue, setProjectedValue] = useState<string | null>(null);
  
  const isAnyTimerRunning = useMemo(() => timers.some(t => t.isRunning), [timers]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isAnyTimerRunning) {
      interval = setInterval(() => {
        setTimers(prevTimers =>
          prevTimers.map(timer => {
            if (timer.isRunning && timer.timeLeft > 0) {
              return { ...timer, timeLeft: timer.timeLeft - 1 };
            }
            if (timer.isRunning && timer.timeLeft === 0) {
              return { ...timer, isRunning: false }; // Auto-stop at 0
            }
            return timer;
          })
        );
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnyTimerRunning]);

  const handleToggleTimer = useCallback((id: number) => {
    setTimers(prevTimers =>
      prevTimers.map(timer =>
        timer.id === id ? { ...timer, isRunning: !timer.isRunning } : timer
      )
    );
    setTotalEarnings(null);
    setProjectedValue(null);
  }, []);

  const handleStopAndCalculate = () => {
    setTimers(prevTimers => prevTimers.map(t => ({ ...t, isRunning: false })));
    
    const totalSecondsElapsed = timers.reduce((acc, timer) => {
      return acc + (INITIAL_TIME_SECONDS - timer.timeLeft);
    }, 0);
    
    const totalMinutesElapsed = totalSecondsElapsed / 60;
    const earnings = totalMinutesElapsed * RATE_PER_MINUTE_VND;
    setTotalEarnings(earnings);
  };
  
  const handleCalculateProjection = () => {
    if (totalEarnings === null || totalEarnings <= 0) return;

    try {
      const P = totalEarnings;
      const r_percent = dailyRate;
      const n_days = years * 365;

      // Use BigInt for high-precision calculation of FV = P * [((1 + r)^n - 1) / r]
      if (r_percent === 0 || n_days === 0) {
        const A = BigInt(Math.round(P)) * BigInt(n_days);
        setProjectedValue(A.toString());
        return;
      }
      
      const precision = 100000000; // 8 decimal places for precision
      const precisionBig = BigInt(precision);

      const P_scaled = BigInt(Math.round(P * 100)); // Use cents for principal
      const r_scaled = BigInt(Math.round(r_percent * precision / 100));

      if (r_scaled === 0n) {
          const A = BigInt(Math.round(P)) * BigInt(n_days);
          setProjectedValue(A.toString());
          return;
      }
      
      const n_big = BigInt(n_days);
      const term_num = precisionBig + r_scaled;
      
      // Calculate (term_num/precisionBig)^n_big
      const term_num_pow_n = term_num ** n_big;
      const term_den_pow_n = precisionBig ** n_big;
      
      // FV = P * [ (term_num_pow_n/term_den_pow_n - 1) / (r_scaled / precisionBig) ]
      // To avoid division until the end, rearrange:
      const numerator_part_1 = term_num_pow_n - term_den_pow_n;
      const final_numerator = P_scaled * numerator_part_1 * precisionBig;
      const final_denominator = 100n * term_den_pow_n * r_scaled;

      const final_A = final_numerator / final_denominator;
      setProjectedValue(final_A.toString());

    } catch (e) {
      console.error("Calculation Error:", e);
      setProjectedValue("Error in calculation");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };
  
  const formatBigIntCurrency = (value: string): string => {
    if (!value || isNaN(Number(value))) return '0 ₫';
    // Add thousand separators (dot for Vietnamese style)
    const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted} ₫`;
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-400">Zalo Development Productivity</h1>
          <p className="mt-2 text-lg text-slate-400">Maximize Your Efforts, Project Your Success</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {timers.map(timer => (
            <TimerCard key={timer.id} timer={timer} onToggle={handleToggleTimer} />
          ))}
        </div>
        
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 border-2 border-slate-700 mb-8">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Master Control</h2>
            <button
              onClick={handleStopAndCalculate}
              disabled={!isAnyTimerRunning && totalEarnings === null}
              className="px-8 py-4 text-xl font-bold text-white bg-amber-600 rounded-lg shadow-md hover:bg-amber-700 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-400"
            >
              Stop All & Calculate Earnings
            </button>
          </div>
        </div>
        
        {totalEarnings !== null && (
          <div className="bg-slate-800 rounded-xl shadow-lg p-6 border-2 border-amber-500/50">
            <h2 className="text-3xl font-bold text-center text-amber-400 mb-6">Financial Projection</h2>
             <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3 flex-shrink-0">
                    <img src="https://i.postimg.cc/W4TZrH1L/camel-dubai.png" alt="Motivational" className="rounded-lg shadow-2xl w-full h-auto object-cover" />
                </div>
                <div className="w-full md:w-2/3">
                    <div className="text-center mb-6">
                      <p className="text-slate-400 text-lg">Total Earnings From This Session:</p>
                      <p className="text-4xl font-bold text-green-400 mt-2">{formatCurrency(totalEarnings)}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
                      <div>
                        <label htmlFor="years" className="block mb-2 font-semibold text-slate-300 text-sm">Investment Duration (Years)</label>
                        <input
                          type="number"
                          id="years"
                          value={years}
                          onChange={e => setYears(Number(e.target.value))}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                       <div>
                        <label htmlFor="dailyRate" className="block mb-2 font-semibold text-slate-300 text-sm">Daily Compound Interest (%)</label>
                        <input
                          type="number"
                          id="dailyRate"
                          value={dailyRate}
                          onChange={e => setDailyRate(Number(e.target.value))}
                          step="0.001"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                      <button 
                        onClick={handleCalculateProjection}
                        className="w-full h-12 px-6 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                      >
                        Project Future Value
                      </button>
                    </div>

                    {projectedValue !== null && (
                      <div className="mt-6 text-center bg-slate-900/50 p-6 rounded-lg">
                        <p className="text-lg text-slate-400">If you earn this amount daily for {years} years with a {dailyRate}% daily interest:</p>
                        <p className="text-5xl font-extrabold text-amber-300 mt-3 break-words">{formatBigIntCurrency(projectedValue)}</p>
                      </div>
                    )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
