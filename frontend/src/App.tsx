import { Outlet } from "react-router-dom"
import Navbar from "@components/layout/Navbar"
import Footer from "@components/layout/Footer"
import { Toaster } from "@components/ui/toaster"
import styles from "./App.module.css"

function App() {
  return (
    <div className={styles.app}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}

export default App
