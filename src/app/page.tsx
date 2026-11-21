'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Plus, 
  Trash2, 
  Copy, 
  RotateCcw, 
  Cloud, 
  GraduationCap, 
  ArrowRight,
  Zap,
  BarChart2,
  CheckCircle2,
  SlidersHorizontal,
  Info,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

export default function GradeCraftPage() {
  // --- STATE ---
  const [user, setUser] = useState<AuthUser | null>(null);
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
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);
  const [editingTargetVal, setEditingTargetVal] = useState<string>('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Sync confirmation popup state when logging in with existing local data
  const [syncPromptModal, setSyncPromptModal] = useState<{
    show: boolean;
    authUser: AuthUser | null;
    cloudInstances: Record<string, Instance>;
    localInstances: Record<string, Instance>;
  }>({
    show: false,
    authUser: null,
    cloudInstances: {},
    localInstances: {},
  });

  // 1. Initial Load: Restore user & load data from Neon or LocalStorage
  useEffect(() => {
    // Check saved user
    const savedUserJson = localStorage.getItem('gradecraft_auth_user');
    let currentUser: AuthUser | null = null;
    if (savedUserJson) {
      try {
        currentUser = JSON.parse(savedUserJson);
        setUser(currentUser);
      } catch {}
    }

    const currentUserId = currentUser ? currentUser.email : 'adithyen_user';
    const storageKey = `gradecraft_instances_v3_${currentUserId}`;

    let localData: Record<string, Instance> = {};
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verify parsed local data has valid semesters structure
        if (parsed && typeof parsed === 'object' && Object.values(parsed).some((inst: any) => inst?.semesters && inst?.semesters[1]?.courses)) {
          localData = parsed;
          setInstances(localData);
        } else {
          localData = getDefaultInstances();
          setInstances(localData);
        }
      } else {
        const defaults = getDefaultInstances();
        localData = defaults;
        setInstances(defaults);
      }
    } catch {
      localData = getDefaultInstances();
      setInstances(localData);
    }

    // Auto-fetch from Neon PostgreSQL for this specific user
    fetch(`/api/instances?userId=${encodeURIComponent(currentUserId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.instances && data.instances.length > 0) {
          const cloudMap: Record<string, Instance> = { ...localData };
          data.instances.forEach((row: any) => {
            const semData = typeof row.data_json === 'string' ? JSON.parse(row.data_json) : row.data_json;
            // Guard against corrupted or dummy rows that don't have KTU semester structure
            if (!semData || !semData[1] || !semData[1].courses) return;
            cloudMap[row.id] = {
              id: row.id,
              name: row.name,
              targetCgpa: row.target_cgpa ? parseFloat(row.target_cgpa) : 8.5,
              semesters: semData,
              createdAt: row.updated_at || new Date().toISOString(),
              updatedAt: row.updated_at || new Date().toISOString(),
            };
          });
          setInstances(cloudMap);
          try {
            localStorage.setItem(storageKey, JSON.stringify(cloudMap));
          } catch {}
          setCloudStatus('Neon Cloud Synced');
          // If activeInstanceId is missing or corrupted, snap to 'medium' or first valid scenario
          setActiveInstanceId(prev => (cloudMap[prev] ? prev : Object.keys(cloudMap)[0] || 'medium'));
        } else {
          setCloudStatus('Neon Cloud Ready');
        }
      })
      .catch(() => {
        setCloudStatus('Local Mode');
      });
  }, []);

  // 2. Setup Google Sign-In button
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '628041736031-spsf2l1a7erq3rnr559i593kuujq0l6s.apps.googleusercontent.com';
    
    const initGoogle = () => {
      if (typeof window !== 'undefined' && (window as any).google && (window as any).google.accounts) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });

        if (googleBtnRef.current && !user) {
          (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'medium',
            shape: 'pill',
            text: 'signin_with',
          });
        }
      }
    };

    const timer = setTimeout(initGoogle, 500);
    return () => clearTimeout(timer);
  }, [user]);

  // Handle Google Token
  const handleGoogleCredentialResponse = (response: any) => {
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      
      const authUser: AuthUser = {
        id: payload.sub,
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        picture: payload.picture,
      };

      setUser(authUser);
      localStorage.setItem('gradecraft_auth_user', JSON.stringify(authUser));

      const localDataBeforeLogin = { ...instances };

      // 1. Fetch any existing instances under this user's Google email from Neon
      fetch(`/api/instances?userId=${encodeURIComponent(authUser.email)}`)
        .then(res => res.json())
        .then(async (data) => {
          const cloudMap: Record<string, Instance> = {};
          if (data.instances && data.instances.length > 0) {
            data.instances.forEach((row: any) => {
              const semData = typeof row.data_json === 'string' ? JSON.parse(row.data_json) : row.data_json;
              if (!semData || !semData[1] || !semData[1].courses) return;
              cloudMap[row.id] = {
                id: row.id,
                name: row.name,
                targetCgpa: row.target_cgpa ? parseFloat(row.target_cgpa) : 8.5,
                semesters: semData,
                createdAt: row.updated_at || new Date().toISOString(),
                updatedAt: row.updated_at || new Date().toISOString(),
              };
            });
          }

          const hasLocalData = Object.keys(localDataBeforeLogin).length > 0;

          // If there is local data, ask the user with a confirmation popup whether to sync local data to their Google account
          if (hasLocalData) {
            setSyncPromptModal({
              show: true,
              authUser,
              cloudInstances: cloudMap,
              localInstances: localDataBeforeLogin,
            });
          } else if (Object.keys(cloudMap).length > 0) {
            // No local data, directly apply cloud data
            setInstances(cloudMap);
            localStorage.setItem(`gradecraft_instances_v3_${authUser.email}`, JSON.stringify(cloudMap));
            setActiveInstanceId(Object.keys(cloudMap)[0] || 'medium');
            setCloudStatus('Neon Cloud Synced');
          }
        });

    } catch (err) {
      console.error('Google login parse error:', err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gradecraft_auth_user');
    const guestData = getDefaultInstances();
    setInstances(guestData);
    setActiveInstanceId('medium');
    setCloudStatus('Local Mode');
  };

  // User confirmed to sync local data to their Google Account
  const handleConfirmSyncLocalToGoogle = async () => {
    const { authUser, localInstances } = syncPromptModal;
    if (!authUser) return;

    setSyncPromptModal(prev => ({ ...prev, show: false }));
    setIsCloudSyncing(true);
    setCloudStatus('Syncing Local to Google...');

    try {
      setInstances(localInstances);
      localStorage.setItem(`gradecraft_instances_v3_${authUser.email}`, JSON.stringify(localInstances));
      setActiveInstanceId(Object.keys(localInstances)[0] || 'medium');

      // Upload local instances to Neon under the Google email
      const syncPromises = Object.values(localInstances).map(inst =>
        fetch('/api/instances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: inst.id,
            userId: authUser.email,
            name: inst.name,
            targetCgpa: inst.targetCgpa || 8.5,
            dataJson: inst.semesters,
          }),
        })
      );
      await Promise.all(syncPromises);
      setCloudStatus('Neon Cloud Synced');
    } catch {
      setCloudStatus('Sync Error');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // User chose to keep/load the Google account's existing cloud data instead of local
  const handleKeepGoogleCloudData = () => {
    const { authUser, cloudInstances } = syncPromptModal;
    if (!authUser) return;

    setSyncPromptModal(prev => ({ ...prev, show: false }));

    if (Object.keys(cloudInstances).length > 0) {
      setInstances(cloudInstances);
      localStorage.setItem(`gradecraft_instances_v3_${authUser.email}`, JSON.stringify(cloudInstances));
      setActiveInstanceId(Object.keys(cloudInstances)[0] || 'medium');
      setCloudStatus('Neon Cloud Synced');
    } else {
      setCloudStatus('Neon Cloud Ready');
    }
  };

  // Save to LocalStorage on instance changes
  const saveInstances = (updated: Record<string, Instance>) => {
    setInstances(updated);
    const currentUserId = user ? user.email : 'adithyen_user';
    try {
      localStorage.setItem(`gradecraft_instances_v3_${currentUserId}`, JSON.stringify(updated));
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

  const handleSaveTarget = () => {
    if (!currentInstance) return;
    const val = parseFloat(editingTargetVal);
    if (isNaN(val) || val < 0 || val > 10) return;
    const updated = JSON.parse(JSON.stringify(instances));
    updated[activeInstanceId].targetCgpa = val;
    saveInstances(updated);
    setIsEditingTarget(false);
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
    setIsCloudSyncing(true);
    setCloudStatus('Syncing to Neon...');
    const currentUserId = user ? user.email : 'adithyen_user';
    const storageKey = `gradecraft_instances_v3_${currentUserId}`;

    try {
      // Sync ALL instances to Neon PostgreSQL in parallel for this specific user
      const syncPromises = Object.values(instances).map(inst => 
        fetch('/api/instances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: inst.id,
            userId: currentUserId,
            name: inst.name,
            targetCgpa: inst.targetCgpa || 8.5,
            dataJson: inst.semesters,
          })
        })
      );

      await Promise.all(syncPromises);

      // Verify and refresh latest state from Neon
      const res = await fetch(`/api/instances?userId=${encodeURIComponent(currentUserId)}`);
      const data = await res.json();
      if (data.instances && data.instances.length > 0) {
        const cloudMap: Record<string, Instance> = { ...instances };
        data.instances.forEach((row: any) => {
          const semData = typeof row.data_json === 'string' ? JSON.parse(row.data_json) : row.data_json;
          cloudMap[row.id] = {
            id: row.id,
            name: row.name,
            targetCgpa: row.target_cgpa ? parseFloat(row.target_cgpa) : 8.5,
            semesters: semData,
            createdAt: row.updated_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
          };
        });
        setInstances(cloudMap);
        try {
          localStorage.setItem(storageKey, JSON.stringify(cloudMap));
        } catch {}
      }

      setCloudStatus('Neon Cloud Synced');
    } catch {
      setCloudStatus('Sync Error');
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
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] pb-24">
      
      {/* 1. APPLE NAVIGATION BAR — Full Width */}
      <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-2xl border-b border-white/[0.12] w-full">
        <div className="w-full px-4 sm:px-6 md:px-8 xl:px-12 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-white font-black text-lg shadow-sm">
              <GraduationCap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white">GradeCraft</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  KTU 2024
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-medium hidden sm:block">B.Tech CSE (AI & ML) • Group A Curriculum</p>
            </div>
          </div>

          {/* Cloud Sync & Google Auth Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncToNeon}
              disabled={isCloudSyncing}
              className="apple-pressable flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#18181b] hover:bg-[#27272a] border border-white/15 text-white transition shadow-sm"
              title="Click to sync instances to Neon PostgreSQL"
            >
              <Cloud className={`w-4 h-4 ${isCloudSyncing ? 'animate-bounce text-blue-400' : 'text-emerald-400'}`} />
              <span className="hidden md:inline">{cloudStatus}</span>
              <span className="md:hidden">Sync</span>
            </button>

            {/* Google Authentication Section */}
            {user ? (
              <div className="flex items-center gap-2.5 bg-[#18181b] border border-white/20 px-3.5 py-1.5 rounded-xl shadow-md">
                {user.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-7 h-7 rounded-full border border-blue-400/50 object-cover shadow-sm" 
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-extrabold text-white truncate max-w-[130px] leading-tight">{user.name}</div>
                  <div className="text-[10px] text-zinc-300 font-medium truncate max-w-[130px] leading-tight">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="apple-pressable ml-1 p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <div ref={googleBtnRef} className="overflow-hidden rounded-full shadow-sm"></div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER — Full Width Edge-to-Edge with Generous Padding */}
      <main className="w-full px-4 sm:px-6 md:px-8 xl:px-12 pt-6 space-y-6">

        {/* 2. APPLE METRICS & ACADEMIC FORECAST HERO CARD */}
        <section className="bg-[#18181b] rounded-3xl p-6 sm:p-8 border border-white/[0.14] shadow-2xl relative overflow-hidden">
          
          {/* Top Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.10]">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-sky-400 block mb-1">
                Academic Progress & Forecast
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span>{currentInstance?.name || 'Scenario'}</span>
              </h2>
            </div>

            {/* Semester Range Selector: "Predict up to Semester X" */}
            <div className="flex items-center gap-2 bg-[#27272a] p-1.5 rounded-2xl border border-white/15 shadow-sm">
              <span className="text-xs font-extrabold text-zinc-200 pl-3 whitespace-nowrap uppercase tracking-wider">
                Predict up to:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(semNum => (
                  <button
                    key={semNum}
                    onClick={() => setPredictUpToSem(semNum)}
                    className={`apple-pressable px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                      predictUpToSem === semNum
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-zinc-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    S{semNum}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Key Metrics Display: 4 High-Visibility Bold Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            
            {/* Metric 1: Cumulative CGPA (S1 to S{predictUpToSem}) */}
            <div className="space-y-1.5 bg-[#121214] p-5 rounded-2xl border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">Cumulative CGPA</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-500/30">
                  S1 – S{predictUpToSem}
                </span>
              </div>
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-emerald-400 tabular-nums drop-shadow-sm">
                {cumulativeMetrics.cgpa.toFixed(2)}
              </div>
              <p className="text-sm font-bold text-zinc-200">
                {cumulativeMetrics.classification}
              </p>
            </div>

            {/* Metric 2: Current Semester SGPA */}
            <div className="space-y-1.5 bg-[#121214] p-5 rounded-2xl border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">Selected Sem SGPA</span>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-xs font-black shadow-sm">
                  S{activeSem}
                </span>
              </div>
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-white tabular-nums drop-shadow-sm">
                {semMetrics.sgpa.toFixed(2)}
              </div>
              <p className="text-sm font-semibold text-zinc-300">
                Graded: <b className="text-white font-bold">{semMetrics.gradedCredits} cr</b> • Challenged: <b className="text-amber-400 font-bold">{semMetrics.challengedCredits} cr</b>
              </p>
            </div>

            {/* Metric 3: Credits Earned towards 170 */}
            <div className="space-y-1.5 bg-[#121214] p-5 rounded-2xl border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">Degree Credits</span>
                <span className="text-xs font-bold text-zinc-300">Degree: 170</span>
              </div>
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-white tabular-nums">
                {cumulativeMetrics.totalEarnedCredits} <span className="text-2xl font-bold text-zinc-400">/ 170</span>
              </div>
              <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden mt-3 p-0.5 border border-white/10">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                  style={{ width: `${Math.min(100, (cumulativeMetrics.totalEarnedCredits / 170) * 100)}%` }}
                />
              </div>
            </div>

            {/* Metric 4: Goal Planner & Status */}
            <div className="space-y-1.5 bg-[#121214] p-5 rounded-2xl border border-white/[0.08] relative group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">Target Goal</span>
                {isEditingTarget ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSaveTarget}
                      className="px-2 py-0.5 rounded bg-emerald-500 text-black text-xs font-black"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingTarget(false)}
                      className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingTargetVal((currentInstance?.targetCgpa || 8.5).toFixed(2));
                      setIsEditingTarget(true);
                    }}
                    className="apple-pressable px-2 py-0.5 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-extrabold border border-sky-500/30 flex items-center gap-1"
                    title="Click to edit target CGPA goal"
                  >
                    <span>Edit Goal</span>
                    <span className="text-[10px]">✎</span>
                  </button>
                )}
              </div>

              {isEditingTarget ? (
                <div className="pt-2">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="10"
                    value={editingTargetVal}
                    onChange={(e) => setEditingTargetVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTarget(); }}
                    autoFocus
                    className="w-full bg-[#27272a] text-sky-400 font-black text-3xl px-3 py-1.5 rounded-xl border-2 border-sky-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div 
                  onClick={() => {
                    setEditingTargetVal((currentInstance?.targetCgpa || 8.5).toFixed(2));
                    setIsEditingTarget(true);
                  }}
                  className="text-5xl sm:text-6xl font-black tracking-tight text-sky-400 tabular-nums cursor-pointer hover:opacity-90"
                  title="Click to edit target goal"
                >
                  {(currentInstance?.targetCgpa || 8.5).toFixed(2)}
                </div>
              )}

              <p className="text-sm font-bold pt-1">
                {cumulativeMetrics.cgpa >= (currentInstance?.targetCgpa || 8.5) 
                  ? <span className="text-emerald-400 font-extrabold">✓ Exceeding Goal (+{(cumulativeMetrics.cgpa - (currentInstance?.targetCgpa || 8.5)).toFixed(2)})</span> 
                  : <span className="text-amber-400 font-extrabold">Goal Delta: -{((currentInstance?.targetCgpa || 8.5) - cumulativeMetrics.cgpa).toFixed(2)}</span>}
              </p>
            </div>

          </div>

          {/* Interactive Semester Trajectory (Full-Width Visual Cupertino Bar Chart) */}
          <div className="mt-6 pt-5 border-t border-white/[0.10]">
            <div className="flex items-center justify-between mb-3 text-sm text-zinc-200">
              <span className="font-extrabold uppercase tracking-wider flex items-center gap-2 text-white">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                Semester Performance Trajectory (S1 to S8) — Click any bar to navigate
              </span>
              <span className="text-xs font-semibold text-zinc-300">
                Cumulative S1–S{predictUpToSem}: <b className="text-white font-extrabold">{cumulativeMetrics.cgpa.toFixed(2)}</b> • Degree S8 Projection: <b className="text-emerald-400 font-extrabold">{degreeProjection.cgpa.toFixed(2)}</b>
              </span>
            </div>

            <div className="grid grid-cols-8 gap-3 bg-[#101012] p-4 rounded-2xl border border-white/[0.08]">
              {semesterTrends.map((st) => {
                const heightPercent = Math.min(100, Math.max(18, (st.sgpa / 10.0) * 100));
                const isSelected = st.active;
                return (
                  <button
                    key={st.sem}
                    onClick={() => setActiveSem(st.sem)}
                    title={`Semester ${st.sem}: SGPA ${st.sgpa.toFixed(2)} (${st.credits} Credits)`}
                    className={`apple-pressable flex flex-col items-center justify-end p-2.5 rounded-xl transition group ${
                      isSelected 
                        ? 'bg-blue-600/20 ring-2 ring-blue-500 scale-105' 
                        : 'hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="text-xs font-black tabular-nums text-white mb-2">
                      {st.sgpa.toFixed(2)}
                    </span>
                    <div className="w-full max-w-[36px] h-20 bg-zinc-800 rounded-full overflow-hidden flex flex-col justify-end p-0.5 border border-white/10">
                      <div 
                        className={`w-full rounded-full transition-all duration-300 ${
                          !st.inPredictionRange
                            ? 'bg-zinc-600'
                            : st.sgpa >= 9.0 
                              ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' 
                              : st.sgpa >= 8.0 
                                ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                                : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className={`text-xs font-black mt-2 ${
                      isSelected ? 'text-blue-400' : 'text-zinc-200 group-hover:text-white'
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
            <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Full Degree (S1–S8) Projected CGPA with current scenario settings: <b className="text-white font-extrabold">{degreeProjection.cgpa.toFixed(2)}</b> ({degreeProjection.totalEarnedCredits} total credits)</span>
              </div>
              <button 
                onClick={() => setPredictUpToSem(8)}
                className="text-blue-400 hover:text-blue-300 hover:underline font-bold flex items-center gap-1.5"
              >
                Expand Prediction to S8 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </section>


        {/* 3. SCENARIO / INSTANCE MANAGEMENT BAR */}
        <section className="bg-[#18181b] rounded-2xl p-4 border border-white/[0.12] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-black text-zinc-300 uppercase tracking-widest pl-1 whitespace-nowrap">
              Scenarios:
            </span>
            
            {Object.values(instances).map((inst) => {
              const isActive = inst.id === activeInstanceId;
              return (
                <div key={inst.id} className="relative group flex items-center">
                  <button
                    onClick={() => setActiveInstanceId(inst.id)}
                    className={`apple-pressable px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap flex items-center gap-2 ${
                      isActive 
                        ? 'bg-white text-black shadow-lg font-black' 
                        : 'bg-[#27272a] text-zinc-200 hover:text-white hover:bg-[#3f3f46] border border-white/10'
                    }`}
                  >
                    <span>{inst.name}</span>
                  </button>

                  {/* Delete button (if more than 1) */}
                  {Object.keys(instances).length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteInstance(inst.id); }}
                      className="ml-1 opacity-40 hover:opacity-100 text-rose-400 p-1 rounded-full hover:bg-white/10 transition"
                      title="Delete scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => setShowNewInstanceModal(true)}
              className="apple-pressable px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Scenario</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handleDuplicateInstance}
              className="apple-pressable px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-[#27272a] border border-white/10 transition flex items-center gap-1.5"
              title="Duplicate current scenario"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
          </div>

        </section>


        {/* 4. CONTROLS BAR: SEMESTER TABS & INPUT MODE SWITCH */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Apple Segmented Semester Tabs (S1 to S8) */}
          <div className="bg-[#18181c] border border-white/[0.12] p-1.5 rounded-2xl inline-flex items-center gap-1.5 overflow-x-auto max-w-full shadow-sm">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => {
              const isSelected = s === activeSem;
              return (
                <button
                  key={s}
                  onClick={() => setActiveSem(s)}
                  className={`apple-pressable px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  S{s}
                </button>
              );
            })}
          </div>

          {/* Mode Switcher: Default GRADE MODE vs MARKS MODE */}
          <div className="bg-[#18181c] border border-white/[0.12] p-1.5 rounded-2xl inline-flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
            <button
              onClick={() => setInputMode('grades')}
              className={`apple-pressable px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                inputMode === 'grades'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Grade Mode (Default)
            </button>
            <button
              onClick={() => setInputMode('marks')}
              className={`apple-pressable px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                inputMode === 'marks'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Marks Mode (CIE + ESE)
            </button>
          </div>

        </div>


        {/* 5. CHALLENGED COURSE EDUCATIONAL BANNER */}
        <div className="bg-amber-950/40 rounded-2xl p-4 sm:p-5 border border-amber-500/40 flex items-start sm:items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-amber-200 leading-relaxed">
            <b className="text-amber-400 font-extrabold uppercase tracking-wide">Challenged Course Rule:</b> When a course is toggled as <b className="text-white font-bold">Challenged</b>, its credits are counted in your <b className="text-white font-bold">Total Degree Credits Earned (170)</b>, but are <b className="text-amber-400 font-black">strictly excluded</b> from the SGPA/CGPA denominator and grade calculations.
          </div>
        </div>


        {/* 6. SUBJECTS LIST (ADAPTIVE 3-4 COLUMN GRID ON WIDESCREEN DESKTOP) */}
        <section className="space-y-4">
          
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-3">
              <span>{currentSemester?.title || `Semester ${activeSem}`}</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-white/10">
                {currentSemester?.credits || 0} Credits Total
              </span>
            </h3>

            <button
              onClick={handleResetCurrentSem}
              className="text-xs sm:text-sm font-bold text-zinc-300 hover:text-rose-400 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset S{activeSem}</span>
            </button>
          </div>

          {/* ADAPTIVE WIDESCREEN GRID: 1 col on mobile, 2 on tablet, 3-4 on desktop/ultrawide */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4.5">
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
                  className={`rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 shadow-lg ${
                    isChallenged 
                      ? 'bg-[#22160d] border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                      : 'bg-[#18181c] border-white/[0.14] hover:border-blue-500/40 hover:bg-[#1e1e22]'
                  }`}
                >
                  {/* Top Part: Course Header & Badges */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-blue-600 text-white shadow-sm shrink-0">
                          Slot {course.slot}
                        </span>
                        <h4 className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-snug" title={course.name}>
                          {course.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isChallenged && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            CHALLENGED
                          </span>
                        )}
                        {isAudit && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-white/10">
                            Pass/Fail
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                      <span className="font-mono text-zinc-300 bg-white/5 px-2 py-0.5 rounded">{course.code}</span>
                      <span>•</span>
                      <span className="text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">{course.credits} Credits</span>
                      <span>•</span>
                      <span className="text-zinc-300 bg-white/5 px-2 py-0.5 rounded">{course.type}</span>
                      {inputMode === 'marks' && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-black">{markPercent.toFixed(1)}%</span>
                        </>
                      )}
                    </div>

                    {isChallenged && (
                      <div className="mt-1 text-xs text-amber-300 font-semibold flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
                        <span className="text-base">⚡</span>
                        <span><b>Challenged Active:</b> Credits (+{course.credits}) count toward degree total (170), excluded from SGPA/CGPA.</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Controls Bar: Grade Selector / CIE Marks, Challenge Toggle, Points */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-white/[0.10]">
                    
                    {/* A. GRADE MODE: Big Tactile Grade Selector */}
                    {inputMode === 'grades' && !isAudit && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-black uppercase tracking-wider text-zinc-300">
                          Grade:
                        </label>
                        <select
                          value={course.grade}
                          onChange={(e) => handleGradeChange(idx, e.target.value as GradeLetter)}
                          className="apple-pressable bg-[#27272a] hover:bg-[#3f3f46] text-white font-black text-base px-3.5 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer min-w-[80px] text-center shadow-inner"
                        >
                          {GRADE_OPTIONS.map(g => (
                            <option key={g} value={g} className="bg-[#18181c] text-white font-bold">
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
                          <span className="text-xs font-bold text-zinc-300">CIE:</span>
                          <input
                            type="number"
                            min="0"
                            max={course.cieMax}
                            value={course.cieMarks}
                            onChange={(e) => handleMarksChange(idx, 'cieMarks', e.target.value)}
                            className="w-16 bg-[#27272a] text-white font-black text-center text-sm px-2 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-300">ESE:</span>
                          <input
                            type="number"
                            min="0"
                            max={course.eseMax}
                            value={course.eseMarks}
                            disabled={course.eseMax === 0}
                            onChange={(e) => handleMarksChange(idx, 'eseMarks', e.target.value)}
                            className={`w-16 bg-[#27272a] text-white font-black text-center text-sm px-2 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              course.eseMax === 0 ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* C. CHALLENGED TOGGLE SWITCH (Apple Pill Container with Label & Info Tooltip) */}
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition ${
                      isChallenged 
                        ? 'border-amber-500/70 bg-amber-950/70 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]' 
                        : 'border-white/15 bg-[#27272a] text-zinc-200 hover:border-white/30'
                    }`}>
                      <span className="text-xs font-black uppercase tracking-wider whitespace-nowrap text-white">
                        Challenge
                      </span>
                      <span 
                        title="Challenged course rule: Credits count towards your 170 degree requirement, but are completely excluded from the SGPA/CGPA formula denominator and numerator."
                        className="cursor-help text-zinc-400 hover:text-white text-xs select-none"
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
                        <div className="w-10 h-5.5 bg-[#3f3f46] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {/* D. CALCULATED RESULT POINTS */}
                    <div className="text-right min-w-[60px]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Points</span>
                      <div className={`text-lg sm:text-xl font-black tabular-nums ${
                        isChallenged ? 'text-zinc-500 line-through' : (isAudit ? 'text-zinc-300' : 'text-emerald-400')
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#18181b] rounded-3xl p-6 sm:p-7 max-w-md w-full border border-white/20 shadow-2xl space-y-5">
            <div>
              <h3 className="text-xl font-black text-white">Create New Scenario</h3>
              <p className="text-xs text-zinc-300 font-medium mt-1">
                Experiment with customized grades (e.g., &quot;Lazy Study&quot;, &quot;Tryhard 9.5+&quot;, &quot;Exam Cram&quot;).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-300 block mb-1.5">Scenario Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tryhard 9.0+ 🚀"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  className="w-full bg-[#27272a] text-white font-bold text-sm px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-300 block mb-1.5">Target CGPA Goal</label>
                <input
                  type="number"
                  step="0.01"
                  min="5.0"
                  max="10.0"
                  value={targetCgpaInput}
                  onChange={(e) => setTargetCgpaInput(e.target.value)}
                  className="w-full bg-[#27272a] text-white font-bold text-sm px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowNewInstanceModal(false)}
                className="apple-pressable px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInstance}
                className="apple-pressable px-5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
              >
                Create Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SYNC LOCAL DATA TO GOOGLE ACCOUNT CONFIRMATION MODAL */}
      {syncPromptModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#18181b] border border-white/20 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Cloud className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Sync Local Data to Google Account?</h3>
                <p className="text-xs text-zinc-400">Account: {syncPromptModal.authUser?.email}</p>
              </div>
            </div>

            <div className="bg-[#27272a] rounded-2xl p-4 border border-white/10 text-xs text-zinc-200 leading-relaxed space-y-2">
              <p>
                We found active local semester scenarios configured on this browser.
              </p>
              <p className="text-zinc-400">
                Would you like to sync and upload your current <strong className="text-white">local data</strong> to your Google Account on Neon Cloud, or <strong className="text-white">keep the existing cloud data</strong>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleKeepGoogleCloudData}
                className="apple-pressable px-4 py-2.5 rounded-xl text-xs font-bold bg-[#27272a] hover:bg-white/10 text-zinc-300 hover:text-white transition border border-white/10"
              >
                Keep Cloud Data
              </button>
              <button
                onClick={handleConfirmSyncLocalToGoogle}
                className="apple-pressable px-5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition flex items-center gap-2"
              >
                <Cloud className="w-3.5 h-3.5" />
                Sync Local to Google
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
