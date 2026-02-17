import { Outlet } from "react-router-dom"
import Navbar from "./components/layout/Navbar"
import Footer from "./components/layout/Footer"
import { Toaster } from "./components/ui/toaster"

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}

export default App
