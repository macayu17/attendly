import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Briefcase, Check, X, Trash2, Clock, FileText, Target, ChevronDown, ChevronRight } from 'lucide-react'
import { usePlacementStore } from '@/stores/placementStore'
import { useAuthStore } from '@/stores/authStore'
import { AddPlacementSessionModal } from '@/components/AddPlacementSessionModal'
import { format, parseISO, isToday, isTomorrow, isYesterday, parse } from 'date-fns'

export function PlacementPage() {
    const { user } = useAuthStore()
    const { sessions, loading, fetchSessions, updateSessionStatus, deleteSession } = usePlacementStore()
    const [showAddModal, setShowAddModal] = useState(false)

    // Track expanded dates
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (user) fetchSessions(user.id)
    }, [user, fetchSessions])

    // Auto-expand today when sessions load
    useEffect(() => {
        if (sessions.length > 0) {
            const todayStr = format(new Date(), 'yyyy-MM-dd')
            // If today exists in sessions, expand it. If not, maybe don't expand anything or expand the first strictly future date?
            // User asked: "present day to only be expanded and displayed bydefault"
            setExpandedDates(new Set([todayStr]))
        }
    }, [sessions.length]) // Only run when sessions change length (initial load)

    const toggleDate = (dateStr: string) => {
        setExpandedDates(prev => {
            const next = new Set(prev)
            if (next.has(dateStr)) {
                next.delete(dateStr)
            } else {
                next.add(dateStr)
            }
            return next
        })
    }

    // Stats
    const stats = useMemo(() => {
        const total = sessions.length
        const attended = sessions.filter(s => s.status === 'attended').length
        const missed = sessions.filter(s => s.status === 'missed').length
        const pending = sessions.filter(s => s.status === 'pending').length
        const rate = (attended + missed) > 0 ? Math.round((attended / (attended + missed)) * 100) : 0
        return { total, attended, missed, pending, rate }
    }, [sessions])

    // Group by date — ascending order
    const groupedSessions = useMemo(() => {
        const groups: Record<string, typeof sessions> = {}
        sessions.forEach(s => {
            if (!groups[s.date]) groups[s.date] = []
            groups[s.date].push(s)
        })
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    }, [sessions])

    const getDateLabel = (dateStr: string) => {
        const date = parseISO(dateStr)
        if (isToday(date)) return 'Today'
        if (isTomorrow(date)) return 'Tomorrow'
        if (isYesterday(date)) return 'Yesterday'
        return format(date, 'EEEE')
    }

    // Helper to format 24h time to 12h
    const formatTime12h = (time24: string) => {
        try {
            // Parse HH:mm:ss or HH:mm
            const date = parse(time24.slice(0, 5), 'HH:mm', new Date())
            return format(date, 'h:mm a')
        } catch (e) {
            return time24.slice(0, 5)
        }
    }

    return (
        <div className="container pt-2 pb-8 md:pt-8 md:pb-16 relative z-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-4 md:mb-8"
            >
                <div className="flex items-center gap-2 md:gap-3 mb-1">
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Briefcase className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-4xl font-bold text-white tracking-tight">
                            Placement Training
                        </h1>
                        <p className="text-muted text-[10px] md:text-sm">Track your placement prep sessions</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-1.5 md:gap-4 mb-6 md:mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-2.5 md:p-6 text-center"
                >
                    <span className="text-xl md:text-4xl font-bold text-white">{stats.total}</span>
                    <p className="text-[9px] md:text-xs text-muted mt-0.5 uppercase tracking-wider">Total</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="card p-2.5 md:p-6 text-center"
                >
                    <span className="text-xl md:text-4xl font-bold text-green-400">{stats.attended}</span>
                    <p className="text-[9px] md:text-xs text-muted mt-0.5 uppercase tracking-wider">Done</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-2.5 md:p-6 text-center"
                >
                    <span className="text-xl md:text-4xl font-bold text-red-400">{stats.missed}</span>
                    <p className="text-[9px] md:text-xs text-muted mt-0.5 uppercase tracking-wider">Missed</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="card p-2.5 md:p-6 text-center"
                >
                    <span className="text-xl md:text-4xl font-bold text-amber-400">{stats.rate}%</span>
                    <p className="text-[9px] md:text-xs text-muted mt-0.5 uppercase tracking-wider">Rate</p>
                </motion.div>
            </div>

            {/* Add Session + Section Title */}
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-base md:text-xl font-bold text-white">Sessions</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-xs md:text-sm hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/20"
                >
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Add
                </button>
            </div>

            {/* Sessions List */}
            {sessions.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-10 md:p-16 text-center border-dashed border-2 border-white/10 bg-transparent"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                        <Target className="w-8 h-8 md:w-10 md:h-10 text-amber-400/50" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-white mb-1.5">No sessions yet</h3>
                    <p className="text-muted text-xs md:text-sm mb-4 md:mb-6 max-w-sm mx-auto">
                        Add your first placement training session to start tracking.
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold px-5 py-2.5 rounded-full hover:from-amber-600 hover:to-orange-700 transition-all text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add First Session
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {groupedSessions.map(([dateStr, dateSessions]) => {
                        const dateLabel = getDateLabel(dateStr)
                        const dateFormatted = format(parseISO(dateStr), 'MMM d, yyyy')
                        const dateAttended = dateSessions.filter(s => s.status === 'attended').length
                        const isExpanded = expandedDates.has(dateStr)

                        return (
                            <motion.div
                                key={dateStr}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card bg-[#0F0F11]/50 border border-white/5 overflow-hidden"
                            >
                                {/* Date Header Toggle */}
                                <button
                                    onClick={() => toggleDate(dateStr)}
                                    className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-muted" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-muted" />
                                        )}
                                        <div className="flex flex-col items-start gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${dateAttended === dateSessions.length && dateSessions.length > 0 ? 'bg-green-400' : dateSessions.some(s => s.status === 'pending') ? 'bg-amber-400 animate-pulse' : 'bg-white/30'}`} />
                                                <span className="text-white font-semibold text-sm md:text-base">{dateLabel}</span>
                                            </div>
                                            <span className="text-muted text-[10px] md:text-xs ml-3.5">{dateFormatted}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] md:text-xs text-muted font-mono bg-white/5 px-2 py-0.5 rounded-full">
                                        {dateAttended}/{dateSessions.length} Done
                                    </span>
                                </button>

                                {/* Expanded Sessions List */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-3 pb-3 md:px-4 md:pb-4 space-y-2 border-t border-white/5 pt-2">
                                                {dateSessions.map((session) => (
                                                    <div
                                                        key={session.id}
                                                        className="group relative flex items-center gap-2 md:gap-4 p-3 rounded-xl bg-[#0F0F11] border border-white/5 hover:border-white/10 transition-colors"
                                                    >
                                                        {/* Time Column 12h */}
                                                        <div className="flex flex-col items-center min-w-[44px] md:min-w-[60px] text-center border-r border-white/5 pr-2 md:pr-3">
                                                            {session.start_time ? (
                                                                <>
                                                                    <span className="text-white font-bold text-[10px] md:text-xs whitespace-nowrap">{formatTime12h(session.start_time)}</span>
                                                                    {session.end_time && (
                                                                        <span className="text-[8px] md:text-[10px] text-muted whitespace-nowrap">{formatTime12h(session.end_time)}</span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400/50" />
                                                                    <span className="text-[9px] md:text-[10px] text-muted">—</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Session Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <span
                                                                    className={`w-1.5 h-1.5 rounded-full ${session.status === 'attended' ? 'bg-green-500' : session.status === 'missed' ? 'bg-red-500' : 'bg-amber-500'}`}
                                                                />
                                                                <h3 className="text-white font-medium text-xs md:text-sm leading-tight truncate">{session.name}</h3>
                                                            </div>
                                                            {session.notes && (
                                                                <p className="text-[10px] text-muted truncate flex items-center gap-1 pl-3">
                                                                    <FileText className="w-2 h-2 shrink-0" />
                                                                    {session.notes}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                onClick={() => updateSessionStatus(session.id, session.status === 'attended' ? 'pending' : 'attended')}
                                                                disabled={loading}
                                                                className={`p-1.5 rounded-lg transition-colors ${session.status === 'attended'
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                                                    }`}
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => updateSessionStatus(session.id, session.status === 'missed' ? 'pending' : 'missed')}
                                                                disabled={loading}
                                                                className={`p-1.5 rounded-lg transition-colors ${session.status === 'missed'
                                                                    ? 'bg-red-500 text-white'
                                                                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                                    }`}
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('Delete this session?')) deleteSession(session.id)
                                                                }}
                                                                disabled={loading}
                                                                className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-all md:opacity-0 md:group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            <AddPlacementSessionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
            />
        </div>
    )
}
