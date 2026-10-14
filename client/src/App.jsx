import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import Cars from './pages/Cars.jsx';
import CarDetails from './pages/CarDetails.jsx';
import Favorites from './pages/Favorites.jsx';
import Compare from './pages/Compare.jsx';
import Booking from './pages/Booking.jsx';
import BookingConfirmation from './pages/BookingConfirmation.jsx';
import Payment from './pages/Payment.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Contact from './pages/Contact.jsx';
import { About, FAQ, PolicyPage } from './pages/InfoPages.jsx';

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontSize: '14px' } }} />
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/confirmation/:ref" element={<BookingConfirmation />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<PolicyPage type="terms" />} />
          <Route path="/privacy" element={<PolicyPage type="privacy" />} />
          <Route path="/cancellation" element={<PolicyPage type="cancellation" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
