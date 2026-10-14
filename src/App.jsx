import { Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Explore from './pages/Explore'
import NotFound from './pages/NotFound'

import PawLogo from "./components/PawLogo";
import OrangeBackground from "./components/OrangeBackground";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome /> }/>
      <Route path="/login" element={<Login /> }/>
      <Route path="/register" element={<Register /> }/>
      <Route path="/explore" element={<Explore /> }/>
      <Route path="*" element={<NotFound /> }/>
    </Routes>
    // <OrangeBackground>
    //   <main className="mx-auto max-w-3xl px-6 py-16">
    //     <div className="flex justify-center rounded-card bg-white p-10">
    //       <h1>
    //         <PawLogo size="lg" />
    //       </h1>
    //     </div>
    //   </main>
    // </OrangeBackground>
  )
}
