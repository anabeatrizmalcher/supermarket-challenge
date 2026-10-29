import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Join from '../pages/Join';
import Lobby from '../pages/Lobby';
import Play from '../pages/Play';
import Result from '../pages/Result';
import { useMatchSync } from '../features/match/hooks';

export default function App() {
  useMatchSync();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Join />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/play" element={<Play />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}
