import './agency.css';

export const metadata = {
  title: 'Baddie Agency | Executive Command Center',
  description: 'Manage talent, bookings, and ecosystem configuration.',
};

export default function AgencyLayout({ children }) {
  return (
    <div className="agency-shell">
      <nav className="agency-nav">
        <div className="nav-container">
          <span className="nav-logo">BADDIE <span>AGENCY</span></span>
          <div className="nav-links">
            {/* Agency specific nav links */}
          </div>
        </div>
      </nav>
      <main className="page-wrapper">
        {children}
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .agency-shell {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        .agency-nav {
          padding: 20px 40px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .nav-logo span {
          color: var(--accent-pink);
        }
      `}} />
    </div>
  );
}
