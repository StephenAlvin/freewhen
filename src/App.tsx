import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import EventPage from '@/pages/EventPage';
import NotFound from '@/components/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:slug" element={<EventPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
