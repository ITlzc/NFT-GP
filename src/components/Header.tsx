'use client';

// import { ConnectButton } from '@rainbow-me/rainbowkit';
import ConnectButton_custom from './ConnectButton_custom';
import { useState } from 'react';
import styles from '@/styles/Header.module.scss';


function Header() {

  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className={`${styles.header}`}>
      <div className={styles.logo}>
        <a href="/"><img rel='preload' src="/images/logo.png" style={{ height: "3.54vw", width: "11.18vw" }} alt="" /></a>
      </div>
      <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
        {/* <a href="#">Mint</a>
        <a href="#">Free Mint</a> */}
        <ConnectButton_custom isPage={false} />
      </nav>
    </header>
  );
}

export default Header;
