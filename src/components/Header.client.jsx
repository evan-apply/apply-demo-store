import {useEffect, useState} from 'react';
import {Link} from '@shopify/hydrogen';

import CartToggle from './CartToggle.client';
import {useCartUI} from './CartUIProvider.client';
import AccountIcon from './account/AccountIcon';
import CountrySelector from './CountrySelector.client';
import Navigation from './Navigation.client';
import MobileNavigation from './MobileNavigation.client';

const APPLY_LOGO = (
  <svg height="18" viewBox="0 0 2099 600" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Apply">
    <path d="M1042.56 500H922.529V100H1111.24C1224.6 100 1309.29 146.674 1309.29 266.026C1309.29 386.045 1225.93 432.718 1111.24 432.718H1042.56V500ZM1112.57 206.683H1042.56V326.035H1112.57C1159.25 326.035 1182.59 304.699 1182.59 266.026C1182.59 226.686 1159.25 206.683 1112.57 206.683Z" fill="#282A33"/>
    <path d="M1667.93 500H1332.51V100H1452.54V404.222H1667.93V500Z" fill="#282A33"/>
    <path d="M1824.01 500H1703.98V402.714L1531.94 100H1683.98L1727.32 198.682L1766.67 270.207L1806.01 198.682L1850.02 100H1998.05L1824.01 404.047V500Z" fill="#282A33"/>
    <path d="M511.711 500H631.739V432.718H700.422C815.116 432.718 898.469 386.045 898.469 266.026C898.469 146.674 813.782 100 700.422 100H511.711V500ZM631.739 326.035V206.683H701.756C748.433 206.683 771.772 226.686 771.772 266.026C771.772 304.699 748.433 326.035 701.756 326.035H631.739Z" fill="#282A33"/>
    <path d="M230.281 342.652C224.58 345.923 222.353 349.449 221.265 352.334C219.975 355.755 219.616 360.297 220.909 365.15C222.203 370.004 224.774 373.765 227.596 376.09C229.976 378.051 233.662 380 240.235 380H368.053V263.604L230.281 342.652ZM488.053 420C488.053 464.183 452.236 500 408.053 500H240.235C96.7999 500 46.1516 309.95 170.562 238.568L202.924 220H108.484V100H408.053C452.236 100 488.053 135.817 488.053 180V420Z" fill="#282A33"/>
  </svg>
);


export default function Header({collections, storeName}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const {isCartOpen} = useCartUI();

  useEffect(() => {
    setScrollbarWidth(window.innerWidth - document.documentElement.clientWidth);
  }, [isCartOpen]);

  return (
    <header className="h-[108px]" role="banner">
      <div
        className="fixed z-20 w-full bg-white border-b border-[#E5E7EB]"
        style={{paddingRight: isCartOpen ? scrollbarWidth : undefined}}
      >
        {/* ── Single main row ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            height: '64px',
            padding: '0 40px',
          }}
        >
          {/* Left: Logo + Demo badge */}
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <Link to="/" style={{display: 'flex', alignItems: 'center', textDecoration: 'none', opacity: 1}}
              className="hover:opacity-70 transition-opacity">
              {APPLY_LOGO}
            </Link>
            <span style={{width: '1px', height: '16px', backgroundColor: '#E5E7EB', flexShrink: 0}} />
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              lineHeight: 1.3,
              color: '#FF481A',
            }}>
              Personalization<br/>
              <span style={{color: '#9D9A93', fontWeight: 400}}>Demo</span>
            </span>

            {/* Mobile nav toggle */}
            <div className="lg:hidden ml-2">
              <MobileNavigation
                collections={collections}
                isOpen={isMobileNavOpen}
                setIsOpen={setIsMobileNavOpen}
              />
            </div>
          </div>

          {/* Centre: Nav links — truly centred via grid auto column */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Collections">
            {collections?.map((collection) => (
              <Link
                key={collection.id}
                to={`/collections/${collection.handle}`}
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#282A33',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
                className="hover:text-[#FF481A] transition-colors"
              >
                {collection.title}
              </Link>
            ))}
          </nav>

          {/* Right: Country + Account + Cart — all same size, right-aligned */}
          <div style={{display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'flex-end'}}>

            {/* Country selector — full dropdown with geo-detection */}
            <CountrySelector />

            {/* Thin separator */}
            <span style={{width: '1px', height: '14px', backgroundColor: '#E5E7EB'}} />

            {/* Account */}
            <Link
              to="/account"
              style={{color: '#282A33', display: 'flex', alignItems: 'center'}}
              className="hover:text-[#FF481A] transition-colors"
              aria-label="Account"
            >
              <AccountIcon />
            </Link>

            {/* Cart */}
            <CartToggle
              handleClick={() => {
                if (isMobileNavOpen) setIsMobileNavOpen(false);
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
