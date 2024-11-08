import './App.css';
import React, { useState } from 'react';
import Header from './components/Header/Header';
import './index.css';
import MainPage from "./pages/MainPage/MainPage";
import InfoPage from "./pages/InfoPage/InfoPage";
import { Footer } from "./components/Footer/Footer";
import { FilesProvider } from './contexts/FilesContext'; // Убедитесь, что путь правильный

const App = () => {
  const [currentPage, setCurrentPage] = useState('main');

  const renderPage = () => {
    switch (currentPage) {
      case 'main':
        return <MainPage />;
      case 'info':
        return <InfoPage />;
      default:
        return <MainPage />;
    }
  };

  return (
      <FilesProvider>
        <div className="App">
          <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
          {renderPage()}
          <Footer />
        </div>
      </FilesProvider>
  );
};

export default App;
