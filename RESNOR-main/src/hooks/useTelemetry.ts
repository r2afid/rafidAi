"use client"

import { useEffect, useRef } from "react"
import { useAppStore } from "@/stores/app"
import { useAuthStore } from "@/stores/auth"

const HEARTBEAT_INTERVAL = 15000
const BREAK_THRESHOLD = 120 // 2 minutes

export function useTelemetry() {
  const activePage = useAppStore((s) => s.activePage)
  const triggerBreakReminder = useAppStore((s) => s.triggerBreakReminder)
  const authUser = useAuthStore((s) => s.user)
  const pageRef = useRef(activePage)
  const lastSentRef = useRef(Date.now())
  const scrollRef = useRef(0)
  const interactionRef = useRef(0)
  const studyAccumulatedRef = useRef(0)
  const triggeredRef = useRef(false)

  function sendHeartbeat(page: string) {
    if (!authUser?.id) return
    const now = Date.now()
    const delta = Math.round((now - lastSentRef.current) / 1000)
    if (delta < 5) return
    lastSentRef.current = now
    fetch("/api/telemetry/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: authUser.id,
        page_id: page,
        active_seconds: delta,
        scroll_percentage: Math.round(scrollRef.current),
        interaction_count: interactionRef.current,
        tab_focused: !document.hidden,
      }),
    }).catch(() => {})
    scrollRef.current = 0
    interactionRef.current = 0

    // Accumulate focused study time
    const studyPages = ["quiz", "tutor", "wellbeing", "notes", "gamification", "planner", "forum", "explain-mistake", "resources", "leaderboard"]
    if (studyPages.includes(page) && !document.hidden) {
      studyAccumulatedRef.current += delta
      if (studyAccumulatedRef.current >= BREAK_THRESHOLD && !triggeredRef.current) {
        triggeredRef.current = true
        studyAccumulatedRef.current = 0
        triggerBreakReminder()
      }
    }
  }

  useEffect(() => {
    if (activePage === pageRef.current) return
    if (pageRef.current) {
      sendHeartbeat(pageRef.current)
    }
    // Reset accumulation when leaving a study page (e.g. going to pomodoro)
    const studyPages = ["quiz", "tutor", "wellbeing", "notes", "gamification", "planner", "forum", "explain-mistake", "resources", "leaderboard"]
    if (pageRef.current && studyPages.includes(pageRef.current) && !studyPages.includes(activePage)) {
      studyAccumulatedRef.current = 0
      triggeredRef.current = false
    }
    pageRef.current = activePage
    lastSentRef.current = Date.now()
    scrollRef.current = 0
    interactionRef.current = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage])

  useEffect(() => {
    if (!authUser?.id) return

    const handleScroll = () => {
      const docEl = document.documentElement
      const scrollPct = (docEl.scrollTop / (docEl.scrollHeight - docEl.clientHeight)) * 100
      scrollRef.current = Math.max(scrollRef.current, Math.min(scrollPct, 100))
    }

    const handleInteraction = () => {
      interactionRef.current++
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("click", handleInteraction)
    window.addEventListener("keydown", handleInteraction)

    const interval = setInterval(() => {
      if (!activePage || !authUser?.id) return
      sendHeartbeat(activePage)
    }, HEARTBEAT_INTERVAL)

    return () => {
      clearInterval(interval)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("click", handleInteraction)
      window.removeEventListener("keydown", handleInteraction)
    }
  }, [authUser?.id, activePage, triggerBreakReminder])
}
