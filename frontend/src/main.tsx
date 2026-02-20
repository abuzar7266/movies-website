import { StrictMode, Suspense, lazy } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import "./index.css"
import App from "@src/App"
import { AuthProvider } from "@context/AuthContext"
import { MovieProvider } from "@context/MovieContext"
import styles from "./main.module.css"

const Index = lazy(() => import("@pages/index/Index"))
const Login = lazy(() => import("@pages/auth/Login"))
const Register = lazy(() => import("@pages/auth/Register"))
const MovieDetail = lazy(() => import("@pages/movie-detail/MovieDetail"))
const NotFound = lazy(() => import("@pages/not-found"))

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Index /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "movie/:id", element: <MovieDetail /> },
      { path: "*", element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <MovieProvider>
        <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </MovieProvider>
    </AuthProvider>
  </StrictMode>
)
