import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import './index.css';
import { FilesProvider } from './contexts/FilesContext';
import { PhotoGallery } from "./components/PhotoGallery/PhotoGallery";
import MainPage from "./pages/MainPage/MainPage";
import InfoPage from "./pages/InfoPage/InfoPage";
import { Footer } from "./components/Footer/Footer";

const App = () => {
    return (
        <FilesProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <div className="App">
                    <Header />
                    <Routes>
                        <Route path="/" element={<MainPage />} />
                        <Route path="/info" element={<InfoPage />} />
                        <Route path="/result" element={<PhotoGallery />} />
                        <Route path="*" element={<MainPage />} />
                    </Routes>
                    <Footer />
                </div>
            </Router>
        </FilesProvider>
    );
};

export default App;
