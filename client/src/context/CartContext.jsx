import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // 1. INITIALIZE FROM LOCAL STORAGE
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('mediflow_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      return [];
    }
  });

  // 2. AUTO-SAVE
  useEffect(() => {
    localStorage.setItem('mediflow_cart', JSON.stringify(cart));
  }, [cart]);

  // Add Item
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);
      if (existingItem) {
        return prevCart.map((item) =>
          item._id === product._id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Remove Item
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
  };

  // 🟢 NEW: INCREMENT / DECREMENT LOGIC
  const updateQuantity = (productId, action) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item._id === productId) {
          let currentQty = item.quantity || 1;

          if (action === 'increase') currentQty += 1;
          if (action === 'decrease' && currentQty > 1) currentQty -= 1; // Prevents going to 0

          return { ...item, quantity: currentQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('mediflow_cart');
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
  };

  const processCheckout = async (user, totalAmount, onOrderSuccess) => {
    if (cart.length === 0) {
        toast.error("Your cart is empty");
        return;
    }

    const res = await loadRazorpayScript();
    if (!res) {
        toast.error("Razorpay SDK failed to load");
        return;
    }

    // 🟢 GRAB THE TOKEN (Assuming you store it in localStorage)
    const token = localStorage.getItem('token'); 

    try {
        // 1. Send token to create the Razorpay Order
        const orderResponse = await fetch("http://localhost:5001/api/payments/create-order", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // 👈 ADD THIS LINE
            },
            body: JSON.stringify({ amount: totalAmount }),
        });
        
        if (!orderResponse.ok) throw new Error("Payment authorization failed");
        const orderData = await orderResponse.json();

        const options = {
            key: "rzp_test_your_key_id", // Keep your real test key here
            amount: orderData.amount,
            currency: "INR",
            name: "MediFlow AI",
            description: "Medical Essentials Checkout",
            order_id: orderData.id,
            handler: async function (response) {
                
                // 2. Send token to save the order to your Database
                const dbRes = await fetch("http://localhost:5001/api/orders/create", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` // 👈 ADD THIS LINE
                    },
                    body: JSON.stringify({
                        patientId: user.id || user._id,
                        paymentId: response.razorpay_payment_id,
                        items: cart,
                        totalAmount: totalAmount
                    })
                });

                if (dbRes.ok) {
                    setCart([]); 
                    if (onOrderSuccess) onOrderSuccess();
                }
            },
            theme: { color: "#5747e6" }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (err) {
        console.error(err);
        toast.error("Checkout authorization failed");
    }
  };

  // 🟢 Make sure to export `updateQuantity` here!
  return (
    <CartContext.Provider value={{ cart, setCart, addToCart, removeFromCart, updateQuantity, clearCart, processCheckout }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);