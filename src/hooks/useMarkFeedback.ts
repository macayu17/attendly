import { useEffect, useRef, useState } from 'react'

export function useMarkFeedback(timeoutMs: number = 2000) {
    const [message, setMessage] = useState<string | null>(null)
    const timerRef = useRef<number | null>(null)

    const flash = (text: string) => {
        setMessage(text)
        if (timerRef.current) {
            window.clearTimeout(timerRef.current)
        }
        timerRef.current = window.setTimeout(() => setMessage(null), timeoutMs)
    }

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current)
            }
        }
    }, [])

    return { message, flash }
}
