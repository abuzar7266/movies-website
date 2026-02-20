import { Link, useNavigate } from "react-router-dom"
import { useRef, useState } from "react"
import { useAuth } from "@context/AuthContext"
import { Button } from "@components/ui/button"
import { Film, LogOut, Plus, Camera } from "lucide-react"
import { toast } from "@hooks/use-toast"
import styles from "./Navbar.module.css"

function Navbar() {
  const { isAuthenticated, user, logout, updateAvatar } = useAuth()
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const onPick = () => {
    if (uploadingAvatar) return
    fileRef.current?.click()
  }
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploadingAvatar(true)
    try {
      const ok = await updateAvatar(f)
      if (ok) toast.success("Profile image updated")
      else toast.error("Failed to update profile image")
    } finally {
      setUploadingAvatar(false)
      e.currentTarget.value = ""
    }
  }
  const navigate = useNavigate()
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/?reset=1" className={styles.brandLink}>
          <Film size={24} className={styles.brandIcon} />
          <span className={styles.brandText}>MovieShelf</span>
        </Link>
        <div className={styles.right}>
          {isAuthenticated ? (
            <>
              <Button size="sm" onClick={() => navigate("/?add=true")} className={styles.addButton}>
                <Plus size={15} />
                <span className={styles.addLabel}>Add Movie</span>
              </Button>
              <div className={styles.profilePill}>
                <div className={styles.avatarWrapper}>
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className={styles.avatarImg} />
                  ) : (
                    <div className={styles.avatarFallback}>
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={onPick}
                    disabled={uploadingAvatar}
                    aria-label="Change profile picture"
                    className={styles.avatarButton}
                  >
                    <Camera size={10} />
                  </button>
                </div>
                <span className={styles.userName}>{user?.name}</span>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className={styles.fileInput} />
              </div>
              <button
                onClick={() => { logout(); toast.success("Logged out"); navigate("/"); }}
                className={styles.iconButton}
                aria-label="Log out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className={styles.authButtons}>
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>Log In</Button>
              <Button size="sm" onClick={() => navigate("/register")}>Sign Up</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
