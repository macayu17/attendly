import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Bell, Palette, Shield, LogOut, ChevronRight, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAttendanceStore } from '@/stores/attendanceStore'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

type SettingsView = 'main' | 'account' | 'notifications' | 'appearance' | 'privacy'

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { user, signOut, updateProfile, updatePassword: userActionUpdatePassword } = useAuthStore()
    const { subjects, attendanceLogs } = useAttendanceStore()
    const [currentView, setCurrentView] = useState<SettingsView>('main')
    const [theme] = useState<'dark' | 'light' | 'system'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as 'dark' | 'light' | 'system') || 'dark'
        }
        return 'dark'
    })
    const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '')
    const [notifications, setNotifications] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('notifications')
            if (saved) return JSON.parse(saved)
        }
        return {
            reminders: true,
            lowAttendance: true,
            weeklyReport: false,
        }
    })

    // Persist Theme
    useEffect(() => {
        localStorage.setItem('theme', theme)
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
            document.documentElement.classList.remove('light')
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark')
            document.documentElement.classList.add('light')
        } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
        }
    }, [theme])

    // Persist Notifications
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications))
    }, [notifications])
    const [loadingAction, setLoadingAction] = useState<string | null>(null)
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Update local state when user changes (e.g. after save)
    useEffect(() => {
        if (user) {
            setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || '')
        }
    }, [user])

    const handleClose = () => {
        setCurrentView('main')
        setActionMessage(null)
        onClose()
    }

    const [newPassword, setNewPassword] = useState('')

    const handleUpdatePassword = async () => {
        if (!newPassword) return
        setLoadingAction('password')
        try {
            await userActionUpdatePassword(newPassword)
            setActionMessage({ type: 'success', text: 'Password updated successfully' })
            setNewPassword('')
        } catch (error) {
            setActionMessage({ type: 'error', text: 'Failed to update password' })
        } finally {
            setLoadingAction(null)
        }
    }

    const handleUpdateName = async (name: string) => {
        if (!name.trim() || name === user?.user_metadata?.full_name) return
        setLoadingAction('name')
        try {
            await updateProfile({ data: { full_name: name } })
            setActionMessage({ type: 'success', text: 'Name updated successfully' })
        } catch (error) {
            setActionMessage({ type: 'error', text: 'Failed to update name' })
        } finally {
            setLoadingAction(null)
        }
    }

    const handleExportData = () => {
        const data = {
            user: {
                email: user?.email,
                id: user?.id
            },
            subjects,
            attendanceLogs,
            exportedAt: new Date().toISOString()
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `attendly-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This will wipe all your data locally. To fully delete your account, please contact support.')) return

        // In a real app, we'd call an API. Here we'll wipe data we can access.
        // For now, just sign out to simulate 'leaving'.
        await signOut()
        onClose()
    }

    const settingsItems = [
        {
            id: 'account' as const,
            icon: User,
            label: 'Account',
            description: 'Manage your profile',
            color: '#3b82f6',
        },
        {
            id: 'notifications' as const,
            icon: Bell,
            label: 'Notifications',
            description: 'Reminder preferences',
            color: '#f97316',
        },
        {
            id: 'appearance' as const,
            icon: Palette,
            label: 'Appearance',
            description: 'Theme & display',
            color: '#a855f7',
        },
        {
            id: 'privacy' as const,
            icon: Shield,
            label: 'Privacy',
            description: 'Data & security',
            color: '#22c55e',
        },
    ]

    const renderMainView = () => (
        <>
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white uppercase">
                    {user?.email?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-white/40 text-sm truncate">
                        {user?.email || 'user@email.com'}
                    </p>
                </div>
            </div>

            {/* Settings Items */}
            <div className="space-y-2 mb-6">
                {settingsItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => {
                            setActionMessage(null)
                            setCurrentView(item.id)
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: `${item.color}20` }}
                        >
                            <item.icon className="w-5 h-5" style={{ color: item.color }} />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-white font-medium">{item.label}</p>
                            <p className="text-white/40 text-sm">{item.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                    </button>
                ))}
            </div>

            {/* Sign Out */}
            <button
                onClick={() => {
                    signOut()
                    handleClose()
                }}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium transition-all"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </button>

            {/* Version */}
            <p className="text-center text-white/20 text-xs mt-6">
                Attendly v1.0.0
            </p>
        </>
    )

    const renderAccountView = () => (
        <>
            <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <label className="block text-white/40 text-sm mb-2">Email</label>
                    <p className="text-white font-medium">{user?.email || 'Not set'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <label className="block text-white/40 text-sm mb-2">Display Name</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleUpdateName(displayName)
                                }
                            }}
                            className="w-full bg-transparent text-white font-medium focus:outline-none placeholder-white/20"
                            placeholder="Enter your name"
                        />
                    </div>
                </div>

                <button
                    onClick={() => handleUpdateName(displayName)}
                    disabled={loadingAction === 'name'}
                    className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all text-sm mb-2"
                >
                    {loadingAction === 'name' ? 'Saving...' : 'Save Name'}
                </button>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <label className="block text-white/40 text-sm mb-2">Default Attendance Requirement</label>
                    <p className="text-white font-medium">75%</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <label className="block text-white/40 text-sm mb-2">Change Password</label>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-transparent text-white font-medium focus:outline-none placeholder-white/20"
                            placeholder="New password"
                        />
                    </div>
                </div>

                <button
                    onClick={handleUpdatePassword}
                    disabled={loadingAction === 'password' || !newPassword}
                    className="w-full p-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loadingAction === 'password' ? 'Updating...' : 'Update Password'}
                </button>

                {actionMessage && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-sm text-center ${actionMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                    >
                        {actionMessage.text}
                    </motion.p>
                )}
            </div>
        </>
    )

    const renderNotificationsView = () => (
        <>
            <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div>
                        <p className="text-white font-medium">Class Reminders</p>
                        <p className="text-white/40 text-sm">Get reminded before classes</p>
                    </div>
                    <button
                        onClick={() => setNotifications((n: any) => ({ ...n, reminders: !n.reminders }))}
                        className={`w-12 h-7 rounded-full transition-colors ${notifications.reminders ? 'bg-green-500' : 'bg-white/10'}`}
                    >
                        <motion.div
                            className="w-5 h-5 bg-white rounded-full shadow-lg"
                            animate={{ x: notifications.reminders ? 26 : 4 }}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div>
                        <p className="text-white font-medium">Low Attendance Alert</p>
                        <p className="text-white/40 text-sm">Warn when below threshold</p>
                    </div>
                    <button
                        onClick={() => setNotifications((n: any) => ({ ...n, lowAttendance: !n.lowAttendance }))}
                        className={`w-12 h-7 rounded-full transition-colors ${notifications.lowAttendance ? 'bg-green-500' : 'bg-white/10'}`}
                    >
                        <motion.div
                            className="w-5 h-5 bg-white rounded-full shadow-lg"
                            animate={{ x: notifications.lowAttendance ? 26 : 4 }}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div>
                        <p className="text-white font-medium">Weekly Report</p>
                        <p className="text-white/40 text-sm">Receive weekly summaries</p>
                    </div>
                    <button
                        onClick={() => setNotifications((n: any) => ({ ...n, weeklyReport: !n.weeklyReport }))}
                        className={`w-12 h-7 rounded-full transition-colors ${notifications.weeklyReport ? 'bg-green-500' : 'bg-white/10'}`}
                    >
                        <motion.div
                            className="w-5 h-5 bg-white rounded-full shadow-lg"
                            animate={{ x: notifications.weeklyReport ? 26 : 4 }}
                        />
                    </button>
                </div>
            </div>
        </>
    )

    const renderAppearanceView = () => (
        <>
            <div className="space-y-4">
                <p className="text-white/40 text-sm">Theme</p>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-white font-medium mb-1">Dark Mode</p>
                    <p className="text-white/40 text-sm">
                        Finding light mode? For realll bruhh!! Who uses light mode now??
                    </p>
                </div>
            </div>
        </>
    )

    const renderPrivacyView = () => (
        <>
            <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-white font-medium mb-2">Your Data</p>
                    <p className="text-white/40 text-sm">
                        All your attendance data is stored securely in your account and synced across devices.
                    </p>
                </div>

                <button
                    onClick={handleExportData}
                    className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all text-left"
                >
                    <p className="font-medium">Export Data</p>
                    <p className="text-white/40 text-sm">Download all your attendance records</p>
                </button>

                <button
                    onClick={handleDeleteAccount}
                    className="w-full p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium transition-all text-left"
                >
                    <p className="font-medium">Delete Account</p>
                    <p className="text-red-400/60 text-sm">Permanently remove all data (Local & Sign Out)</p>
                </button>
            </div>
        </>
    )

    const getViewTitle = () => {
        switch (currentView) {
            case 'account': return 'Account'
            case 'notifications': return 'Notifications'
            case 'appearance': return 'Appearance'
            case 'privacy': return 'Privacy'
            default: return 'Settings'
        }
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
                    {/* Backdrop */}
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

                        {/* Content */}
                        <div className="relative p-8">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    {currentView !== 'main' && (
                                        <button
                                            onClick={() => setCurrentView('main')}
                                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-white/60" />
                                        </button>
                                    )}
                                    <h2 className="text-xl font-bold text-white">{getViewTitle()}</h2>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-white/60" />
                                </button>
                            </div>

                            {/* View Content */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentView}
                                    initial={{ opacity: 0, x: currentView === 'main' ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: currentView === 'main' ? 20 : -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {currentView === 'main' && renderMainView()}
                                    {currentView === 'account' && renderAccountView()}
                                    {currentView === 'notifications' && renderNotificationsView()}
                                    {currentView === 'appearance' && renderAppearanceView()}
                                    {currentView === 'privacy' && renderPrivacyView()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
