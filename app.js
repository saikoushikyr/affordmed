import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, NavLink } from 'react-router-dom';
import ShortenerPage from './ShortenerPage';
import StatisticsPage from './StatisticsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <NavLink to="/" activeClassName="active">URL Shortener</NavLink> | 
          <NavLink to="/stats" activeClassName="active">Statistics</NavLink>
        </nav>
        <Routes>
          <Route path="/" element={<ShortenerPage />} />
          <Route path="/stats" element={<StatisticsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;