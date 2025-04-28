// WelcomePage.jsx

import React from 'react';

function WelcomePage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Welcome to Register page</h1>
      <p style={styles.paragraph}>We are glad to have you here!</p>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f0f8ff',
  },
  heading: {
    fontSize: '3rem',
    color: '#333',
  },
  paragraph: {
    fontSize: '1.2rem',
    color: '#666',
  },
};

export default WelcomePage;
