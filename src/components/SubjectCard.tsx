import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Minus, Trash2, Pencil } from 'lucide-react'
import { AttendanceRing } from './AttendanceRing'
import { EditSubjectModal } from './EditSubjectModal'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { useAuthStore } from '@/stores/authStore'
import { calculateBunkBuffer } from '@/hooks/useAttendance'
import { useMarkFeedback } from '@/hooks/useMarkFeedback'
import { format } from 'date-fns'

interface SubjectCardProps {
    subject: {
        id: string
        name: string
        code: string | null
        color_code: string
        min_attendance_req: number
        credits?: number
        present: number
        absent: number
        percentage: number
    }
    index?: number
}

export function SubjectCard({ subject, index = 0 }: SubjectCardProps) {
    const { markAttendance, deleteSubject, loading, attendanceLogs, deleteAttendanceLog } = useAttendanceStore()
    const { user } = useAuthStore()
    const [showEditModal, setShowEditModal] = useState(false)
    const { message, flash } = useMarkFeedback()

    const total = subject.present + subject.absent
    const bunkBuffer = calculateBunkBuffer(subject.present, total, subject.min_attendance_req)
    const isAboveGoal = subject.percentage >= subject.min_attendance_req

    // Find today's log for this subject
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayLog = attendanceLogs.find(l => l.subject_id === subject.id && l.marked_at === today)

    const handleMark = async (status: 'present' | 'absent' | 'cancelled') => {
        if (!user || loading) return

        // Deselect if clicking the same status
        if (todayLog && todayLog.status === status) {
            const ok = await deleteAttendanceLog(todayLog.id)
            flash(ok ? 'Attendance removed' : 'Could not remove attendance')
            return
        }

        const ok = await markAttendance(subject.id, user.id, status)
        const label = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Cancelled'
        flash(ok ? `Marked ${label}` : 'Could not mark attendance')
    }

    const handleDelete = async () => {
        if (!confirm(`Delete "${subject.name}"?`)) return
        await deleteSubject(subject.id)
    }

    const { events } = useAttendanceStore()
    const blockingEvent = events.find(e =>
        today >= e.start_date &&
        today <= e.end_date &&
        !e.counts_attendance
    )

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-2.5 md:p-4 relative group"
            >
                <div className="flex justify-between items-start mb-2 md:mb-4">
                    <div
                        className="flex-1 cursor-pointer min-w-0" // added min-w-0
                        onClick={() => setShowEditModal(true)}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] shrink-0" // added shrink-0
                                style={{ color: subject.color_code, backgroundColor: subject.color_code }}
                            />
                            <h3
                                className="font-semibold text-white tracking-tight leading-tight transition-all duration-200 group-hover:truncate group-hover:pr-16"
                                title={subject.name}
                            >
                                {subject.name}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            {subject.code && <span className="text-xs text-foreground-muted">{subject.code}</span>}
                            {!!subject.credits && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-medium">
                                    {subject.credits} Cr
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-colors backdrop-blur-sm"
                            title="Edit subject"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-red-400 transition-colors backdrop-blur-sm"
                            title="Delete subject"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Mobile: ring + stats + buttons in one row */}
                <div className="flex md:hidden items-center gap-2.5 mb-1.5">
                    <AttendanceRing percentage={subject.percentage} size={42} strokeWidth={4} color={subject.color_code} />
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs text-foreground-muted">Status</span>
                            <span className={`text-xs font-medium ${isAboveGoal ? 'text-green-400' : 'text-amber-400'}`}>
                                {isAboveGoal ? 'On Track' : 'Risk'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-foreground-muted">Progress</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono text-white/90">
                                    {subject.present}/{total}
                                </span>
                                <span className="text-[10px] text-foreground-muted">•</span>
                                <span className={`text-xs font-mono ${Number(bunkBuffer) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {Number(bunkBuffer) > 0 ? '+' : ''}{bunkBuffer}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-row gap-1 shrink-0 ml-1">
                        <button
                            onClick={() => !blockingEvent && handleMark('present')}
                            disabled={loading || !!blockingEvent}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 ${todayLog?.status === 'present'
                                ? 'bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                                : blockingEvent
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                                }`}
                            title={blockingEvent ? `Event: ${blockingEvent.name}` : 'Mark Present'}
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => !blockingEvent && handleMark('absent')}
                            disabled={loading || !!blockingEvent}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 ${todayLog?.status === 'absent'
                                ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                                : blockingEvent
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                }`}
                            title={blockingEvent ? `Event: ${blockingEvent.name}` : 'Mark Absent'}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => !blockingEvent && handleMark('cancelled')}
                            disabled={loading || !!blockingEvent}
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 ${todayLog?.status === 'cancelled'
                                ? 'bg-white/20 text-white shadow-[0_0_8px_rgba(255,255,255,0.1)]'
                                : blockingEvent
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-white/5 hover:bg-white/10 text-foreground-muted'
                                }`}
                            title={blockingEvent ? `Event: ${blockingEvent.name}` : 'Mark Cancelled'}
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Desktop: original ring + stats row */}
                <div className="hidden md:flex items-center gap-6 mb-4">
                    <AttendanceRing percentage={subject.percentage} size={64} strokeWidth={5} color={subject.color_code} />
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-foreground-muted">Status</span>
                            <span className={`text-xs font-medium ${isAboveGoal ? 'text-green-400' : 'text-amber-400'}`}>
                                {isAboveGoal ? 'On Track' : 'Risk'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-foreground-muted">Classes</span>
                            <span className="text-xs font-mono text-white">
                                {subject.present}/{total}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-foreground-muted">Buffer</span>
                            <span className="text-xs font-mono text-white">{bunkBuffer}</span>
                        </div>
                    </div>
                </div>

                {/* Desktop: 3-column button grid */}
                <div className="hidden md:grid grid-cols-3 gap-2">
                    <button
                        onClick={() => !blockingEvent && handleMark('present')}
                        disabled={loading || !!blockingEvent}
                        className={`btn glass-panel border-0 py-2 rounded-xl flex justify-center transition-all duration-200 ${todayLog?.status === 'present'
                            ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                            : blockingEvent
                                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                            }`}
                        title={blockingEvent ? `Event: ${blockingEvent.name}` : 'Mark Present'}
                    >
                        <Check className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => !blockingEvent && handleMark('absent')}
                        disabled={loading || !!blockingEvent}
                        className={`btn glass-panel border-0 py-2 rounded-xl flex justify-center transition-all duration-200 ${todayLog?.status === 'absent'
                            ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                            : blockingEvent
                                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                            }`}
                        title={blockingEvent ? `Event: ${blockingEvent.name}` : 'Mark Absent'}
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => !blockingEvent && handleMark('cancelled')}
                        disabled={loading || !!blockingEvent}
                        className={`btn glass-panel border-0 py-2 rounded-xl flex justify-center transition-all duration-200 ${todayLog?.status === 'cancelled'
                            ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                            : blockingEvent
                                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                : 'bg-white/5 hover:bg-white/10 text-foreground-muted'
                            }`}
                        title={blockingEvent ? `Event: ${blockingEvent.name}` : 'Mark Cancelled'}
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                </div>
                {blockingEvent && (
                    <div className="mt-2 text-xs text-indigo-300/80 font-medium text-center bg-indigo-500/10 py-1 rounded">
                        📅 {blockingEvent.name}
                    </div>
                )}
                {message && !blockingEvent && (
                    <div className="mt-3 text-xs text-white/60">
                        {message}
                    </div>
                )}
            </motion.div>

            <EditSubjectModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                subject={subject}
            />
        </>
    )
}
