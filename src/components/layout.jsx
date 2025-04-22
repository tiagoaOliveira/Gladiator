import React from 'react';
import Header from './header';
import Footer from './footer'
import './Layout.css';

export default function Layout({ children }) {
  return (
    <div className="container">
      <Header />
      <Footer />
      {children}
    </div>
  );
}
