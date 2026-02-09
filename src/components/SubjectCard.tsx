import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Minus, Trash2, Pencil } from 'lucide-react'
import { AttendanceRing } from './AttendanceRing'
import { EditSubjectModal } from './EditSubjectModal'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { useAuthStore } from '@/stores/authStore'
import { calculateBunkBuffer } from '@/hooks/useAttendance'
import { useMarkFeedback } from '@/hooks/useMarkFeedback'

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
    const { markAttendance, deleteSubject, loading } = useAttendanceStore()
    const { user } = useAuthStore()
    const [showEditModal, setShowEditModal] = useState(false)
    const { message, flash } = useMarkFeedback()

    const total = subject.present + subject.absent
    const bunkBuffer = calculateBunkBuffer(subject.present, total, subject.min_attendance_req)
    const isAboveGoal = subject.percentage >= subject.min_attendance_req

    const handleMark = async (status: 'present' | 'absent' | 'cancelled') => {
        if (!user || loading) return
        const ok = await markAttendance(subject.id, user.id, status)
        const label = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Cancelled'
        flash(ok ? `Marked ${label}` : 'Could not mark attendance')
    }

    const handleDelete = async () => {
        if (!confirm(`Delete "${subject.name}"?`)) return
        await deleteSubject(subject.id)
    }

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-5 relative group"
            >
                <div className="flex justify-between items-start mb-4">
                    <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setShowEditModal(true)}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                                style={{ color: subject.color_code, backgroundColor: subject.color_code }}
                            />
                            <h3 className="font-semibold text-white tracking-tight">{subject.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            {subject.code && <span className="text-xs text-foreground-muted">{subject.code}</span>}
                            {subject.credits && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-medium">
                                    {subject.credits} Cr
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="p-2 rounded-full hover:bg-white/10 text-foreground-muted hover:text-white transition-colors"
                            title="Edit subject"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 rounded-full hover:bg-white/10 text-foreground-muted hover:text-red-400 transition-colors"
                            title="Delete subject"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-6 mb-6">
                    <AttendanceRing percentage={subject.percentage} size={64} strokeWidth={5} color={subject.color_code} />

                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-foreground-muted">Status</span>
                            <span className={`text-xs font-medium ${isAboveGoal ? 'text-green-400' : 'text-amber-400'}`}>
                                {isAboveGoal ? 'On Track' : 'Risk'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-foreground-muted">Buffer</span>
                            <span className="text-xs font-mono text-white">{bunkBuffer}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => handleMark('present')}
                        disabled={loading}
                        className="btn glass-panel border-0 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2 rounded-xl flex justify-center"
                    >
                        <Check className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => handleMark('absent')}
                        disabled={loading}
                        className="btn glass-panel border-0 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-xl flex justify-center"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => handleMark('cancelled')}
                        disabled={loading}
                        className="btn glass-panel border-0 bg-white/5 hover:bg-white/10 text-foreground-muted py-2 rounded-xl flex justify-center"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                </div>
                {message && (
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
