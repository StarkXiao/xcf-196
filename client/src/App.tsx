import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pacts from './pages/Pacts';
import Checkins from './pages/Checkins';
import Timeline from './pages/Timeline';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import MonthlyReview from './pages/MonthlyReview';
import Wishlist from './pages/Wishlist';
import BuildingMap from './pages/BuildingMap';
import TravelPlans from './pages/TravelPlans';
import GiftPlans from './pages/GiftPlans';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pacts" element={<Pacts />} />
        <Route path="checkins" element={<Checkins />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="building-map" element={<BuildingMap />} />
        <Route path="travel-plans" element={<TravelPlans />} />
        <Route path="gift-plans" element={<GiftPlans />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="monthly-review" element={<MonthlyReview />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
