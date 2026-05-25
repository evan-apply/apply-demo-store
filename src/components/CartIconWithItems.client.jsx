import {useCart} from '@shopify/hydrogen';

import CartIcon from './CartIcon';

/**
 * A client component that specifies the icon to use if a cart contains merchandise
 */
export default function CartIconWithItems() {
  const {totalQuantity} = useCart();

  return (
    <>
      <div className="relative">
        <CartIcon />

        <div
          className={`text-[9px] rounded-full leading-none text-white absolute -top-1 -right-1 flex items-center justify-center transition-all ${
            totalQuantity > 0 ? 'h-4 w-4' : 'h-0 w-0 overflow-hidden'
          }`}
          style={{backgroundColor: '#FF481A'}}
          aria-hidden
        >
          {totalQuantity > 0 ? totalQuantity : null}
        </div>
      </div>
      <span className="sr-only">Cart, {totalQuantity} items</span>
    </>
  );
}
