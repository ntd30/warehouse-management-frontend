import { Outlet } from "react-router-dom"
import Header from "./components/client/layout/header"
import AppFooter from "./components/client/layout/footer"

function App() {
  return (
    <>
      <Header />

      <Outlet />

      <AppFooter />
    </>
  )
}

export default App
