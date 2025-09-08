import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001';

// Reuse logger from above
const logger = {
  log: (message) => {
    const logs = JSON.parse(localStorage.getItem('reactLogs') || '[]');
    logs.push({ timestamp: new Date().toISOString(), message });
    localStorage.setItem('reactLogs', JSON.stringify(logs.slice(-100)));
  }
};

function StatisticsPage() {
  const [statsList, setStatsList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // For demo, fetch stats for a hardcoded shortcode or fetch all if API extended.
    // Since API is per-shortcode, assume user inputs one or list from local (in prod, store created shortcodes in localStorage).
    // Here, mock fetching for 'abcd1' (generate one first via shortener).
    fetchStats('abcd1'); // Replace with dynamic input
  }, []);

  const fetchStats = async (shortcode) => {
    logger.log(`Stats Request: Shortcode=${shortcode}`);
    try {
      const response = await axios.get(`${API_BASE}/shorturls/${shortcode}`);
      setStatsList([response.data]); // Array for list display
      logger.log(`Stats Success: ${JSON.stringify(response.data)}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching stats');
      logger.log(`Stats Error: ${err.message}`);
    }
  };

  return (
    <div>
      <h1>URL Shortener Statistics</h1>
      <p>Enter Shortcode to view stats: <input type="text" placeholder="e.g., abcd1" onBlur={(e) => fetchStats(e.target.value)} /></p>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <ul>
        {statsList.map((stat, index) => (
          <li key={index}>
            <h3>Short Link: <a href={`${API_BASE}/${stat.originalUrl.split('/').pop() || 'unknown'}`} target="_blank" rel="noopener noreferrer">{API_BASE}/{/* shortcode here */}</a></h3>
            <p>Original URL: {stat.originalUrl}</p>
            <p>Created: {new Date(stat.createdAt).toLocaleString()}</p>
            <p>Expires: {new Date(stat.expiryAt).toLocaleString()}</p>
            <p>Total Clicks: {stat.totalClicks}</p>
            <h4>Click Details:</h4>
            <ul>
              {stat.clicks.map((click, cIndex) => (
                <li key={cIndex}>
                  <p>Time: {new Date(click.timestamp).toLocaleString()}</p>
                  <p>Referrer: {click.referrer}</p>
                  <p>Location: {click.location}</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {/* For historical list: In prod, maintain a local list of created shortcodes */}
    </div>
  );
}

export default StatisticsPage;