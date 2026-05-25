import {useCallback, useState, useEffect, Suspense} from 'react';
import {useCountry, fetchSync} from '@shopify/hydrogen';
import {Listbox} from '@headlessui/react';
import SpinnerIcon from './SpinnerIcon.client';

/**
 * Apply Digital — Compact country selector with geo-detection
 * Detects visitor's country on first visit and auto-selects it.
 */
export default function CountrySelector() {
  const [listboxOpen, setListboxOpen] = useState(false);
  const [selectedCountry] = useCountry();
  const [geoDetected, setGeoDetected] = useState(false);

  const setCountry = useCallback(({isoCode, name}) => {
    fetch(`/countries`, {
      body: JSON.stringify({isoCode, name}),
      method: 'POST',
    }).then(() => {
      window.location.reload();
    });
  }, []);

  // Geo-detect country on first visit
  useEffect(() => {
    const key = 'apply_demo_country_set';
    if (geoDetected || localStorage.getItem(key)) return;

    // Only auto-detect if still on default US
    if (selectedCountry.isoCode !== 'US') {
      localStorage.setItem(key, '1');
      return;
    }

    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((geo) => {
        if (!geo?.country_code || geo.country_code === 'US') return;

        // Get available countries and find a match
        fetch('/countries')
          .then((r) => r.json())
          .then((countries) => {
            const match = countries.find((c) => c.isoCode === geo.country_code);
            if (match) {
              setGeoDetected(true);
              localStorage.setItem(key, '1');
              fetch('/countries', {
                method: 'POST',
                body: JSON.stringify({isoCode: match.isoCode, name: match.name}),
              }).then(() => window.location.reload());
            }
          });
      })
      .catch(() => {/* silently ignore geo errors */});
  }, [selectedCountry.isoCode, geoDetected]);

  return (
    <div className="relative hidden lg:block">
      <Listbox onChange={setCountry}>
        {({open}) => {
          setTimeout(() => setListboxOpen(open));
          return (
            <>
              {/* Trigger button */}
              <Listbox.Button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#282A33',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                }}
                className="hover:text-[#FF481A] transition-colors"
              >
                {/* Globe */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>{selectedCountry.isoCode}</span>
                {/* Chevron */}
                <svg
                  width="8" height="5" viewBox="0 0 10 6" fill="none"
                  style={{transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none'}}
                >
                  <path fillRule="evenodd" clipRule="evenodd"
                    d="M0.293 0.293a1 1 0 0 1 1.414 0L5 3.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414z"
                    fill="currentColor"/>
                </svg>
              </Listbox.Button>

              {/* Dropdown */}
              <Listbox.Options
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 50,
                  width: '200px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  borderRadius: '4px',
                  padding: '8px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  outline: 'none',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#9D9A93',
                    padding: '6px 10px 10px',
                    borderBottom: '1px solid #F3F3F4',
                    marginBottom: '6px',
                  }}
                >
                  Select Country
                </div>

                {listboxOpen && (
                  <Suspense fallback={
                    <div style={{display: 'flex', justifyContent: 'center', padding: '16px'}}>
                      <SpinnerIcon />
                    </div>
                  }>
                    <Countries
                      selectedCountry={selectedCountry}
                      getClassName={(active, selected) =>
                        `country-option${active ? ' active' : ''}${selected ? ' selected' : ''}`
                      }
                    />
                  </Suspense>
                )}
              </Listbox.Options>
            </>
          );
        }}
      </Listbox>

      <style>{`
        .country-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          border-radius: 3px;
          cursor: pointer;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          color: #282A33;
          transition: background 0.1s;
        }
        .country-option.active { background-color: #F4F2F0; }
        .country-option.selected { font-weight: 600; color: #FF481A; }
      `}</style>
    </div>
  );
}

/** Kept for MobileCountrySelector compatibility */
export function ArrowIcon({isOpen}) {
  return (
    <svg
      width="8" height="5" viewBox="0 0 10 6" fill="none"
      style={{transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none'}}
    >
      <path fillRule="evenodd" clipRule="evenodd"
        d="M0.293 0.293a1 1 0 0 1 1.414 0L5 3.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414z"
        fill="currentColor"/>
    </svg>
  );
}

/** Kept for MobileCountrySelector compatibility */
export function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M4 10l4 4 8-8" stroke="#FF481A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Countries({selectedCountry, getClassName}) {
  const countries = fetchSync('/countries').json();

  return countries.map((country) => {
    const isSelected = country.isoCode === selectedCountry.isoCode;
    return (
      <Listbox.Option key={country.isoCode} value={country}>
        {({active}) => (
          <div className={getClassName(active, isSelected)}>
            <span>{country.name}</span>
            {isSelected && (
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke="#FF481A" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        )}
      </Listbox.Option>
    );
  });
}
