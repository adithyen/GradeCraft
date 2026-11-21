'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Course, 
  Instance, 
  GradeLetter, 
  GRADE_POINTS, 
  GRADE_OPTIONS, 
  getGradeFromMarks, 
  calculateSemesterMetrics, 
  getClassification 
} from '@/lib/calculator';
import { KTU_2024_AIML_CURRICULUM, getDefaultInstances } from '@/data/ktu2024';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Copy, 
  RotateCcw, 
  Cloud, 
  GraduationCap, 
  ArrowRight,
  Zap,
  BarChart2
} from 'lucide-react';

export default function GradeCraftPage() {
  // --- STATE ---
  const [instances, setInstances] = useState<Record<string, Instance>>({});
  const [activeInstanceId, setActiveInstanceId] = useState<string>('medium');
  const [activeSem, setActiveSem] = useState<number>(5);
  
  // Default mode is 'grades' as requested
  const [inputMode, setInputMode] = useState<'grades' | 'marks'>('grades');
  
  // Predict up to semester (e.g. S1 to S5, or full S8)
  const [predictUpToSem, setPredictUpToSem] = useState<number>(5);
  
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudStatus, setCloudStatus] = useState<string>('Local (Synced)');
  
  // Modal states
  const [showNewInstanceModal, setShowNewInstanceModal] = useState<boolean>(false);
  const [newInstanceName, setNewInstanceName] = useState<string>('');
  const [targetCgpaInput, setTargetCgpaInput] = useState<string>('8.50');

  // 1. Initial Load from LocalStorage or Defaults
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gradecraft_instances_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        setInstances(parsed);
      } else {
        const defaults = getDefaultInstances();
        setInstances(defaults);
        localStorage.setItem('gradecraft_instances_v2', JSON.stringify(defaults));
      }
    } catch {
      setInstances(getDefaultInstances());
    }

    // Ping backend status
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.postgres?.status === 'online') {
          setCloudStatus('Neon Cloud Ready');
        }
      })
      .catch(() => {});
  }, []);

  // Save to LocalStorage on instance changes
  const saveInstances = (updated: Record<string, Instance>) => {
    setInstances(updated);
    try {
      localStorage.setItem('gradecraft_instances_v2', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const currentInstance = instances[activeInstanceId] || instances['medium'] || null;
  const currentSemester = currentInstance?.semesters[activeSem] || null;

  // --- CALCULATIONS ---
  // A. Current viewed semester metrics
  const semMetrics = useMemo(() => {
    if (!currentSemester) return { sgpa: 0, gradedCredits: 0, earnedCredits: 0, challengedCredits: 0 };
    return calculateSemesterMetrics(currentSemester.courses, inputMode);
  }, [currentSemester, inputMode]);

  // B. Cumulative CGPA up to selected semester (e.g. S1 to S5)
  const cumulativeMetrics = useMemo(() => {
    if (!currentInstance) return { cgpa: 0, totalGradedCredits: 0, totalEarnedCredits: 0, totalChallengedCredits: 0, classification: 'First Class' };
    
    let totalWeightedPoints = 0;
    let totalGradedCredits = 0;
    let totalEarnedCredits = 0;
    let totalChallengedCredits = 0;

    for (let s = 1; s <= predictUpToSem; s++) {
      const sem = currentInstance.semesters[s];
      if (!sem) continue;
      const metrics = calculateSemesterMetrics(sem.courses, inputMode);
      totalWeightedPoints += metrics.weightedPoints;
      totalGradedCredits += metrics.gradedCredits;
      totalEarnedCredits += metrics.earnedCredits;
      totalChallengedCredits += metrics.challengedCredits;
    }

    const cgpa = totalGradedCredits > 0 ? totalWeightedPoints / totalGradedCredits : 0;
    return {
      cgpa: Number(cgpa.toFixed(2)),
      totalGradedCredits,
      totalEarnedCredits,
      totalChallengedCredits,
      classification: getClassification(cgpa),
    };
  }, [currentInstance, predictUpToSem, inputMode]);

  // C. Full Degree (S1 to S8) CGPA Projection
  const degreeProjection = useMemo(() => {
    if (!currentInstance) return { cgpa: 0, totalEarnedCredits: 0 };
    let totalWeightedPoints = 0;
    let totalGradedCredits = 0;
    let totalEarnedCredits = 0;

    for (let s = 1; s <= 8; s++) {
      const sem = currentInstance.semesters[s];
      if (!sem) continue;
      const metrics = calculateSemesterMetrics(sem.courses, inputMode);
      totalWeightedPoints += metrics.weightedPoints;
      totalGradedCredits += metrics.gradedCredits;
      totalEarnedCredits += metrics.earnedCredits;
    }

    const cgpa = totalGradedCredits > 0 ? totalWeightedPoints / totalGradedCredits : 0;
    return {
      cgpa: Number(cgpa.toFixed(2)),
      totalEarnedCredits,
    };
  }, [currentInstance, inputMode]);

  // D. Semester-by-Semester Trend Data for Visual Cupertino Bar Graph
  const semesterTrends = useMemo(() => {
    if (!currentInstance) return [];
    return [1, 2, 3, 4, 5, 6, 7, 8].map(s => {
      const sem = currentInstance.semesters[s];
      if (!sem) return { sem: s, sgpa: 0, credits: 0, active: s === activeSem, inPredictionRange: s <= predictUpToSem };
      const m = calculateSemesterMetrics(sem.courses, inputMode);
      return {
        sem: s,
        sgpa: m.sgpa,
        credits: m.earnedCredits,
        active: s === activeSem,
        inPredictionRange: s <= predictUpToSem
      };
    });
  }, [currentInstance, activeSem, predictUpToSem, inputMode]);

  // --- ACTIONS ---
  const handleGradeChange = (courseIdx: number, newGrade: GradeLetter) => {
    if (!currentInstance) return;
    const updated = JSON.parse(JSON.stringify(instances));
    updated[activeInstanceId].semesters[activeSem].courses[courseIdx].grade = newGrade;
    updated[activeInstanceId].updatedAt = new Date().toISOString();
    saveInstances(updated);
  };

  const handleMarksChange = (courseIdx: number, type: 'cieMarks' | 'eseMarks', val: string) => {
    if (!currentInstance) return;
    const num = parseFloat(val) || 0;
    const updated = JSON.parse(JSON.stringify(instances));
    const course = updated[activeInstanceId].semesters[activeSem].courses[courseIdx];
    course[type] = num;

    // Automatically synchronize effective grade
    const markRes = getGradeFromMarks(
      type === 'cieMarks' ? num : course.cieMarks,
      type === 'eseMarks' ? num : course.eseMarks,
      course.cieMax,
      course.eseMax
    );
    course.grade = markRes.grade;
    updated[activeInstanceId].updatedAt = new Date().toISOString();
    saveInstances(updated);
  };

  const handleToggleChallenged = (courseIdx: number) => {
    if (!currentInstance) return;
    const updated = JSON.parse(JSON.stringify(instances));
    const course = updated[activeInstanceId].semesters[activeSem].courses[courseIdx];
    course.isChallenged = !course.isChallenged;
    updated[activeInstanceId].updatedAt = new Date().toISOString();
    saveInstances(updated);
  };

  const handleCreateInstance = () => {
    if (!newInstanceName.trim()) return;
    const id = 'inst_' + Date.now();
    const deepCloneCurriculum = JSON.parse(JSON.stringify(KTU_2024_AIML_CURRICULUM));
    const updated = {
      ...instances,
      [id]: {
        id,
        name: newInstanceName.trim(),
        targetCgpa: parseFloat(targetCgpaInput) || 8.5,
        semesters: deepCloneCurriculum,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };
    saveInstances(updated);
    setActiveInstanceId(id);
    setNewInstanceName('');
    setShowNewInstanceModal(false);
  };

  const handleDuplicateInstance = () => {
    if (!currentInstance) return;
    const id = 'inst_' + Date.now();
    const copy = JSON.parse(JSON.stringify(currentInstance));
    copy.id = id;
    copy.name = `${currentInstance.name} (Copy)`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    const updated = { ...instances, [id]: copy };
    saveInstances(updated);
    setActiveInstanceId(id);
  };

  const handleDeleteInstance = (id: string) => {
    const keys = Object.keys(instances);
    if (keys.length <= 1) {
      alert("You must keep at least one scenario instance.");
      return;
    }
    const updated = { ...instances };
    delete updated[id];
    saveInstances(updated);
    const nextKey = Object.keys(updated)[0];
    setActiveInstanceId(nextKey);
  };

  const handleSyncToNeon = async () => {
    if (!currentInstance) return;
    setIsCloudSyncing(true);
    setCloudStatus('Syncing to Neon...');
    try {
      const res = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentInstance.id,
          userId: 'adithyen_user',
          name: currentInstance.name,
          targetCgpa: currentInstance.targetCgpa || 8.5,
          dataJson: currentInstance.semesters,
        })
      });
      if (res.ok) {
        setCloudStatus('Backed up to Neon');
        setTimeout(() => setCloudStatus('Neon Cloud Synced'), 3000);
      } else {
        setCloudStatus('Sync Error');
      }
    } catch {
      setCloudStatus('Offline Mode (Local saved)');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleResetCurrentSem = () => {
    if (!currentInstance) return;
    const updated = JSON.parse(JSON.stringify(instances));
    updated[activeInstanceId].semesters[activeSem].courses.forEach((c: Course) => {
      c.grade = 'P';
      c.cieMarks = Math.round(c.cieMax * 0.55);
      c.eseMarks = Math.round(c.eseMax * 0.45);
      c.isChallenged = false;
    });
    saveInstances(updated);
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] pb-24">
      
      {/* 1. APPLE NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#000000]/85 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center text-white font-bold text-base shadow-sm">
              <GraduationCap className="w-5 h-5 text-[#0071e3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base sm:text-lg tracking-tight text-white">GradeCraft</h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.08] text-[#98989d]">
                  KTU 2024
                </span>
              </div>
              <p className="text-[11px] text-[#86868b] hidden sm:block">B.Tech CSE (AI & ML) • Group A Curriculum</p>
            </div>
          </div>

          {/* Cloud Sync & Mode Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncToNeon}
              disabled={isCloudSyncing}
              className="apple-pressable flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/10 text-[#f5f5f7] transition"
              title="Click to sync instances to Neon PostgreSQL"
            >
              <Cloud className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-bounce text-[#0071e3]' : 'text-[#30d158]'}`} />
              <span className="hidden md:inline">{cloudStatus}</span>
              <span className="md:hidden">Sync</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER (Optimized for Widescreen Desktop + Fluid Mobile) */}
      <main className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 space-y-6">

        {/* 2. APPLE METRICS & ACADEMIC FORECAST HERO CARD */}
        <section className="bg-[#161618] rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-apple-card relative overflow-hidden">
          
          {/* Top Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b] block mb-1">
                Academic Progress & Forecast
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{currentInstance?.name || 'Scenario'}</span>
              </h2>
            </div>

            {/* Semester Range Selector: "Predict up to Semester X" */}
            <div className="flex items-center gap-2 bg-[#1c1c1e] p-1.5 rounded-2xl border border-white/[0.06]">
              <span className="text-xs font-medium text-[#86868b] pl-2 whitespace-nowrap">
                Predict up to:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(semNum => (
                  <button
                    key={semNum}
                    onClick={() => setPredictUpToSem(semNum)}
                    className={`apple-pressable px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                      predictUpToSem === semNum
                        ? 'bg-[#0071e3] text-white shadow-apple-pill'
                        : 'text-[#86868b] hover:text-white'
                    }`}
                  >
                    S{semNum}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Key Metrics Display: 4 Balanced Columns + Desktop Trajectory Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            
            {/* Metric 1: Cumulative CGPA (S1 to S{predictUpToSem}) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-[#86868b]">
                <span className="font-semibold uppercase tracking-wider">Cumulative CGPA</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-[#98989d]">
                  S1 – S{predictUpToSem}
                </span>
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#30d158] tabular-nums">
                {cumulativeMetrics.cgpa.toFixed(2)}
              </div>
              <p className="text-xs font-medium text-[#86868b]">
                {cumulativeMetrics.classification}
              </p>
            </div>

            {/* Metric 2: Current Semester SGPA */}
            <div className="space-y-1 sm:border-l sm:border-white/[0.06] sm:pl-6">
              <div className="flex items-center justify-between text-xs text-[#86868b]">
                <span className="font-semibold uppercase tracking-wider">Selected Sem SGPA</span>
                <span className="px-1.5 py-0.5 rounded bg-[#0071e3]/20 text-[#0071e3] text-[10px] font-bold">
                  S{activeSem}
                </span>
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white tabular-nums">
                {semMetrics.sgpa.toFixed(2)}
              </div>
              <p className="text-xs text-[#86868b]">
                Graded: <b className="text-white">{semMetrics.gradedCredits} cr</b> • Challenged: <b className="text-[#ff9f0a]">{semMetrics.challengedCredits} cr</b>
              </p>
            </div>

            {/* Metric 3: Credits Earned towards 170 */}
            <div className="space-y-1 lg:border-l lg:border-white/[0.06] lg:pl-6">
              <div className="flex items-center justify-between text-xs text-[#86868b]">
                <span className="font-semibold uppercase tracking-wider">Degree Credits</span>
                <span className="text-[10px] text-[#98989d]">Degree: 170</span>
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#98989d] tabular-nums">
                {cumulativeMetrics.totalEarnedCredits} <span className="text-xl font-normal text-[#86868b]">/ 170</span>
              </div>
              <div className="w-full bg-[#2c2c2e] h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-[#0071e3] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (cumulativeMetrics.totalEarnedCredits / 170) * 100)}%` }}
                />
              </div>
            </div>

            {/* Metric 4: Goal Planner & Status */}
            <div className="space-y-1 sm:border-l sm:border-white/[0.06] sm:pl-6">
              <div className="flex items-center justify-between text-xs text-[#86868b]">
                <span className="font-semibold uppercase tracking-wider">Target Goal</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-[#98989d]">
                  Goal {(currentInstance?.targetCgpa || 8.5).toFixed(2)}
                </span>
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0071e3] tabular-nums">
                {(currentInstance?.targetCgpa || 8.5).toFixed(2)}
              </div>
              <p className="text-xs font-medium text-[#86868b]">
                {cumulativeMetrics.cgpa >= (currentInstance?.targetCgpa || 8.5) 
                  ? <span className="text-[#30d158] font-bold">✓ Exceeding Goal (+{(cumulativeMetrics.cgpa - (currentInstance?.targetCgpa || 8.5)).toFixed(2)})</span> 
                  : <span className="text-[#ff9f0a] font-bold">Goal Delta: -{((currentInstance?.targetCgpa || 8.5) - cumulativeMetrics.cgpa).toFixed(2)}</span>}
              </p>
            </div>

          </div>

          {/* Desktop Interactive Semester Trajectory (Apple Fitness Trend Style) */}
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-3 text-xs text-[#86868b]">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-[#0071e3]" />
                Semester Performance Trajectory (S1 to S8) — Click any bar to navigate
              </span>
              <span className="text-[11px] text-[#98989d]">
                Cumulative S1–S{predictUpToSem}: <b className="text-white">{cumulativeMetrics.cgpa.toFixed(2)}</b> • Degree S8 Projection: <b className="text-[#30d158]">{degreeProjection.cgpa.toFixed(2)}</b>
              </span>
            </div>

            <div className="grid grid-cols-8 gap-2 bg-[#121214] p-3 rounded-2xl border border-white/[0.04]">
              {semesterTrends.map((st) => {
                const heightPercent = Math.min(100, Math.max(15, (st.sgpa / 10.0) * 100));
                const isSelected = st.active;
                return (
                  <button
                    key={st.sem}
                    onClick={() => setActiveSem(st.sem)}
                    title={`Semester ${st.sem}: SGPA ${st.sgpa.toFixed(2)} (${st.credits} Credits)`}
                    className={`apple-pressable flex flex-col items-center justify-end p-2 rounded-xl transition group ${
                      isSelected 
                        ? 'bg-white/[0.08] ring-1 ring-[#0071e3]' 
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-[11px] font-bold tabular-nums text-white mb-1.5 opacity-90 group-hover:opacity-100">
                      {st.sgpa.toFixed(2)}
                    </span>
                    <div className="w-full max-w-[28px] h-14 bg-[#242426] rounded-full overflow-hidden flex flex-col justify-end p-0.5">
                      <div 
                        className={`w-full rounded-full transition-all duration-300 ${
                          !st.inPredictionRange
                            ? 'bg-[#636366]/40'
                            : st.sgpa >= 9.0 
                              ? 'bg-[#30d158]' 
                              : st.sgpa >= 8.0 
                                ? 'bg-[#0071e3]' 
                                : 'bg-[#ff9f0a]'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-semibold mt-1.5 ${
                      isSelected ? 'text-[#0071e3]' : 'text-[#86868b] group-hover:text-white'
                    }`}>
                      S{st.sem}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Degree Forecast Callout */}
          {predictUpToSem < 8 && (
            <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#86868b]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
                <span>Full Degree (S1–S8) Projected CGPA with current scenario settings: <b className="text-white font-semibold">{degreeProjection.cgpa.toFixed(2)}</b> ({degreeProjection.totalEarnedCredits} total credits)</span>
              </div>
              <button 
                onClick={() => setPredictUpToSem(8)}
                className="text-[#0071e3] hover:underline font-medium flex items-center gap-1"
              >
                Expand Prediction to S8 <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

        </section>


        {/* 3. SCENARIO / INSTANCE MANAGEMENT BAR */}
        <section className="bg-[#1c1c1e] rounded-2xl p-3 border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider pl-1 whitespace-nowrap">
              Scenarios:
            </span>
            
            {Object.values(instances).map((inst) => {
              const isActive = inst.id === activeInstanceId;
              return (
                <div key={inst.id} className="relative group flex items-center">
                  <button
                    onClick={() => setActiveInstanceId(inst.id)}
                    className={`apple-pressable px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                      isActive 
                        ? 'bg-white text-black shadow-apple-pill font-bold' 
                        : 'bg-[#2c2c2e] text-[#98989d] hover:text-white border border-white/[0.04]'
                    }`}
                  >
                    <span>{inst.name}</span>
                  </button>

                  {/* Delete button (if more than 1) */}
                  {Object.keys(instances).length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteInstance(inst.id); }}
                      className="ml-1 opacity-40 hover:opacity-100 text-[#ff453a] p-1 rounded-full hover:bg-white/10 transition"
                      title="Delete scenario"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => setShowNewInstanceModal(true)}
              className="apple-pressable px-3 py-1.5 rounded-xl text-xs font-medium bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#0071e3] border border-[#0071e3]/30 flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Scenario</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handleDuplicateInstance}
              className="apple-pressable px-2.5 py-1 rounded-lg text-xs font-medium text-[#86868b] hover:text-white hover:bg-[#2c2c2e] transition flex items-center gap-1"
              title="Duplicate current scenario"
            >
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
          </div>

        </section>


        {/* 4. CONTROLS BAR: SEMESTER TABS & INPUT MODE SWITCH */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Apple Segmented Semester Tabs (S1 to S8) */}
          <div className="apple-segmented-track inline-flex items-center gap-1 overflow-x-auto max-w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => {
              const isSelected = s === activeSem;
              return (
                <button
                  key={s}
                  onClick={() => setActiveSem(s)}
                  className={`apple-pressable px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isSelected 
                      ? 'apple-segmented-thumb font-bold' 
                      : 'text-[#86868b] hover:text-white'
                  }`}
                >
                  S{s}
                </button>
              );
            })}
          </div>

          {/* Mode Switcher: Default GRADE MODE vs MARKS MODE */}
          <div className="apple-segmented-track inline-flex items-center gap-1 self-start sm:self-auto">
            <button
              onClick={() => setInputMode('grades')}
              className={`apple-pressable px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === 'grades'
                  ? 'apple-segmented-thumb'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              Grade Mode (Default)
            </button>
            <button
              onClick={() => setInputMode('marks')}
              className={`apple-pressable px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === 'marks'
                  ? 'apple-segmented-thumb'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              Marks Mode (CIE + ESE)
            </button>
          </div>

        </div>


        {/* 5. CHALLENGED COURSE EDUCATIONAL BANNER */}
        <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/[0.06] flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-[#ff9f0a]/10 text-[#ff9f0a] shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-xs text-[#86868b] leading-relaxed">
            <b className="text-[#ff9f0a]">Challenged Course Rule:</b> When a course is toggled as <b className="text-white">Challenged</b>, its credits are counted in your <b className="text-white">Total Degree Credits Earned (170)</b>, but are <b className="text-[#ff9f0a]">strictly excluded</b> from the SGPA/CGPA denominator and grade calculations.
          </div>
        </div>


        {/* 6. SUBJECTS LIST (2-COLUMN GRID ON WIDESCREEN DESKTOP) */}
        <section className="space-y-4">
          
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{currentSemester?.title || `Semester ${activeSem}`}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#2c2c2e] text-[#98989d]">
                {currentSemester?.credits || 0} Credits Total
              </span>
            </h3>

            <button
              onClick={handleResetCurrentSem}
              className="text-xs text-[#86868b] hover:text-[#ff453a] flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset S{activeSem}</span>
            </button>
          </div>

          {/* 2-COLUMN RESPONSIVE COURSE GRID: Fills wide desktop elegantly, 1-col on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentSemester?.courses.map((course, idx) => {
              
              // Calculation for this row
              let displayGrade = course.grade;
              let points = GRADE_POINTS[course.grade] ?? 0;
              let markPercent = 0;

              if (inputMode === 'marks') {
                const markRes = getGradeFromMarks(course.cieMarks, course.eseMarks, course.cieMax, course.eseMax);
                displayGrade = markRes.grade;
                points = markRes.points;
                markPercent = markRes.percent;
              }

              const isChallenged = course.isChallenged;
              const isAudit = course.isNoGradePoint;

              return (
                <div 
                  key={course.id || idx}
                  className={`bg-[#1c1c1e] rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between gap-3.5 ${
                    isChallenged 
                      ? 'border-[#ff9f0a]/35 bg-[#1c1c1e]/95 shadow-sm' 
                      : 'border-white/[0.06] hover:border-white/[0.14]'
                  }`}
                >
                  {/* Top Part: Course Header & Badges */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#2c2c2e] text-white border border-white/10 shrink-0">
                          Slot {course.slot}
                        </span>
                        <span className="font-semibold text-sm sm:text-base text-white tracking-tight" title={course.name}>
                          {course.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isChallenged && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ff9f0a]/20 text-[#ff9f0a] border border-[#ff9f0a]/30">
                            CHALLENGED
                          </span>
                        )}
                        {isAudit && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-[#98989d]">
                            Pass/Fail
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-[#86868b] font-mono">
                      <span>{course.code}</span>
                      <span>•</span>
                      <span className="font-sans font-medium text-white">{course.credits} Credits</span>
                      <span>•</span>
                      <span className="font-sans text-[#98989d]">{course.type}</span>
                      {inputMode === 'marks' && (
                        <>
                          <span>•</span>
                          <span className="font-sans text-[#30d158] font-bold">{markPercent.toFixed(1)}%</span>
                        </>
                      )}
                    </div>

                    {isChallenged && (
                      <div className="mt-1 text-[11px] text-[#ff9f0a] flex items-center gap-1.5 bg-[#ff9f0a]/10 px-2.5 py-1 rounded-lg border border-[#ff9f0a]/20">
                        <span>⚡</span>
                        <span><b>Challenged Active:</b> Credits (+{course.credits}) count toward degree (170), excluded from SGPA/CGPA.</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Controls Bar: Grade Selector / CIE Marks, Challenge Toggle, Points */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
                    
                    {/* A. GRADE MODE: Apple Grade Selector */}
                    {inputMode === 'grades' && !isAudit && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-[#86868b]">
                          Grade:
                        </label>
                        <select
                          value={course.grade}
                          onChange={(e) => handleGradeChange(idx, e.target.value as GradeLetter)}
                          className="apple-pressable bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white font-bold text-sm px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#0071e3] transition cursor-pointer min-w-[76px] text-center"
                        >
                          {GRADE_OPTIONS.map(g => (
                            <option key={g} value={g} className="bg-[#1c1c1e] text-white">
                              {g} ({GRADE_POINTS[g].toFixed(1)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* B. MARKS MODE: CIE + ESE inputs */}
                    {inputMode === 'marks' && (
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-[#86868b]">CIE:</span>
                          <input
                            type="number"
                            min="0"
                            max={course.cieMax}
                            value={course.cieMarks}
                            onChange={(e) => handleMarksChange(idx, 'cieMarks', e.target.value)}
                            className="w-16 bg-[#2c2c2e] text-white font-semibold text-center text-xs px-2 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-[#0071e3]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-[#86868b]">ESE:</span>
                          <input
                            type="number"
                            min="0"
                            max={course.eseMax}
                            value={course.eseMarks}
                            disabled={course.eseMax === 0}
                            onChange={(e) => handleMarksChange(idx, 'eseMarks', e.target.value)}
                            className={`w-16 bg-[#2c2c2e] text-white font-semibold text-center text-xs px-2 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-[#0071e3] ${
                              course.eseMax === 0 ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* C. CHALLENGED TOGGLE SWITCH (Apple Pill Container with Label & Info Tooltip) */}
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition ${
                      isChallenged 
                        ? 'border-[#ff9f0a]/50 bg-[#ff9f0a]/15 text-[#ff9f0a]' 
                        : 'border-white/[0.08] bg-[#2c2c2e]/60 text-white'
                    }`}>
                      <span className="text-xs font-semibold whitespace-nowrap">
                        Challenge
                      </span>
                      <span 
                        title="Challenged course rule: Credits count towards your 170 degree requirement, but are completely excluded from the SGPA/CGPA formula denominator and numerator."
                        className="cursor-help text-[#86868b] hover:text-white text-xs select-none"
                      >
                        ⓘ
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer apple-pressable">
                        <input 
                          type="checkbox" 
                          checked={isChallenged} 
                          onChange={() => handleToggleChallenged(idx)} 
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#3a3a3c] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff9f0a]"></div>
                      </label>
                    </div>

                    {/* D. CALCULATED RESULT POINTS */}
                    <div className="text-right min-w-[56px]">
                      <span className="text-[10px] uppercase font-semibold text-[#86868b] block">Points</span>
                      <div className={`text-base font-bold tabular-nums ${
                        isChallenged ? 'text-[#86868b] line-through' : (isAudit ? 'text-[#98989d]' : 'text-[#30d158]')
                      }`}>
                        {isChallenged ? '0.0' : (isAudit ? 'Pass' : (points * course.credits).toFixed(1))}
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        </section>

      </main>

      {/* NEW INSTANCE / SCENARIO MODAL */}
      {showNewInstanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#1c1c1e] rounded-3xl p-6 max-w-md w-full border border-white/10 shadow-apple-popover space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Create New Scenario</h3>
              <p className="text-xs text-[#86868b]">
                Experiment with customized grades (e.g., &quot;Lazy Study&quot;, &quot;Tryhard 9.5+&quot;, &quot;Exam Cram&quot;).
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#98989d] block mb-1">Scenario Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tryhard 9.0+ 🚀"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  className="w-full bg-[#2c2c2e] text-white text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#0071e3]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#98989d] block mb-1">Target CGPA Goal</label>
                <input
                  type="number"
                  step="0.01"
                  min="5.0"
                  max="10.0"
                  value={targetCgpaInput}
                  onChange={(e) => setTargetCgpaInput(e.target.value)}
                  className="w-full bg-[#2c2c2e] text-white text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#0071e3]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setShowNewInstanceModal(false)}
                className="apple-pressable px-4 py-2 rounded-xl text-xs font-medium text-[#86868b] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInstance}
                className="apple-pressable px-4 py-2 rounded-xl text-xs font-semibold bg-[#0071e3] text-white shadow-apple-pill"
              >
                Create Scenario
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
