import {Link} from '@shopify/hydrogen';

/**
 * Apply Digital — Editorial Momentum
 * Desktop nav: Medium 500 labels, tracked out, orange on hover/active
 */
export default function Navigation({collections}) {
  return (
    <nav className="hidden lg:flex items-center gap-8" aria-label="Collections">
      {collections.map((collection) => (
        <Link
          key={collection.id}
          to={`/collections/${collection.handle}`}
          className="text-[#282A33] hover:text-[#FF481A] transition-colors text-[13px] font-medium tracking-[0.06em] uppercase whitespace-nowrap"
          style={{fontFamily: "'Space Grotesk', sans-serif"}}
        >
          {collection.title}
        </Link>
      ))}
    </nav>
  );
}
