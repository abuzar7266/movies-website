import { Outlet } from "react-router-dom"
import Navbar from "./components/layout/Navbar"
import Footer from "./components/layout/Footer"
import { Toaster } from "./components/ui/toaster"

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 sm:px-5 lg:px-6 pt-0 pb-8">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}

export default App
