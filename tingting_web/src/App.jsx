import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout';

function App() {
  return (
    
     <Router>
        <Routes>
                <Route path="/" element={<DefaultLayout />}>
                    <Route index element={<h1 >Chat window</h1>} />
                </Route>
            </Routes>
     </Router>
  )
}

export default App
