import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CarProvider } from './context/CarContext.jsx';
import { BookingProvider } from './context/BookingContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CarProvider>
          <BookingProvider>
            <App />
          </BookingProvider>
        </CarProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
