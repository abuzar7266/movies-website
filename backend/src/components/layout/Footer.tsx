function Footer() {
  return (
    <footer className="border-t bg-white/70 backdrop-blur dark:bg-gray-950/70">
      <div className="mx-auto max-w-6xl p-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} MovieShelf. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer
