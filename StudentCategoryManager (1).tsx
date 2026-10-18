import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Send,
  RefreshCw,
  Layers,
  Award,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Student, StudentCategory } from '../types';
import { CLASS_5_STUDENTS, STUDENT_CATEGORIES, CATEGORY_ORDER } from '../studentData';
import { api } from '../lib/api';

interface StudentCategoryManagerProps {
  categories: Record<number, StudentCategory>;
  onCategoriesChange: (updated: Record<number, StudentCategory>) => void;
  onNavigateToPasteHW?: (category?: StudentCategory | 'all') => void;
}

export const StudentCategoryManager: React.FC<StudentCategoryManagerProps> = ({
  categories,
  onCategoriesChange,
  onNavigateToPasteHW,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'all' | StudentCategory | 'unassigned'>('all');
  const [updatingRoll, setUpdatingRoll] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Category counts
  const stats = useMemo(() => {
    let beginnerCount = 0;
    let progressiveCount = 0;
    let proficientCount = 0;
    let unassignedCount = 0;

    CLASS_5_STUDENTS.forEach((st) => {
      const cat = categories[st.rollNo];
      if (cat === 'beginner') beginnerCount++;
      else if (cat === 'progressive') progressiveCount++;
      else if (cat === 'proficient') proficientCount++;
      else unassignedCount++;
    });

    return {
      total: CLASS_5_STUDENTS.length,
      unassigned: unassignedCount,
      beginner: beginnerCount,
      progressive: progressiveCount,
      proficient: proficientCount,
    };
  }, [categories]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return CLASS_5_STUDENTS.filter((st) => {
      const cat = categories[st.rollNo];
      if (filterCategory === 'unassigned') {
        if (cat) return false;
      } else if (filterCategory !== 'all') {
        if (cat !== filterCategory) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = st.name.toLowerCase().includes(q);
        const matchesRoll = st.rollNo.toString().includes(q);
        if (!matchesName && !matchesRoll) return false;
      }
      return true;
    });
  }, [categories, filterCategory, searchQuery]);

  // Change individual student category (or unassign)
  const handleChangeCategory = async (rollNo: number, newCategory: StudentCategory | 'unassigned', studentName: string) => {
    const prevCategory = categories[rollNo];
    if (newCategory !== 'unassigned' && prevCategory === newCategory) return;
    if (newCategory === 'unassigned' && !prevCategory) return;

    // Optimistic UI update
    const updated = { ...categories };
    if (newCategory === 'unassigned') {
      delete updated[rollNo];
    } else {
      updated[rollNo] = newCategory;
    }
    onCategoriesChange(updated);
    setUpdatingRoll(rollNo);

    try {
      await api.updateStudentCategory(rollNo, newCategory as any);
      if (newCategory === 'unassigned') {
        setSuccessToast(`Removed category for ${studentName} (Roll ${rollNo})`);
      } else {
        const catLabel = STUDENT_CATEGORIES[newCategory].label;
        setSuccessToast(`Updated ${studentName} (Roll ${rollNo}) to ${catLabel}`);
      }
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Failed to update student category:', err);
      // Revert on error
      if (prevCategory) {
        onCategoriesChange({ ...categories, [rollNo]: prevCategory });
      } else {
        const reverted = { ...categories };
        delete reverted[rollNo];
        onCategoriesChange(reverted);
      }
    } finally {
      setUpdatingRoll(null);
    }
  };

  // Bulk update all displayed students to a category
  const handleBulkSetCategory = async (targetCategory: StudentCategory) => {
    const targetLabel = STUDENT_CATEGORIES[targetCategory].label;
    if (
      !confirm(
        `Are you sure you want to change all ${filteredStudents.length} selected students to "${targetLabel}"?`
      )
    ) {
      return;
    }

    const updates = filteredStudents.map((s) => ({
      rollNo: s.rollNo,
      category: targetCategory,
    }));

    const newCats = { ...categories };
    updates.forEach((u) => {
      newCats[u.rollNo] = u.category;
    });
    onCategoriesChange(newCats);

    try {
      await api.bulkUpdateStudentCategories(updates);
      setSuccessToast(`Updated ${updates.length} students to ${targetLabel}`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Failed bulk category update:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-purple-950/20 border border-purple-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
              👥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-200 bg-purple-800/80 px-3 py-0.5 rounded-full border border-purple-600/50">
                  Differentiated Learning
                </span>
                <span className="text-xs font-bold text-purple-200">Class 5 (41 Students)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">
                Student Types & Learning Categories
              </h1>
              <p className="text-sm text-purple-100/90 mt-1 max-w-2xl">
                Classify each student into <strong>Beginner</strong>, <strong>Progressive</strong>, or{' '}
                <strong>Proficient</strong>. Teachers can change any student at any time and paste
                targeted homework for each group!
              </p>
            </div>
          </div>

          {onNavigateToPasteHW && (
            <button
              onClick={() => onNavigateToPasteHW('beginner')}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer self-start md:self-auto shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>🎯 Paste Category HW</span>
            </button>
          )}
        </div>

        {/* Category Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-white/10">
          {/* Beginner Card */}
          <div
            onClick={() => setFilterCategory('beginner')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'beginner'
                ? 'bg-emerald-500/20 border-emerald-400/60 ring-2 ring-emerald-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                🌱 Beginner
              </span>
              <span className="text-xl font-black text-white">{stats.beginner}</span>
            </div>
            <p className="text-[11px] text-emerald-100/80 mt-1">
              Foundational step-by-step guided practice
            </p>
          </div>

          {/* Progressive Card */}
          <div
            onClick={() => setFilterCategory('progressive')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'progressive'
                ? 'bg-blue-500/20 border-blue-400/60 ring-2 ring-blue-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-300 uppercase tracking-wider">
                📈 Progressive
              </span>
              <span className="text-xl font-black text-white">{stats.progressive}</span>
            </div>
            <p className="text-[11px] text-blue-100/80 mt-1">
              Standard grade-level curriculum & strengthening
            </p>
          </div>

            {/* Proficient Card */}
          <div
            onClick={() => setFilterCategory('proficient')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'proficient'
                ? 'bg-purple-500/20 border-purple-400/60 ring-2 ring-purple-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-300 uppercase tracking-wider">
                ⭐ Proficient
              </span>
              <span className="text-xl font-black text-white">{stats.proficient}</span>
            </div>
            <p className="text-[11px] text-purple-100/80 mt-1">
              Advanced challenges, deep practice & enrichment
            </p>
          </div>

          {/* Unassigned Card */}
          <div
            onClick={() => setFilterCategory('unassigned')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterCategory === 'unassigned'
                ? 'bg-amber-500/20 border-amber-400/60 ring-2 ring-amber-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                ⏳ Unassigned
              </span>
              <span className="text-xl font-black text-white">{stats.unassigned}</span>
            </div>
            <p className="text-[11px] text-amber-100/80 mt-1">
              Awaiting teacher selection / general pace
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-purple-950/60 rounded-2xl border border-purple-700/40 text-xs text-purple-200 flex items-center gap-2">
          <span>🔒</span>
          <span>
            <strong>Privacy Guarantee:</strong> Students will never see what type or learning category they belong to. Only teachers can view and select categories.
          </span>
        </div>
      </div>

      {/* Filter and Bulk Action Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/70 border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mr-1">
              Filter:
            </span>
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterCategory('unassigned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                filterCategory === 'unassigned'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              ⏳ Unassigned ({stats.unassigned})
            </button>
            {CATEGORY_ORDER.map((ck) => {
              const catInfo = STUDENT_CATEGORIES[ck];
              const isSelected = filterCategory === ck;
              const count =
                ck === 'beginner'
                  ? stats.beginner
                  : ck === 'progressive'
                  ? stats.progressive
                  : stats.proficient;
              return (
                <button
                  key={ck}
                  onClick={() => setFilterCategory(ck)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${catInfo.badgeColor} ring-2 ring-purple-500/40 shadow-sm`
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{catInfo.label}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or roll..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-black"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold">
            Showing <strong>{filteredStudents.length}</strong> of {CLASS_5_STUDENTS.length} students. Click any category button below to change that student.
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Batch Set Filtered:</span>
            <button
              onClick={() => handleBulkSetCategory('beginner')}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-bold text-[11px] cursor-pointer"
            >
              🌱 Set all to Beginner
            </button>
            <button
              onClick={() => handleBulkSetCategory('progressive')}
              className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-lg font-bold text-[11px] cursor-pointer"
            >
              📈 Set all to Progressive
            </button>
            <button
              onClick={() => handleBulkSetCategory('proficient')}
              className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 rounded-lg font-bold text-[11px] cursor-pointer"
            >
              ⭐ Set all to Proficient
            </button>
          </div>
        </div>
      </div>

      {/* Student Category List */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">Roll</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Current Category</th>
                <th className="py-3.5 px-4 text-center">Change Category (1-Click)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((st) => {
                const currentCat = categories[st.rollNo];
                const currentCatInfo = currentCat ? STUDENT_CATEGORIES[currentCat] : null;
                const isUpdating = updatingRoll === st.rollNo;

                return (
                  <tr
                    key={st.rollNo}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Roll No */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-black inline-flex items-center justify-center text-xs group-hover:bg-purple-100 group-hover:text-purple-900 transition-colors">
                        {st.rollNo}
                      </span>
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-slate-900 text-sm">{st.name}</div>
                      <div className="text-[10px] text-slate-400">Class 5 • DOB: {st.dob}</div>
                    </td>

                    {/* Current Category Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {currentCatInfo ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${currentCatInfo.badgeColor}`}
                        >
                          <span>{currentCatInfo.label}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          ⏳ Not Assigned
                        </span>
                      )}
                    </td>

                    {/* Category Selector Buttons */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center p-1 bg-slate-100 rounded-2xl gap-1 border border-slate-200">
                        {CATEGORY_ORDER.map((catKey) => {
                          const catInfo = STUDENT_CATEGORIES[catKey];
                          const isActive = currentCat === catKey;

                          return (
                            <button
                              key={catKey}
                              disabled={isUpdating}
                              onClick={() => handleChangeCategory(st.rollNo, catKey, st.name)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                                isActive
                                  ? `${catInfo.badgeColor} shadow-md ring-2 ring-slate-900/10 scale-102`
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                              } ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                              title={`Set ${st.name} to ${catInfo.name}`}
                            >
                              <span>{catInfo.label}</span>
                              {isActive && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                            </button>
                          );
                        })}

                        {currentCat && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleChangeCategory(st.rollNo, 'unassigned', st.name)}
                            className="px-2 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl font-bold cursor-pointer transition-colors"
                            title="Clear assignment (set to Unassigned)"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
