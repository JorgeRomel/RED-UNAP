import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import StoriesPage from './pages/StoriesPage';
import StoryDetailPage from './pages/StoryDetailPage';

const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
      <a 
        href="/" 
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Volver al inicio
      </a>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            {/* Página de login (pública) */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Página principal (protegida) */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Página de historias (protegida) */}
            <Route path="/stories" element={
              <ProtectedRoute>
                <Layout>
                  <StoriesPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Detalle de historia (protegida) */}
            <Route path="/stories/:id" element={
              <ProtectedRoute>
                <Layout>
                  <StoryDetailPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* 404 para rutas no encontradas */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;