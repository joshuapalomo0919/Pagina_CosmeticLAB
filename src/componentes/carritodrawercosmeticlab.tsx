import { useCosmetic } from '../context/cosmeticlab';
import { formatearMoneda } from '../utils/formato';

interface CartDrawerProps {
  total: number;
  onClose: () => void;
}

const CartDrawer = ({ total, onClose }: CartDrawerProps) => {
  const { cart, removeFromCart, clearCart, language } = useCosmetic();
  const copy = language === 'es'
    ? { empty: 'Tu carrito esta vacio', total: 'Total', checkout: 'Finalizar compra', bag: 'Tu bolsa de belleza', remove: 'Eliminar producto' }
    : { empty: 'Your cart is empty', total: 'Total', checkout: 'Checkout', bag: 'Your beauty bag', remove: 'Remove product' };
  return (
    <div className="cart-backdrop" onClick={onClose}>
      <aside className="cart-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="cart-heading">
          <div><span className="eyebrow">CosmeticLAB</span><h2>{copy.bag}</h2></div>
          <button className="close-button" onClick={onClose} aria-label={language === 'es' ? 'Cerrar carrito' : 'Close cart'}>×</button>
        </div>
        {cart.length === 0 ? <p className="empty-cart">{copy.empty}</p> : (
          <>
            <div className="cart-items">
              {cart.map((product, index) => (
                <div className="cart-item" key={`${product.id}-${index}`}>
                  <img src={product.image} alt={product.name} />
                  <div><strong>{product.name}</strong><span>{formatearMoneda(product.price)}</span></div>
                  <button onClick={() => removeFromCart(product.id)} aria-label={copy.remove}>×</button>
                </div>
              ))}
            </div>
            <div className="cart-total"><span>{copy.total}</span><strong>{formatearMoneda(total)}</strong></div>
            <button className="btn-primary checkout-button" onClick={clearCart}>{copy.checkout}</button>
          </>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;
