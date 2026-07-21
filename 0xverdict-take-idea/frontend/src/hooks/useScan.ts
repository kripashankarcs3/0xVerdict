import { useState, useEffect, useRef, useCallback } from "react"
import { startScan, getScanStatus } from "../utils/api"
import type { ScanResult } from "../types"

const POLL_INTERVAL = 2000 // 2 seconds

export function useScan() {
  const [scanId, setScanId] = useState<string | null>(null)
  const [scanData, setScanData] = useState<ScanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollerRef = useRef<number | null>(null)

  const stopPoller = useCallback(() => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current)
      pollerRef.current = null
    }
  }, [])

  const startPolling = useCallback(
    (id: string) => {
      stopPoller()
      pollerRef.current = setInterval(async () => {
        try {
          const data = await getScanStatus(id)
          setScanData(data)
          if (data.scan_status === "Completed" || data.scan_status === "Failed") {
            stopPoller()
            setIsLoading(false)
          }
        } catch (e) {
          console.error("Polling error:", e)
        }
      }, POLL_INTERVAL) as unknown as number
    },
    [stopPoller],
  )

  const triggerScan = useCallback(
    async (targetUrl: string) => {
      setIsLoading(true)
      setError(null)
      setScanData(null)
      try {
        const { scan_id } = await startScan(targetUrl)
        setScanId(scan_id)
        startPolling(scan_id)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Scan failed to start")
        setIsLoading(false)
      }
    },
    [startPolling],
  )

  useEffect(() => {
    return () => stopPoller()
  }, [stopPoller])

  return { scanId, scanData, isLoading, error, triggerScan }
}
