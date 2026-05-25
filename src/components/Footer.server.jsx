import {Link} from '@shopify/hydrogen';

/**
 * Apply Digital — Editorial Momentum
 * Footer: dark (inverse-surface #282A33), warm white text, orange hover
 */
export default function Footer({collection, product, storeName}) {
  return (
    <footer role="contentinfo" style={{backgroundColor: '#282A33', color: '#F0F1F1'}}>
      {/* Lime accent strip */}
      <div style={{backgroundColor: '#D9FD3B', height: '4px'}} />

      <div className="mx-auto max-w-7xl px-8 md:px-16 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Brand column */}
        <div>
          <div className="mb-4">
            <svg height="20" viewBox="0 0 2099 600" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Apply">
              <path d="M1042.56 500H922.529V100H1111.24C1224.6 100 1309.29 146.674 1309.29 266.026C1309.29 386.045 1225.93 432.718 1111.24 432.718H1042.56V500ZM1112.57 206.683H1042.56V326.035H1112.57C1159.25 326.035 1182.59 304.699 1182.59 266.026C1182.59 226.686 1159.25 206.683 1112.57 206.683Z" fill="#F0F1F1"/>
              <path d="M1667.93 500H1332.51V100H1452.54V404.222H1667.93V500Z" fill="#F0F1F1"/>
              <path d="M1824.01 500H1703.98V402.714L1531.94 100H1683.98L1727.32 198.682L1766.67 270.207L1806.01 198.682L1850.02 100H1998.05L1824.01 404.047V500Z" fill="#F0F1F1"/>
              <path d="M511.711 500H631.739V432.718H700.422C815.116 432.718 898.469 386.045 898.469 266.026C898.469 146.674 813.782 100 700.422 100H511.711V500ZM631.739 326.035V206.683H701.756C748.433 206.683 771.772 226.686 771.772 266.026C771.772 304.699 748.433 326.035 701.756 326.035H631.739Z" fill="#F0F1F1"/>
              <path d="M230.281 342.652C224.58 345.923 222.353 349.449 221.265 352.334C219.975 355.755 219.616 360.297 220.909 365.15C222.203 370.004 224.774 373.765 227.596 376.09C229.976 378.051 233.662 380 240.235 380H368.053V263.604L230.281 342.652ZM488.053 420C488.053 464.183 452.236 500 408.053 500H240.235C96.7999 500 46.1516 309.95 170.562 238.568L202.924 220H108.484V100H408.053C452.236 100 488.053 135.817 488.053 180V420Z" fill="#F0F1F1"/>
            </svg>
          </div>
          <p className="text-[#6D6A63] text-sm leading-relaxed max-w-xs">
            Premium merchandise powered by Contentful & Shopify.
          </p>
        </div>

        {/* Shop column */}
        <div>
          <h3
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-6"
            style={{fontFamily: "'Space Grotesk', sans-serif", color: '#6D6A63'}}
          >
            Shop
          </h3>
          <ul className="space-y-3">
            {collection && (
              <li>
                <Link
                  to={`/collections/${collection.handle}`}
                  className="text-sm hover:text-[#FF481A] transition-colors"
                  style={{color: '#F0F1F1'}}
                >
                  {collection.title}
                </Link>
              </li>
            )}
            {product && (
              <li>
                <Link
                  to={`/products/${product.handle}`}
                  className="text-sm hover:text-[#FF481A] transition-colors"
                  style={{color: '#F0F1F1'}}
                >
                  Featured Product
                </Link>
              </li>
            )}
            <li>
              <Link
                to="/collections"
                className="text-sm hover:text-[#FF481A] transition-colors"
                style={{color: '#F0F1F1'}}
              >
                All Collections
              </Link>
            </li>
          </ul>
        </div>

        {/* Info column */}
        <div>
          <h3
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-6"
            style={{fontFamily: "'Space Grotesk', sans-serif", color: '#6D6A63'}}
          >
            Info
          </h3>
          <ul className="space-y-3">
            <li>
              <a
                href="/account"
                className="text-sm hover:text-[#FF481A] transition-colors"
                style={{color: '#F0F1F1'}}
              >
                My Account
              </a>
            </li>
            <li>
              <a
                href="https://shopify.dev/custom-storefronts/hydrogen"
                target="_blank"
                rel="noreferrer"
                className="text-sm hover:text-[#FF481A] transition-colors"
                style={{color: '#F0F1F1'}}
              >
                Powered by Hydrogen
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t px-8 md:px-16 py-6 flex items-center justify-between text-xs"
        style={{borderColor: '#444650', color: '#6D6A63', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.04em'}}
      >
        <span>© {new Date().getFullYear()} Apply Digital. All rights reserved.</span>
        <span className="uppercase tracking-[0.06em]">Editorial Momentum</span>
      </div>
    </footer>
  );
}
