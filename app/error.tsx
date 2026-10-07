"use client"

import * as React from "react"
import { AlertTriangle, ArrowLeft, House, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const router = useRouter()

  React.useEffect(() => {
    toast.error("Trang không thể tải", {
      id: `page-error:${error.digest ?? error.message}`,
      description: "Bạn có thể thử lại hoặc quay về trang chủ.",
    })
  }, [error])

  const goBack = () => {
    const currentUrl = window.location.href
    if (window.history.length <= 1) {
      if (window.location.pathname === "/") retry()
      else router.replace("/")
      return
    }

    window.history.back()
    window.setTimeout(() => {
      if (window.location.href !== currentUrl) return
      if (window.location.pathname === "/") retry()
      else router.replace("/")
    }, 600)
  }

  const goHome = () => {
    if (window.location.pathname === "/") retry()
    else router.replace("/")
  }

  return (
    <main className="flex min-h-[70dvh] items-center justify-center p-4">
      <Card className="w-full max-w-md items-center gap-4 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </span>
        <div className="space-y-1.5">
          <h1 className="font-heading text-lg font-bold">Trang không thể tải</h1>
          <p className="text-sm text-muted-foreground">
            Đã xảy ra lỗi khi hiển thị trang. Hãy thử tải lại hoặc quay về trang an toàn.
          </p>
          {error.digest && (
            <p className="font-mono text-[10px] text-muted-foreground">Mã lỗi: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" size="sm" onClick={retry}>
            <RefreshCw className="size-4" /> Thử lại
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={goBack}>
            <ArrowLeft className="size-4" /> Quay lại
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={goHome}>
            <House className="size-4" /> Trang chủ
          </Button>
        </div>
      </Card>
    </main>
  )
}
