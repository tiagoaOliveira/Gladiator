import React from 'react';
import Header from './header';
import './Layout.css';

export default function Layout({ children }) {
  return (
    <div className="container">
      <Header />
      {children}
    </div>
  );
}
