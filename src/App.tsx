/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Spill from './pages/Spill';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Feed />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/spill" element={<Spill />} />
      <Route path="/rumors" element={<Feed />} /> {/* Placeholder */}
      <Route path="/alerts" element={<Feed />} /> {/* Placeholder */}
    </Routes>
  );
}