import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, ArrowRight } from 'lucide-react'

export function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const { signIn, signUp, loading, error, clearError } = useAuthStore()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isLogin) {
            await signIn(email, password)
        } else {
            await signUp(email, password)
        }
    }

    const toggleMode = () => {
        clearError()
        setIsLogin(!isLogin)
    }

    return (
        <div className="min-h-screen bg-ambient flex items-center justify-center p-6 relative overflow-hidden">

            {/* Ambient Globs specifically for Auth */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Glass Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="w-full max-w-sm relative z-10"
            >
                <div className="glass-card p-8 border-white/10 backdrop-blur-2xl bg-black/40 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white mb-6 shadow-lg shadow-indigo-500/30 ring-4 ring-white/10 p-4">
                            <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Attendly Elite
                        </h1>
                        <p className="text-sm text-foreground-muted mt-2">
                            {isLogin ? 'Welcome back to your dashboard' : 'Start your journey'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input bg-black/50 border-white/10 focus:bg-black/70 placeholder:text-white/20"
                                placeholder="Email address"
                            />
                        </div>

                        <div className="space-y-1">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="input bg-black/50 border-white/10 focus:bg-black/70 placeholder:text-white/20"
                                placeholder="Password"
                            />
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full mt-4 h-12 rounded-full text-base"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={toggleMode}
                            type="button"
                            className="text-sm text-foreground-muted hover:text-white transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
