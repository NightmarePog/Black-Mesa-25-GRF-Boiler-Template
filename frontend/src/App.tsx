import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Chat from "./Components/Chat";
import './Components/Chat.css';
import Feature from './Components/Feature';

function App() {
  return (
    <Router>
      <div className="App">
        <h1>Chat Application</h1>
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/feature" element={<Feature />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;