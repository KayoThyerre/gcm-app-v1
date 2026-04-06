import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import News from './pages/News'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/noticias" element={<News />} />
    </Routes>
  )
}

export default App
