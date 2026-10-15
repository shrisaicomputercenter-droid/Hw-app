import { CategoryInfo, Student, StudentCategory, SubjectInfo, SubjectKey } from './types';

export const STUDENT_CATEGORIES: Record<StudentCategory, CategoryInfo> = {
  beginner: {
    key: 'beginner',
    name: 'Beginner',
    label: '🌱 Beginner',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Foundational concepts & step-by-step guided learning',
  },
  progressive: {
    key: 'progressive',
    name: 'Progressive',
    label: '📈 Progressive',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Standard grade-level curriculum & skill strengthening',
  },
  proficient: {
    key: 'proficient',
    name: 'Proficient',
    label: '⭐ Proficient',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Advanced challenges, deep practice & enrichment',
  },
};

export const CATEGORY_ORDER: StudentCategory[] = ['beginner', 'progressive', 'proficient'];

// Initial student categories map (empty by default; teacher will select/assign learning categories)
export const DEFAULT_STUDENT_CATEGORIES: Record<number, StudentCategory> = {};

export const CLASS_5_STUDENTS: Student[] = [
  { rollNo: 501, name: 'Abhishrey Thakur', dob: '13/10/2015', class: 5 },
  { rollNo: 502, name: 'Agrima Dehariya', dob: '24/06/2015', class: 5 },
  { rollNo: 503, name: 'Ananya Bairagi', dob: '01/02/2016', class: 5 },
  { rollNo: 504, name: 'Aradhya Shrivas', dob: '22/03/2016', class: 5 },
  { rollNo: 505, name: 'Arohi Meravi', dob: '16/11/2015', class: 5 },
  { rollNo: 506, name: 'Aruj Pal', dob: '02/09/2015', class: 5 },
  { rollNo: 507, name: 'Arpit Kushwaha', dob: '02/02/2015', class: 5 },
  { rollNo: 508, name: 'Ashwary Sahu', dob: '24/12/2015', class: 5 },
  { rollNo: 509, name: 'Daksh Patel', dob: '18/02/2016', class: 5 },
  { rollNo: 510, name: 'Daksh Uikey', dob: '10/03/2016', class: 5 },
  { rollNo: 511, name: 'Devansh Rajak', dob: '23/11/2015', class: 5 },
  { rollNo: 512, name: 'Devanshu Warkade', dob: '13/10/2015', class: 5 },
  { rollNo: 513, name: 'Goutmi Sarote', dob: '17/03/2015', class: 5 },
  { rollNo: 514, name: 'Harsh Uikey', dob: '20/02/2016', class: 5 },
  { rollNo: 515, name: 'Harshita Saiyam', dob: '28/12/2015', class: 5 },
  { rollNo: 516, name: 'Isha Baghel', dob: '16/02/2016', class: 5 },
  { rollNo: 517, name: 'Isha Tirkey', dob: '29/12/2015', class: 5 },
  { rollNo: 518, name: 'Kangna Patel', dob: '19/07/2015', class: 5 },
  { rollNo: 519, name: 'Maitreya', dob: '26/01/2016', class: 5 },
  { rollNo: 520, name: 'Manvi Deshraj', dob: '02/12/2015', class: 5 },
  { rollNo: 521, name: 'Mishika Sarute', dob: '03/12/2015', class: 5 },
  { rollNo: 522, name: 'Mohammad Faizaan Ulla', dob: '29/05/2015', class: 5 },
  { rollNo: 523, name: 'Mrigank Mishra', dob: '15/01/2016', class: 5 },
  { rollNo: 524, name: 'Nandni Yadav', dob: '12/11/2015', class: 5 },
  { rollNo: 525, name: 'Navya Choudhary', dob: '20/02/2014', class: 5 },
  { rollNo: 526, name: 'Nishchay Tekam', dob: '16/05/2015', class: 5 },
  { rollNo: 527, name: 'Parth Tripathi', dob: '15/07/2015', class: 5 },
  { rollNo: 528, name: 'Prakhar Kushwaha', dob: '20/02/2015', class: 5 },
  { rollNo: 529, name: 'Pratibha Yadav', dob: '14/02/2016', class: 5 },
  { rollNo: 530, name: 'Pukar Kori', dob: '22/07/2015', class: 5 },
  { rollNo: 531, name: 'Puneshwar Uikey', dob: '19/11/2014', class: 5 },
  { rollNo: 532, name: 'Purvika Patel', dob: '09/11/2015', class: 5 },
  { rollNo: 533, name: 'Riona Popatkar', dob: '09/11/2015', class: 5 },
  { rollNo: 534, name: 'Shourya Mishra', dob: '10/03/2015', class: 5 },
  { rollNo: 535, name: 'Siddhi Yadav', dob: '24/08/2015', class: 5 },
  { rollNo: 536, name: 'Suryansh Mishra', dob: '24/01/2016', class: 5 },
  { rollNo: 537, name: 'Sushant Jhariya', dob: '31/12/2015', class: 5 },
  { rollNo: 538, name: 'Talin Baraskar', dob: '05/01/2016', class: 5 },
  { rollNo: 539, name: 'Vaidehi Dubey', dob: '17/09/2015', class: 5 },
  { rollNo: 540, name: 'Virat Singh', dob: '11/06/2015', class: 5 },
  { rollNo: 541, name: 'Pragya Thakur', dob: '15/08/2015', class: 5 },
];

export const SUBJECTS_CONFIG: Record<SubjectKey, SubjectInfo> = {
  english: {
    key: 'english',
    name: 'English',
    flag: '🔤',
    teacherName: "Ms. Riya Verma Ma'am",
    iconName: 'BookOpen',
    color: 'emerald',
  },
  twau: {
    key: 'twau',
    name: 'TWAU',
    flag: '🔬',
    teacherName: "Mrs. Smriti Vats Ma'am",
    iconName: 'Microscope',
    color: 'indigo',
  },
  maths: {
    key: 'maths',
    name: 'Maths',
    flag: '➗',
    teacherName: 'Mr. Umesh Kumar Chourasiya Sir',
    iconName: 'Divide',
    color: 'amber',
  },
  hindi: {
    key: 'hindi',
    name: 'Hindi',
    flag: 'अ',
    teacherName: 'Ms. Sakshi Baliyan',
    iconName: 'Languages',
    color: 'orange',
  },
};

export const SUBJECT_ORDER: SubjectKey[] = ['english', 'twau', 'maths', 'hindi'];

// Utility function to check if today is student's birthday
export function isBirthdayToday(dobString: string, referenceDate: Date = new Date()): boolean {
  if (!dobString) return false;
  const parts = dobString.split('/');
  if (parts.length < 2) return false;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-indexed

  const todayDay = referenceDate.getDate();
  const todayMonth = referenceDate.getMonth() + 1;

  return day === todayDay && month === todayMonth;
}
