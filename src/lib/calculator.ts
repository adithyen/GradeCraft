export type GradeLetter = 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'P' | 'F';

export interface Course {
  id: string;
  slot: string;
  code: string;
  name: string;
  credits: number;
  cieMax: number;
  eseMax: number;
  cieMarks: number;
  eseMarks: number;
  grade: GradeLetter;
  isChallenged: boolean;
  isNoGradePoint: boolean; // Slot I (Health & Wellness, Life Skills, etc.), Digital 101 MOOC
  type: string; // BSC, ESC, PCC, PEC, OEC, PWS, HMC, etc.
  canChallenge?: boolean; // Eligible for Challenge evaluation per KTU guidelines
  precedingSem?: string;  // Preceding semester from where the challenge course can be taken
}

export interface SemesterData {
  sem: number;
  title: string;
  credits: number;
  courses: Course[];
  isCompleted?: boolean;
}

export interface Instance {
  id: string;
  name: string;
  targetCgpa?: number;
  semesters: Record<number, SemesterData>;
  createdAt: string;
  updatedAt: string;
}

export const GRADE_POINTS: Record<GradeLetter, number> = {
  'S': 10.0,
  'A+': 9.0,
  'A': 8.5,
  'B+': 8.0,
  'B': 7.5,
  'C+': 7.0,
  'C': 6.5,
  'D': 6.0,
  'P': 5.5,
  'F': 0.0,
};

export const GRADE_OPTIONS: GradeLetter[] = ['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'P', 'F'];

/**
 * KTU 2024 Scheme Marks to Grade Conversion
 * Rules:
 * 1. If ESE Max > 0: Fail if ESE Marks < 40% of ESE Max OR Total Marks < 50% of (CIE Max + ESE Max)
 * 2. If ESE Max == 0 (Pure internal / MOOC / Seminar): Fail if CIE Marks < 50% of CIE Max
 * 3. Percentages:
 *    >= 90%: S (10)
 *    >= 85%: A+ (9.0)
 *    >= 80%: A (8.5)
 *    >= 75%: B+ (8.0)
 *    >= 70%: B (7.5)
 *    >= 65%: C+ (7.0)
 *    >= 60%: C (6.5)
 *    >= 55%: D (6.0)
 *    else: P (5.5)
 */
export function getGradeFromMarks(
  cie: number,
  ese: number,
  cieMax: number,
  eseMax: number
): { grade: GradeLetter; points: number; percent: number; isFail: boolean } {
  cie = Math.max(0, Math.min(cieMax, Number(cie) || 0));
  ese = Math.max(0, Math.min(eseMax, Number(ese) || 0));

  if (eseMax === 0) {
    const totalPercent = cieMax > 0 ? (cie / cieMax) * 100 : 0;
    if (totalPercent < 50) return { grade: 'F', points: 0, percent: totalPercent, isFail: true };
    if (totalPercent >= 90) return { grade: 'S', points: 10, percent: totalPercent, isFail: false };
    if (totalPercent >= 85) return { grade: 'A+', points: 9.0, percent: totalPercent, isFail: false };
    if (totalPercent >= 80) return { grade: 'A', points: 8.5, percent: totalPercent, isFail: false };
    if (totalPercent >= 75) return { grade: 'B+', points: 8.0, percent: totalPercent, isFail: false };
    if (totalPercent >= 70) return { grade: 'B', points: 7.5, percent: totalPercent, isFail: false };
    if (totalPercent >= 65) return { grade: 'C+', points: 7.0, percent: totalPercent, isFail: false };
    if (totalPercent >= 60) return { grade: 'C', points: 6.5, percent: totalPercent, isFail: false };
    if (totalPercent >= 55) return { grade: 'D', points: 6.0, percent: totalPercent, isFail: false };
    return { grade: 'P', points: 5.5, percent: totalPercent, isFail: false };
  }

  const esePercent = (ese / eseMax) * 100;
  const totalMarks = cie + ese;
  const totalMax = cieMax + eseMax;
  const totalPercent = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;

  if (esePercent < 40 || totalPercent < 50) {
    return { grade: 'F', points: 0, percent: totalPercent, isFail: true };
  }

  if (totalPercent >= 90) return { grade: 'S', points: 10, percent: totalPercent, isFail: false };
  if (totalPercent >= 85) return { grade: 'A+', points: 9.0, percent: totalPercent, isFail: false };
  if (totalPercent >= 80) return { grade: 'A', points: 8.5, percent: totalPercent, isFail: false };
  if (totalPercent >= 75) return { grade: 'B+', points: 8.0, percent: totalPercent, isFail: false };
  if (totalPercent >= 70) return { grade: 'B', points: 7.5, percent: totalPercent, isFail: false };
  if (totalPercent >= 65) return { grade: 'C+', points: 7.0, percent: totalPercent, isFail: false };
  if (totalPercent >= 60) return { grade: 'C', points: 6.5, percent: totalPercent, isFail: false };
  if (totalPercent >= 55) return { grade: 'D', points: 6.0, percent: totalPercent, isFail: false };
  return { grade: 'P', points: 5.5, percent: totalPercent, isFail: false };
}

export function getClassification(gpa: number): string {
  if (isNaN(gpa) || gpa === 0) return 'In Progress';
  if (gpa >= 8.0) return 'First Class with Distinction';
  if (gpa >= 6.5) return 'First Class';
  if (gpa >= 5.5) return 'Second Class';
  if (gpa >= 5.0) return 'Pass';
  return 'Fail / Re-evaluation Required';
}

/**
 * Calculates semester SGPA and credit breakdown according to KTU 2024 rules:
 * - Challenged Courses: credits count in earned credits, but are EXCLUDED from the SGPA formula (both numerator and denominator).
 * - No Grade Point Courses (Slot I, MOOCs): earn credits on pass, but do not contribute to SGPA calculation denominator.
 */
export function calculateSemesterMetrics(
  courses: Course[],
  inputMode: 'marks' | 'grades'
) {
  let weightedPoints = 0;
  let gradedCredits = 0;
  let earnedCredits = 0;
  let challengedCredits = 0;
  let failedCredits = 0;

  for (const c of courses) {
    let effectiveGrade = c.grade;
    let points = GRADE_POINTS[c.grade] ?? 0;

    if (inputMode === 'marks') {
      const markRes = getGradeFromMarks(c.cieMarks, c.eseMarks, c.cieMax, c.eseMax);
      effectiveGrade = markRes.grade;
      points = markRes.points;
    }

    const isPassed = effectiveGrade !== 'F';

    if (isPassed) {
      earnedCredits += c.credits;
    } else {
      failedCredits += c.credits;
    }

    // Special Challenged Course Rule:
    // Credits count towards total degree requirement, but NEVER count in SGPA denominator or numerator!
    if (c.isChallenged) {
      challengedCredits += c.credits;
      continue;
    }

    // Slot I / MOOC: Pass/Fail without grade points
    if (c.isNoGradePoint) {
      continue;
    }

    weightedPoints += points * c.credits;
    gradedCredits += c.credits;
  }

  const sgpa = gradedCredits > 0 ? weightedPoints / gradedCredits : 0;

  return {
    sgpa: Number(sgpa.toFixed(2)),
    weightedPoints,
    gradedCredits,
    earnedCredits,
    challengedCredits,
    failedCredits,
    classification: getClassification(sgpa),
  };
}

/**
 * Calculates cumulative CGPA across all 8 semesters.
 */
export function calculateOverallCGPA(
  semesters: Record<number, SemesterData>,
  inputMode: 'marks' | 'grades'
) {
  let totalWeightedPoints = 0;
  let totalGradedCredits = 0;
  let totalEarnedCredits = 0;
  let totalChallengedCredits = 0;
  let totalDegreeCredits = 170;

  for (let s = 1; s <= 8; s++) {
    const sem = semesters[s];
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
    totalDegreeCredits,
    completionPercentage: Math.min(100, Math.round((totalEarnedCredits / totalDegreeCredits) * 100)),
    classification: getClassification(cgpa),
  };
}

/**
 * Reverse Target Planner:
 * Calculates required average SGPA for remaining semesters to achieve a target CGPA.
 */
export function calculateRequiredSGPA(
  semesters: Record<number, SemesterData>,
  currentSem: number,
  targetCgpa: number,
  inputMode: 'marks' | 'grades'
): { requiredSGPA: number | null; isAchievable: boolean; remainingCredits: number } {
  let completedWeightedPoints = 0;
  let completedGradedCredits = 0;
  let remainingGradedCredits = 0;

  for (let s = 1; s <= 8; s++) {
    const sem = semesters[s];
    if (!sem) continue;

    let semGradedCredits = 0;
    sem.courses.forEach(c => {
      if (!c.isChallenged && !c.isNoGradePoint) {
        semGradedCredits += c.credits;
      }
    });

    if (s < currentSem) {
      const metrics = calculateSemesterMetrics(sem.courses, inputMode);
      completedWeightedPoints += metrics.weightedPoints;
      completedGradedCredits += metrics.gradedCredits;
    } else {
      remainingGradedCredits += semGradedCredits;
    }
  }

  const totalGradedCredits = completedGradedCredits + remainingGradedCredits;
  if (remainingGradedCredits === 0 || totalGradedCredits === 0) {
    return { requiredSGPA: null, isAchievable: false, remainingCredits: 0 };
  }

  const targetTotalPoints = targetCgpa * totalGradedCredits;
  const neededRemainingPoints = targetTotalPoints - completedWeightedPoints;
  const requiredSGPA = neededRemainingPoints / remainingGradedCredits;

  const isAchievable = requiredSGPA >= 0 && requiredSGPA <= 10.0;

  return {
    requiredSGPA: Number(requiredSGPA.toFixed(2)),
    isAchievable,
    remainingCredits: remainingGradedCredits,
  };
}
