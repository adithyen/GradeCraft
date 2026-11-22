import { SemesterData, Instance } from '../lib/calculator';

export const KTU_2024_AIML_CURRICULUM: Record<number, SemesterData> = {
  1: {
    sem: 1,
    title: 'Semester 1 (July - December)',
    credits: 20,
    courses: [
      { id: 's1_a', slot: 'A', code: 'GAMAT101', name: 'Mathematics for Information Science - 1', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 36, eseMarks: 52, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'BSC' },
      { id: 's1_b', slot: 'B', code: 'GAPHT121', name: 'Physics for Information Science', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 34, eseMarks: 48, grade: 'A', isChallenged: false, isNoGradePoint: false, type: 'BSC' },
      { id: 's1_c', slot: 'C', code: 'GMEST103', name: 'Engineering Graphics & CAD', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 35, eseMarks: 50, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'ESC' },
      { id: 's1_d', slot: 'D', code: 'GXEST104', name: 'Intro to Electrical & Electronics Eng.', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 35, eseMarks: 49, grade: 'A', isChallenged: false, isNoGradePoint: false, type: 'ESC' },
      { id: 's1_f', slot: 'F', code: 'UCEST105', name: 'Algorithmic Thinking with Python', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 38, eseMarks: 55, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'ESC' },
      { id: 's1_l', slot: 'L', code: 'GXESL106', name: 'Basic Electrical & Electronics Workshop', credits: 1, cieMax: 50, eseMax: 50, cieMarks: 46, eseMarks: 45, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'ESC' },
      { id: 's1_i', slot: 'I', code: 'UCPWT127', name: 'Health and Wellness', credits: 1, cieMax: 50, eseMax: 0, cieMarks: 42, eseMarks: 0, grade: 'P', isChallenged: false, isNoGradePoint: true, type: 'HMC' },
    ],
  },
  2: {
    sem: 2,
    title: 'Semester 2 (January - June)',
    credits: 24,
    courses: [
      { id: 's2_a', slot: 'A', code: 'GAMAT201', name: 'Mathematics for Information Science - 2', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 36, eseMarks: 53, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'BSC', canChallenge: true, precedingSem: 'S1' },
      { id: 's2_b', slot: 'B', code: 'GXCYT122', name: 'Chemistry for Information Science', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 33, eseMarks: 47, grade: 'A', isChallenged: false, isNoGradePoint: false, type: 'BSC', canChallenge: true, precedingSem: 'S1' },
      { id: 's2_c', slot: 'C', code: 'GXEST203', name: 'Foundations of Computing: HW to Web', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 37, eseMarks: 54, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'ESC' },
      { id: 's2_d', slot: 'D', code: 'GXEST204', name: 'Programming in C', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 38, eseMarks: 56, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'ESC', canChallenge: true, precedingSem: 'S1' },
      { id: 's2_e', slot: 'E', code: 'PCCST205', name: 'Discrete Mathematics', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 34, eseMarks: 48, grade: 'A', isChallenged: false, isNoGradePoint: false, type: 'PCC' },
      { id: 's2_f', slot: 'F', code: 'UCEST206', name: 'Engineering Entrepreneurship & IPR', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 35, eseMarks: 46, grade: 'A', isChallenged: false, isNoGradePoint: false, type: 'ESC' },
      { id: 's2_i', slot: 'I', code: 'UCHUT128', name: 'Life Skills & Professional Comm.', credits: 1, cieMax: 100, eseMax: 0, cieMarks: 85, eseMarks: 0, grade: 'P', isChallenged: false, isNoGradePoint: true, type: 'HMC' },
      { id: 's2_l', slot: 'L', code: 'GXESL208', name: 'IT Workshop', credits: 1, cieMax: 50, eseMax: 50, cieMarks: 45, eseMarks: 46, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'ESC' },
      { id: 's2_sec', slot: 'SEC', code: 'UCSEM129', name: 'Digital 101 (NASSCOM MOOC)', credits: 1, cieMax: 100, eseMax: 0, cieMarks: 90, eseMarks: 0, grade: 'P', isChallenged: false, isNoGradePoint: true, type: 'SEC' },
    ],
  },
  3: {
    sem: 3,
    title: 'Semester 3 (July - December)',
    credits: 25,
    courses: [
      { id: 's3_a', slot: 'A', code: 'GAMAT301', name: 'Mathematics for Information Science - 3', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 36, eseMarks: 52, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'BSC', canChallenge: true, precedingSem: 'S2' },
      { id: 's3_b', slot: 'B', code: 'PCCST302', name: 'Theory of Computation', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 35, eseMarks: 50, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'PCC' },
      { id: 's3_c', slot: 'C', code: 'PCCST303', name: 'Data Structures and Algorithms', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 38, eseMarks: 54, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCC' },
      { id: 's3_d', slot: 'D', code: 'PBCMT304', name: 'Concepts in Machine Learning (PC-PBL)', credits: 4, cieMax: 60, eseMax: 40, cieMarks: 55, eseMarks: 36, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PBL' },
      { id: 's3_f', slot: 'F', code: 'GAEST305', name: 'Digital Electronics & Logic Design', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 34, eseMarks: 48, grade: 'A', isChallenged: false, isNoGradePoint: false, type: 'ESC' },
      { id: 's3_g', slot: 'G', code: 'UCHUT346', name: 'Economics for Engineers', credits: 2, cieMax: 50, eseMax: 50, cieMarks: 43, eseMarks: 42, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'HMC' },
      { id: 's3_l', slot: 'L', code: 'PCCSL307', name: 'Data Structures Lab', credits: 2, cieMax: 50, eseMax: 50, cieMarks: 47, eseMarks: 46, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCL' },
      { id: 's3_q', slot: 'Q', code: 'PCCSL308', name: 'Digital Lab', credits: 2, cieMax: 50, eseMax: 50, cieMarks: 46, eseMarks: 46, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCL' },
    ],
  },
  4: {
    sem: 4,
    title: 'Semester 4 (January - June)',
    credits: 24,
    courses: [
      { id: 's4_a', slot: 'A', code: 'GAMAT401', name: 'Mathematics for Information Science - 4', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 36, eseMarks: 53, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'BSC', canChallenge: true, precedingSem: 'S3' },
      { id: 's4_b', slot: 'B', code: 'PCCMT402', name: 'Fundamentals of Artificial Intelligence', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 38, eseMarks: 55, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCC' },
      { id: 's4_c', slot: 'C', code: 'PCCST403', name: 'Operating Systems', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 35, eseMarks: 50, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'PCC' },
      { id: 's4_d', slot: 'D', code: 'PBCMT404', name: 'Database Systems (PC-PBL)', credits: 4, cieMax: 60, eseMax: 40, cieMarks: 54, eseMarks: 36, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'PBL' },
      { id: 's4_e', slot: 'E', code: 'PECMT41N', name: 'PE-1: Software Engineering / Pattern Recognition', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 34, eseMarks: 48, grade: 'A', isChallenged: false, isNoGradePoint: false, type: 'PEC' },
      { id: 's4_g', slot: 'G', code: 'UCHUT347', name: 'Engineering Ethics & Sustainable Dev.', credits: 2, cieMax: 50, eseMax: 50, cieMarks: 44, eseMarks: 44, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'HMC' },
      { id: 's4_l', slot: 'L', code: 'PCCSL407', name: 'Operating Systems Lab', credits: 2, cieMax: 50, eseMax: 50, cieMarks: 47, eseMarks: 47, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCL' },
      { id: 's4_q', slot: 'Q', code: 'PCCML408', name: 'Artificial Intelligence Lab', credits: 2, cieMax: 50, eseMax: 50, cieMarks: 48, eseMarks: 48, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCL' },
    ],
  },
  5: {
    sem: 5,
    title: 'Semester 5 (July - December)',
    credits: 23,
    courses: [
      { id: 's5_a', slot: 'A', code: 'PCCST501', name: 'Computer Networks', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 36, eseMarks: 52, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'PCC' },
      { id: 's5_b', slot: 'B', code: 'PCCST502', name: 'Design and Analysis of Algorithms', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 37, eseMarks: 53, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'PCC' },
      { id: 's5_c', slot: 'C', code: 'PCCMT503', name: 'Deep Learning Concepts', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 38, eseMarks: 55, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCC' },
      { id: 's5_d', slot: 'D', code: 'PBCMT504', name: 'Introduction to Computer Vision (PC-PBL)', credits: 4, cieMax: 60, eseMax: 40, cieMarks: 55, eseMarks: 36, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PBL' },
      { id: 's5_e', slot: 'E', code: 'PECMT52N', name: 'PE-2: Data Mining / Cloud Computing', credits: 3, cieMax: 60, eseMax: 40, cieMarks: 52, eseMarks: 34, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'PEC' },
      { id: 's5_i', slot: 'I', code: 'UCHUM506', name: 'Constitution of India (MOOC)', credits: 1, cieMax: 100, eseMax: 0, cieMarks: 85, eseMarks: 0, grade: 'P', isChallenged: false, isNoGradePoint: true, type: 'HMC' },
      { id: 's5_l', slot: 'L', code: 'PCCSL507', name: 'Networks Lab', credits: 2, cieMax: 50, eseMax: 50, cieMarks: 47, eseMarks: 47, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCL' },
      { id: 's5_q', slot: 'Q', code: 'PCCML508', name: 'Deep Learning Lab', credits: 2, cieMax: 50, eseMax: 50, cieMarks: 48, eseMarks: 49, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCL' },
    ],
  },
  6: {
    sem: 6,
    title: 'Semester 6 (January - June)',
    credits: 23,
    courses: [
      { id: 's6_a', slot: 'A', code: 'PCCMT601', name: 'Intro to Natural Language Processing', credits: 4, cieMax: 40, eseMax: 60, cieMarks: 37, eseMarks: 53, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCC' },
      { id: 's6_b', slot: 'B', code: 'PCCMT602', name: 'Generative AI', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 38, eseMarks: 55, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCC' },
      { id: 's6_c', slot: 'C', code: 'PECMT63N', name: 'PE-3: Topics in Computing Systems / Testing', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 35, eseMarks: 49, grade: 'A', isChallenged: false, isNoGradePoint: false, type: 'PEC' },
      { id: 's6_d', slot: 'D', code: 'PBCMT604', name: 'Concepts in Data Analytics (PC-PBL)', credits: 4, cieMax: 60, eseMax: 40, cieMarks: 55, eseMarks: 36, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PBL' },
      { id: 's6_f', slot: 'F', code: 'GAEST605', name: 'Design Thinking & Product Development', credits: 2, cieMax: 40, eseMax: 60, cieMarks: 36, eseMarks: 50, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'ESC' },
      { id: 's6_o', slot: 'O', code: 'OECMT61N', name: 'OE-1: Open Elective 1', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 36, eseMarks: 51, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'OEC' },
      { id: 's6_l', slot: 'L', code: 'PCCML607', name: 'Natural Language Processing Lab', credits: 2, cieMax: 50, eseMax: 50, cieMarks: 47, eseMarks: 47, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PCL' },
      { id: 's6_p', slot: 'P', code: 'PCCMP608', name: 'Mini Project: Socially Relevant Project', credits: 2, cieMax: 50, eseMax: 50, cieMarks: 48, eseMarks: 48, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PWS' },
    ],
  },
  7: {
    sem: 7,
    title: 'Semester 7 (July - December)',
    credits: 17,
    courses: [
      { id: 's7_a', slot: 'A', code: 'PECMT74N', name: 'PE-4: Big Data / Responsible AI', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 36, eseMarks: 52, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'PEC', canChallenge: true, precedingSem: 'S5/S6' },
      { id: 's7_b', slot: 'B', code: 'PECMT75N', name: 'PE-5: Computational Linguistics / IoT', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 35, eseMarks: 50, grade: 'A+', isChallenged: false, isNoGradePoint: false, type: 'PEC', canChallenge: true, precedingSem: 'S5/S6' },
      { id: 's7_o', slot: 'O', code: 'OECMT72N', name: 'OE-2: Cyber Security / Cloud Computing', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 37, eseMarks: 54, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'OEC', canChallenge: true, precedingSem: 'S5/S6' },
      { id: 's7_i', slot: 'I', code: 'UEHUT704', name: 'HMC Elective: Project Management / Foreign Lang.', credits: 2, cieMax: 50, eseMax: 50, cieMarks: 45, eseMarks: 45, grade: 'P', isChallenged: false, isNoGradePoint: true, type: 'HMC', canChallenge: true, precedingSem: 'S4/S5/S6' },
      { id: 's7_s', slot: 'S', code: 'PCCMS705', name: 'Seminar', credits: 2, cieMax: 50, eseMax: 0, cieMarks: 48, eseMarks: 0, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PWS' },
      { id: 's7_p', slot: 'P', code: 'PCCMP706', name: 'Major Project Phase - I / Internship', credits: 4, cieMax: 100, eseMax: 0, cieMarks: 94, eseMarks: 0, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PWS' },
    ],
  },
  8: {
    sem: 8,
    title: 'Semester 8 (January - June)',
    credits: 11,
    courses: [
      { id: 's8_a', slot: 'A', code: 'PECMT86N', name: 'PE-6: Large Language Models / Prompt Eng.', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 38, eseMarks: 56, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PEC', canChallenge: true, precedingSem: 'S5/S6/S7' },
      { id: 's8_o', slot: 'O', code: 'OECMT83N', name: 'OE-3: Web Programming / Algorithms', credits: 3, cieMax: 40, eseMax: 60, cieMarks: 37, eseMarks: 54, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'OEC', canChallenge: true, precedingSem: 'S5/S6/S7' },
      { id: 's8_i', slot: 'I', code: 'UEHUT803', name: 'Organizational Behavior & Business Comm.', credits: 1, cieMax: 50, eseMax: 50, cieMarks: 45, eseMarks: 45, grade: 'P', isChallenged: false, isNoGradePoint: true, type: 'HMC', canChallenge: true, precedingSem: 'S4/S5/S6/S7' },
      { id: 's8_p', slot: 'P', code: 'PCCMP806', name: 'Major Project Phase - II / Full Internship', credits: 4, cieMax: 100, eseMax: 0, cieMarks: 96, eseMarks: 0, grade: 'S', isChallenged: false, isNoGradePoint: false, type: 'PWS' },
    ],
  },
};

export function getDefaultInstances(): Record<string, Instance> {
  const deepCopy = () => JSON.parse(JSON.stringify(KTU_2024_AIML_CURRICULUM));

  const mediumData = deepCopy();

  const lazyData = deepCopy();
  Object.values(lazyData).forEach((sem: any) => {
    sem.courses.forEach((c: any) => {
      if (!c.isNoGradePoint) {
        c.cieMarks = Math.round(c.cieMax * 0.62);
        c.eseMarks = Math.round(c.eseMax * 0.55);
        c.grade = 'B';
      }
    });
  });

  const hardData = deepCopy();
  Object.values(hardData).forEach((sem: any) => {
    sem.courses.forEach((c: any) => {
      if (!c.isNoGradePoint) {
        c.cieMarks = Math.round(c.cieMax * 0.95);
        c.eseMarks = Math.round(c.eseMax * 0.92);
        c.grade = 'S';
      }
    });
  });

  return {
    'lazy': {
      id: 'lazy',
      name: 'Lazy Study',
      targetCgpa: 7.2,
      semesters: lazyData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    'medium': {
      id: 'medium',
      name: 'Balanced',
      targetCgpa: 8.5,
      semesters: mediumData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    'hard': {
      id: 'hard',
      name: 'Hard Work (9.5+)',
      targetCgpa: 9.6,
      semesters: hardData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}
