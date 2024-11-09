import './App.css';
import React, {useEffect, useState} from 'react';
import Header from './components/Header/Header';
import './index.css';
import MainPage from "./pages/MainPage/MainPage";
import InfoPage from "./pages/InfoPage/InfoPage";
import { Footer } from "./components/Footer/Footer";
import { FilesProvider } from './contexts/FilesContext';
import {PhotoGallery} from "./components/PhotoGallery/PhotoGallery"; // Убедитесь, что путь правильный

const App = () => {
  const [currentPage, setCurrentPage] = useState('main');


  const renderPage = () => {
    switch (currentPage) {
      case 'main':
        return <MainPage setCurrentPage={setCurrentPage} />;
      case 'info':
        return <InfoPage />;
      case 'result':
        return <PhotoGallery setCurrentPage={setCurrentPage}/>;
      default:
        return <MainPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
      <FilesProvider>
        <div className="App">
          <Header currentPage={currentPage} setCurrentPage={setCurrentPage}/>
          {renderPage()}
          <Footer />
        </div>
      </FilesProvider>
  );
};

export default App;
