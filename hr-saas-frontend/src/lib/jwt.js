function base64UrlDecode(input) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")

  // atob expects standard base64
  const decoded = atob(padded)

  // handle utf-8
  try {
    return decodeURIComponent(
      decoded
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    )
  } catch {
    return decoded
  }
}

export function decodeJwt(token) {
  if (!token || typeof token !== "string") return null

  const parts = token.split(".")
  if (parts.length < 2) return null

  try {
    const payloadJson = base64UrlDecode(parts[1])
    return JSON.parse(payloadJson)
  } catch {
    return null
  }
}
