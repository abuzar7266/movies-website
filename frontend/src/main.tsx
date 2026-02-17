import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import "./index.css"
import App from "./App"
import Index from "./pages/Index"
import Login from "./pages/Login"
import Register from "./pages/Register"
import MovieDetail from "./pages/MovieDetail"
import NotFound from "./pages/NotFound"
import { AuthProvider } from "./context/AuthContext"
import { MovieProvider } from "./context/MovieContext"

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
        <RouterProvider router={router} />
      </MovieProvider>
    </AuthProvider>
  </StrictMode>
)
