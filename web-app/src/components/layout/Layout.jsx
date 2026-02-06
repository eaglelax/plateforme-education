import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>&copy; 2024 Plateforme Educative Burkina Faso. Tous droits reserves.</p>
      </footer>
    </div>
  );
}

export default Layout;
