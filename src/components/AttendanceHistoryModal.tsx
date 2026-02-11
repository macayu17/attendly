import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Check, XIcon, Slash, Plus, Clock, Calendar } from 'lucide-react'
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
    const { subjects, attendanceLogs, timetable, holidays, events, semesterSettings, markAttendance, deleteAttendanceLog, loading } = useAttendanceStore()
    const { user } = useAuthStore()
    const { message, flash } = useMarkFeedback()


    const dateString = format(selectedDate, 'yyyy-MM-dd')
    const displayDate = format(selectedDate, 'EEEE, MMMM d, yyyy')
    const dayOfWeek = getDay(selectedDate) // 0 = Sunday, 6 = Saturday

    // Get subjects scheduled for this day from timetable
    const scheduledSubjectIds = useMemo(() => {
        // Check if date is within semester settings
        if (semesterSettings.startDate && dateString < semesterSettings.startDate) return []
        if (semesterSettings.endDate && dateString > semesterSettings.endDate) return []

        return [...new Set(
            timetable
                .filter(t => t.day_of_week === dayOfWeek)
                .map(t => t.subject_id)
        )]
    }, [timetable, dayOfWeek, dateString, semesterSettings])

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
            // If outside semester, no scheduled times (unless explicitly logged? No, logs are separate)
            let scheduledTimes: string[] = []

            const isWithinSemester =
                (!semesterSettings.startDate || dateString >= semesterSettings.startDate) &&
                (!semesterSettings.endDate || dateString <= semesterSettings.endDate)

            if (isWithinSemester) {
                scheduledTimes = timetable
                    .filter(t => t.subject_id === subject.id && t.day_of_week === dayOfWeek)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map(t => t.start_time.slice(0, 5))
            }

            // Create combined sessions list (logs + scheduled placeholders)
            const maxSessionNum = Math.max(
                logs.length > 0 ? Math.max(...logs.map(l => l.session_number || 1)) : 0,
                scheduledTimes.length
            )

            const sessions = []
            for (let i = 1; i <= maxSessionNum; i++) {
                const existingLog = logs.find(l => (l.session_number || 1) === i)
                if (existingLog) {
                    sessions.push(existingLog)
                } else if (i <= scheduledTimes.length) {
                    // Create virtual session for scheduled time
                    sessions.push({
                        id: `virtual-${subject.id}-${i}`,
                        subject_id: subject.id,
                        user_id: user?.id || '',
                        status: null, // No status yet
                        marked_at: dateString,
                        session_number: i,
                        created_at: new Date().toISOString()
                    })
                }
            }

            return {
                subject,
                sessions,
                scheduledTimes,
                isScheduled: scheduledSubjectIds.includes(subject.id)
            }
        })
    }, [subjectsToShow, attendanceLogs, dateString, timetable, dayOfWeek, scheduledSubjectIds, user, semesterSettings])

    const handleStatusChange = async (subjectId: string, sessionNumber: number, newStatus: 'present' | 'absent' | 'cancelled' | null, existingLogId?: string) => {
        if (!user) return

        // If clicking same status, clear it (unselect)
        if (newStatus === null && existingLogId) {
            const ok = await deleteAttendanceLog(existingLogId)
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

    const goToPreviousDay = () => setSelectedDate(prev => {
        const newDate = subDays(prev, 1)
        return getDay(newDate) === 0 ? subDays(newDate, 1) : newDate
    })

    const goToNextDay = () => setSelectedDate(prev => {
        const newDate = addDays(prev, 1)
        return getDay(newDate) === 0 ? addDays(newDate, 1) : newDate
    })

    const goToToday = () => {
        const today = new Date()
        setSelectedDate(getDay(today) === 0 ? addDays(today, 1) : today)
    }

    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    const holiday = holidays.find(h => h.date === dateString)
    const event = events.find(e => dateString >= e.start_date && dateString <= e.end_date)


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
                                    <div className="relative group">
                                        <p className="text-white font-semibold cursor-pointer flex items-center justify-center gap-2">
                                            {displayDate}
                                            <Calendar className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-white/60" />
                                        </p>
                                        <input
                                            type="date"
                                            value={dateString}
                                            onChange={(e) => {
                                                if (e.target.value) {

                                                    const [y, m, day] = e.target.value.split('-').map(Number)
                                                    const newDate = new Date(y, m - 1, day)

                                                    setSelectedDate(getDay(newDate) === 0 ? addDays(newDate, 1) : newDate)
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                    </div>
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

                            {/* Holiday/Event Banner */}
                            {(holiday || event) && (
                                <div className={`mb-4 p-4 rounded-2xl border flex items-center gap-3 ${holiday
                                        ? 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-indigo-500/20'
                                        : 'bg-gradient-to-br from-blue-500/20 to-teal-600/20 border-blue-500/20'
                                    }`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${holiday ? 'bg-indigo-500/20' : 'bg-blue-500/20'
                                        }`}>
                                        {holiday ? '🎉' : '📅'}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{holiday?.name || event?.name}</p>
                                        <p className="text-white/60 text-xs">
                                            {holiday ? 'No classes today... hopefully!' : `${event?.event_type === 'exam' ? 'Exam' : 'Event'} Day`}
                                        </p>
                                    </div>
                                </div>
                            )}

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
                                                            key={session.id || `session-${session.session_number}`}
                                                            className="flex items-center justify-between pl-6 py-2 rounded-xl bg-white/5"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-white/50">
                                                                    Session {session.session_number || 1}
                                                                </span>
                                                                {session.status === null && scheduledTimes[session.session_number! - 1] && (
                                                                    <span className="text-xs text-white/30">
                                                                        {scheduledTimes[session.session_number! - 1]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleStatusChange(
                                                                        subject.id,
                                                                        session.session_number || 1,
                                                                        session.status === 'present' ? null : 'present',
                                                                        session.id.startsWith('virtual') ? undefined : session.id
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
                                                                        session.id.startsWith('virtual') ? undefined : session.id
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
                                                                        session.id.startsWith('virtual') ? undefined : session.id
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
