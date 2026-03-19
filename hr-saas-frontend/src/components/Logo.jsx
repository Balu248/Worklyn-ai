function Logo({ className = "h-8 w-8", labelClassName = "text-base" }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg shadow-indigo-950/30 ${className}`}
    >
      <span className={labelClassName}>W</span>
    </div>
  )
}

export default Logo
