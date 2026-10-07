"use client"

import * as React from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fafafa",
          color: "#18181b",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 440, padding: 24, textAlign: "center" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>Ứng dụng không thể tải</h1>
          <p style={{ margin: "0 0 20px", color: "#71717a", fontSize: 14 }}>
            Đã xảy ra lỗi hệ thống. Hãy thử lại hoặc quay về trang chủ.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <button type="button" onClick={retry} style={primaryButtonStyle}>
              Thử lại
            </button>
            <Link href="/" style={secondaryButtonStyle}>
              Về trang chủ
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}

const baseButtonStyle: React.CSSProperties = {
  minHeight: 36,
  borderRadius: 8,
  padding: "0 14px",
  fontWeight: 600,
  cursor: "pointer",
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
}

const primaryButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid #18181b",
  background: "#18181b",
  color: "#fff",
}

const secondaryButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid #d4d4d8",
  background: "#fff",
  color: "#18181b",
}
