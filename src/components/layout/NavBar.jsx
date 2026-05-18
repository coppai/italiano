import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';

const LINKS = [
  { to: '/articles', label: 'Articles' },
  { to: '/flashcards', label: 'Vocab' },
  { to: '/verbs', label: 'Verbs' },
  { to: '/possessives', label: 'Possessives' },
];

export default function NavBar() {
  const [expanded, setExpanded] = useState(false);
  const { pathname } = useLocation();
  const close = () => setExpanded(false);

  return (
    <Navbar
      expand="md"
      bg="dark"
      variant="dark"
      sticky="top"
      expanded={expanded}
      onToggle={setExpanded}
      className="shadow-sm"
    >
      <Container>
        <Navbar.Brand as={NavLink} to="/" onClick={close}>
          🇮🇹 Italian Practice
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="primary-nav" />
        <Navbar.Collapse id="primary-nav">
          <Nav className="ms-auto">
            {LINKS.map(link => (
              <Nav.Link
                key={link.to}
                as={NavLink}
                to={link.to}
                end={link.to === '/'}
                onClick={close}
                active={pathname === link.to || pathname.startsWith(link.to + '/')}
              >
                {link.label}
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
