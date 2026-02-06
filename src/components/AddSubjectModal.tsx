import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Sparkles } from 'lucide-react'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { useAuthStore } from '@/stores/authStore'

interface AddSubjectModalProps {
    isOpen: boolean
    onClose: () => void
}

const COLORS = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#eab308', // yellow
    '#ef4444', // red
    '#a855f7', // purple
    '#ec4899', // pink
    '#f97316', // orange
    '#06b6d4', // cyan
]

export function AddSubjectModal({ isOpen, onClose }: AddSubjectModalProps) {
    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [minAttendance, setMinAttendance] = useState(75)
    const [credits, setCredits] = useState(3)
    const [selectedColor, setSelectedColor] = useState(COLORS[0])

    const { addSubject, loading, error, clearError } = useAttendanceStore()
    const { user } = useAuthStore()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        await addSubject({
            user_id: user.id,
            name: name.trim(),
            code: code.trim() || null,
            color_code: selectedColor,
            min_attendance_req: minAttendance,
            credits,
        })

        // Check the store's error state directly after the action completes
        const storeError = useAttendanceStore.getState().error
        if (!storeError) {
            setName('')
            setCode('')
            setMinAttendance(75)
            setCredits(3)
            setSelectedColor(COLORS[0])
            onClose()
        }
    }

    const handleClose = () => {
        clearError()
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    {/* Backdrop with blur */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.3, type: "spring", damping: 25 }}
                        className="relative w-full max-w-md overflow-hidden rounded-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glassy Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute inset-[1px] rounded-3xl border border-white/10" />

                        {/* Glow Effect */}
                        <div
                            className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30"
                            style={{ background: selectedColor }}
                        />

                        {/* Content */}
                        <div className="relative p-8">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: `${selectedColor}20` }}
                                    >
                                        <Sparkles className="w-5 h-5" style={{ color: selectedColor }} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">New Subject</h2>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-white/60" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Subject Name */}
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">
                                        Subject Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                                        placeholder="e.g., Data Structures"
                                    />
                                </div>

                                {/* Subject Code */}
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">
                                        Subject Code <span className="text-white/30">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                                        placeholder="e.g., CS201"
                                    />
                                </div>

                                {/* Min Attendance */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-white/60">
                                            Required Attendance
                                        </label>
                                        <span className="text-lg font-bold text-white">{minAttendance}%</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="range"
                                            min="50"
                                            max="100"
                                            step="5"
                                            value={minAttendance}
                                            onChange={(e) => setMinAttendance(Number(e.target.value))}
                                            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
                                            style={{
                                                background: `linear-gradient(to right, ${selectedColor} 0%, ${selectedColor} ${(minAttendance - 50) * 2}%, rgba(255,255,255,0.1) ${(minAttendance - 50) * 2}%, rgba(255,255,255,0.1) 100%)`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Credits */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-white/60">
                                            Credits
                                        </label>
                                        <span className="text-lg font-bold text-white">{credits}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {[0, 1, 2, 3, 4].map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setCredits(c)}
                                                className={`flex-1 py-2 rounded-lg transition-all ${credits === c
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                                                    }`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color */}
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-3">
                                        Color Tag
                                    </label>
                                    <div className="flex gap-3 flex-wrap">
                                        {COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setSelectedColor(color)}
                                                className="w-10 h-10 rounded-xl transition-all duration-200"
                                                style={{
                                                    backgroundColor: color,
                                                    transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                                                    boxShadow: selectedColor === color
                                                        ? `0 0 0 3px rgba(0,0,0,0.5), 0 0 0 5px ${color}, 0 8px 20px ${color}50`
                                                        : `0 4px 12px ${color}30`,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !name.trim()}
                                        className="flex-1 px-6 py-3.5 rounded-xl bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Adding...
                                            </>
                                        ) : (
                                            'Add Subject'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
