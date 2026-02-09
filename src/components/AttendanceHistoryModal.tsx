import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Check, XIcon, Slash, Plus, Clock } from 'lucide-react'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { useAuthStore } from '@/stores/authStore'
import { format, addDays, subDays, getDay } from 'date-fns'
import { useMarkFeedback } from '@/hooks/useMarkFeedback'

interface AttendanceHistoryModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AttendanceHistoryModal({ isOpen, onClose }: AttendanceHistoryModalProps) {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [showAllSubjects, setShowAllSubjects] = useState(false)
    const { subjects, attendanceLogs, timetable, markAttendance, deleteAttendanceLog, loading } = useAttendanceStore()
    const { user } = useAuthStore()
    const { message, flash } = useMarkFeedback()

    const dateString = format(selectedDate, 'yyyy-MM-dd')
    const displayDate = format(selectedDate, 'EEEE, MMMM d, yyyy')
    const dayOfWeek = getDay(selectedDate) // 0 = Sunday, 6 = Saturday

    // Get subjects scheduled for this day from timetable
    const scheduledSubjectIds = useMemo(() => {
        return [...new Set(
            timetable
                .filter(t => t.day_of_week === dayOfWeek)
                .map(t => t.subject_id)
        )]
    }, [timetable, dayOfWeek])

    // Get subjects to show (scheduled OR with existing attendance)
    const subjectsToShow = useMemo(() => {
        if (showAllSubjects) return subjects

        const logsForDate = attendanceLogs.filter(l => l.marked_at === dateString)
        const subjectIdsWithLogs = logsForDate.map(l => l.subject_id)

        return subjects.filter(s =>
            scheduledSubjectIds.includes(s.id) || subjectIdsWithLogs.includes(s.id)
        )
    }, [subjects, scheduledSubjectIds, attendanceLogs, dateString, showAllSubjects])

    // Get all sessions for each subject on selected date
    const attendanceForDate = useMemo(() => {
        return subjectsToShow.map(subject => {
            const logs = attendanceLogs
                .filter(l => l.subject_id === subject.id && l.marked_at === dateString)
                .sort((a, b) => (a.session_number || 1) - (b.session_number || 1))

            // Get scheduled times for this subject today
            const scheduledTimes = timetable
                .filter(t => t.subject_id === subject.id && t.day_of_week === dayOfWeek)
                .map(t => t.start_time.slice(0, 5))

            return {
                subject,
                sessions: logs.length > 0 ? logs : [],
                scheduledTimes,
                isScheduled: scheduledSubjectIds.includes(subject.id)
            }
        })
    }, [subjectsToShow, attendanceLogs, dateString, timetable, dayOfWeek, scheduledSubjectIds])

    const handleStatusChange = async (subjectId: string, sessionNumber: number, newStatus: 'present' | 'absent' | 'cancelled' | null, existingLogId?: string) => {
        if (!user) return

        // If clicking same status, clear it (unselect)
        if (newStatus === null && existingLogId) {
            const ok = await deleteAttendanceLog(existingLogId, user.id)
            flash(ok ? 'Attendance cleared' : 'Could not update attendance')
        } else if (newStatus) {
            const ok = await markAttendance(subjectId, user.id, newStatus, dateString, sessionNumber)
            const label = newStatus === 'present' ? 'Present' : newStatus === 'absent' ? 'Absent' : 'Cancelled'
            flash(ok ? `Marked ${label}` : 'Could not mark attendance')
        }
    }

    const handleAddSession = async (subjectId: string) => {
        if (!user) return
        const subjectLogs = attendanceLogs.filter(
            l => l.subject_id === subjectId && l.marked_at === dateString
        )
        const nextSession = subjectLogs.length > 0
            ? Math.max(...subjectLogs.map(l => l.session_number || 1)) + 1
            : 1
        const ok = await markAttendance(subjectId, user.id, 'present', dateString, nextSession)
        flash(ok ? 'Added session (Present)' : 'Could not add session')
    }

    const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1))
    const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1))
    const goToToday = () => setSelectedDate(new Date())

    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.3, type: "spring", damping: 25 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute inset-[1px] rounded-3xl border border-white/10" />

                        <div className="relative p-8">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">📅 Attendance History</h2>
                                <div className="flex items-center gap-3">
                                    {message && (
                                        <span className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded-lg">
                                            {message}
                                        </span>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white/60" />
                                    </button>
                                </div>
                            </div>

                            {/* Date Navigator */}
                            <div className="flex items-center justify-between mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                <button
                                    onClick={goToPreviousDay}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-white" />
                                </button>
                                <div className="text-center">
                                    <p className="text-white font-semibold">{displayDate}</p>
                                    {!isToday && (
                                        <button
                                            onClick={goToToday}
                                            className="text-xs text-white/50 hover:text-white/80 transition-colors mt-1"
                                        >
                                            Jump to Today
                                        </button>
                                    )}
                                    {isToday && (
                                        <span className="text-xs text-green-400">Today</span>
                                    )}
                                </div>
                                <button
                                    onClick={goToNextDay}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Toggle: Show all subjects */}
                            <div className="flex items-center justify-between mb-4 px-1">
                                <span className="text-sm text-white/50">
                                    {showAllSubjects ? 'All Subjects' : 'Scheduled Classes Only'}
                                </span>
                                <button
                                    onClick={() => setShowAllSubjects(!showAllSubjects)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                >
                                    {showAllSubjects ? 'Show Scheduled Only' : 'Show All Subjects'}
                                </button>
                            </div>

                            {/* Attendance List */}
                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                {subjectsToShow.length === 0 ? (
                                    <div className="text-center py-8 text-white/50">
                                        {subjects.length === 0
                                            ? 'No subjects added yet'
                                            : 'No classes scheduled for this day'}
                                    </div>
                                ) : (
                                    attendanceForDate.map(({ subject, sessions, scheduledTimes, isScheduled }) => (
                                        <div
                                            key={subject.id}
                                            className="p-4 rounded-2xl bg-white/5 border border-white/10"
                                        >
                                            {/* Subject Header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: subject.color_code }}
                                                    />
                                                    <div>
                                                        <p className="text-white font-medium">{subject.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            {subject.code && (
                                                                <span className="text-xs text-white/40">{subject.code}</span>
                                                            )}
                                                            {scheduledTimes.length > 0 && (
                                                                <span className="flex items-center gap-1 text-xs text-white/30">
                                                                    <Clock className="w-3 h-3" />
                                                                    {scheduledTimes.join(', ')}
                                                                </span>
                                                            )}
                                                            {!isScheduled && (
                                                                <span className="text-xs text-yellow-500/70">(Extra)</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddSession(subject.id)}
                                                    disabled={loading}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-colors"
                                                    title="Add session"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Sessions */}
                                            {sessions.length === 0 ? (
                                                <div className="flex items-center justify-between pl-6 py-2 rounded-xl bg-white/5">
                                                    <span className="text-sm text-white/40">No attendance marked</span>
                                                    <div className="flex items-center gap-1">
                                                        {(['present', 'absent', 'cancelled'] as const).map(status => (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleAddSession(subject.id).then(() =>
                                                                    handleStatusChange(subject.id, 1, status)
                                                                )}
                                                                disabled={loading}
                                                                className={`w-7 h-7 rounded flex items-center justify-center transition-all bg-white/5 text-white/40 hover:bg-${status === 'present' ? 'green' : status === 'absent' ? 'red' : 'yellow'}-500/20 hover:text-${status === 'present' ? 'green' : status === 'absent' ? 'red' : 'yellow'}-400`}
                                                            >
                                                                {status === 'present' && <Check className="w-3 h-3" />}
                                                                {status === 'absent' && <XIcon className="w-3 h-3" />}
                                                                {status === 'cancelled' && <Slash className="w-3 h-3" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {sessions.map((session) => (
                                                        <div
                                                            key={session.id}
                                                            className="flex items-center justify-between pl-6 py-2 rounded-xl bg-white/5"
                                                        >
                                                            <span className="text-sm text-white/50">
                                                                Session {session.session_number || 1}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleStatusChange(
                                                                        subject.id,
                                                                        session.session_number || 1,
                                                                        session.status === 'present' ? null : 'present',
                                                                        session.status === 'present' ? session.id : undefined
                                                                    )}
                                                                    disabled={loading}
                                                                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${session.status === 'present'
                                                                            ? 'bg-green-500 text-white'
                                                                            : 'bg-white/5 text-white/40 hover:bg-green-500/20 hover:text-green-400'
                                                                        }`}
                                                                >
                                                                    <Check className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusChange(
                                                                        subject.id,
                                                                        session.session_number || 1,
                                                                        session.status === 'absent' ? null : 'absent',
                                                                        session.status === 'absent' ? session.id : undefined
                                                                    )}
                                                                    disabled={loading}
                                                                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${session.status === 'absent'
                                                                            ? 'bg-red-500 text-white'
                                                                            : 'bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400'
                                                                        }`}
                                                                >
                                                                    <XIcon className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusChange(
                                                                        subject.id,
                                                                        session.session_number || 1,
                                                                        session.status === 'cancelled' ? null : 'cancelled',
                                                                        session.status === 'cancelled' ? session.id : undefined
                                                                    )}
                                                                    disabled={loading}
                                                                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${session.status === 'cancelled'
                                                                            ? 'bg-yellow-500 text-white'
                                                                            : 'bg-white/5 text-white/40 hover:bg-yellow-500/20 hover:text-yellow-400'
                                                                        }`}
                                                                >
                                                                    <Slash className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-white/40">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span>Present</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span>Absent</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                    <span>Cancelled</span>
                                </div>
                                <span className="text-white/20">|</span>
                                <span>Click again to unselect</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
