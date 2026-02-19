import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, FileText, Briefcase } from 'lucide-react'
import { usePlacementStore } from '@/stores/placementStore'
import { useAuthStore } from '@/stores/authStore'
import { format } from 'date-fns'

interface AddPlacementSessionModalProps {
    isOpen: boolean
    onClose: () => void
    prefilledDate?: string
}

export function AddPlacementSessionModal({ isOpen, onClose, prefilledDate }: AddPlacementSessionModalProps) {
    const { addSession, loading } = usePlacementStore()
    const { user } = useAuthStore()

    const [name, setName] = useState('')
    const [date, setDate] = useState(prefilledDate || format(new Date(), 'yyyy-MM-dd'))
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [notes, setNotes] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !name.trim()) return

        const ok = await addSession({
            user_id: user.id,
            name: name.trim(),
            date,
            start_time: startTime || null,
            end_time: endTime || null,
            notes: notes.trim() || null,
            status: 'pending',
        })

        if (ok) {
            setName('')
            setStartTime('')
            setEndTime('')
            setNotes('')
            onClose()
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md rounded-2xl bg-[#0A0A0F] border border-white/10 p-6 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Add Session</h2>
                                    <p className="text-xs text-muted">Placement Training</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-muted" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Session Name */}
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                                    Session Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Aptitude Mock Test, GD Practice"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
                                    required
                                    autoFocus
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm [color-scheme:dark]"
                                    required
                                />
                            </div>

                            {/* Time Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                                    <FileText className="w-3 h-3 inline mr-1" />
                                    Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any notes about this session..."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-colors text-sm resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {loading ? 'Adding...' : 'Add Session'}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
