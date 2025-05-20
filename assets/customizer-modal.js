/**
 * Fathead Customizer Integration Module
 * 
 * This module handles the integration between the Shopify store and the customizer application.
 * It manages the modal overlay, product variant selection, and cart interactions.
 */
(function() {
  //#region Configuration and Constants
  
  // Basic configuration
  const config = {
    customizerUrl: window.FATHEAD_CONFIG?.customizerUrl || 'https://fathead-customizer.vercel.app',
    buttonId: 'fathead-customizer-btn'
  };

  // Allowed origins for postMessage communication
  const allowedOrigins = window.FATHEAD_CONFIG?.allowedOrigins || [
    'https://fathead-customizer.vercel.app',
    'https://fathead.com',
    'null' // Allow null origin during development
  ];
  
  //#endregion

  //#region Initialization
  
  /**
   * Initializes the customizer modal functionality
   * @param {Object} options - Optional configuration overrides
   */
  function init(options = {}) {
    Object.assign(config, options);
    setupCustomizerButton();
  }
  
  /**
   * Sets up the customizer button click handler
   */
  function setupCustomizerButton() {
    const customizerBtn = document.getElementById(config.buttonId);
    if (!customizerBtn) {
      console.warn('[Customizer] Button not found:', config.buttonId);
      return;
    }
  
    console.log('[Customizer] Button found and ready');
    
    
    customizerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = customizerBtn.getAttribute('data-product-id');
      const variantId = getVariantId(customizerBtn);
      
      const overlay = createCustomizerOverlay(productId, variantId);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      
      setupOverlayListeners(overlay);
    });
  }
  
  //#endregion

  //#region UI Creation and Management
  
  /**
   * Creates the customizer overlay with iframe
   * @param {string} productId - The product ID
   * @param {string} variantId - The variant ID
   * @returns {HTMLElement} The overlay element
   */
  function createCustomizerOverlay(productId, variantId) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:9999999;display:flex;align-items:center;justify-content:center;padding: 20px 20px 40px 20px;';
    
    // Check if wooden handle checkbox exists and get its value
    let woodenHandleValue = null;
    const woodenHandleCheckbox = document.querySelector('input[name="properties[Include A Wooden Handle (Free - U.S. Residents Only)]"][type="checkbox"]');
    if (woodenHandleCheckbox) {
      woodenHandleValue = woodenHandleCheckbox.checked ? 'Yes' : 'No';
    }
    
    // Build the URL with all parameters
    let iframeUrl = `${config.customizerUrl}?product_id=${productId}&variant_id=${variantId}&embedded=true`;
    
    // Add wooden handle parameter if it exists
    if (woodenHandleValue !== null) {
      iframeUrl += `&wooden_handle=${woodenHandleValue}`;
    }
    
    overlay.innerHTML = `<iframe 
      src="${iframeUrl}" 
      style="width:90%;height:90%;max-width:1500px;max-height:800px;border:none;border-radius:8px;background:white;" 
      frameborder="0"
      allowtransparency="true"
      allowfullscreen="true"
      scrolling="yes"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
    </iframe>`;
    
    return overlay;
  }
  
  /**
   * Closes the customizer overlay and restores page scrolling
   * @param {HTMLElement} overlay - The overlay DOM element to remove
   */
  function closeOverlay(overlay) {
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  }
  
  //#endregion

  //#region Event Handling
  
  /**
   * Sets up event listeners for the customizer overlay
   * @param {HTMLElement} overlay - The overlay element
   */
  function setupOverlayListeners(overlay) {
    // Handle clicking outside the iframe
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeOverlay(overlay);
      }
    });
    
    // Handle messages from iframe
    window.addEventListener('message', function globalHandler(event) {
      if (!isAllowedOrigin(event.origin)) {
        console.log('Ignoring message from unauthorized origin:', event.origin);
        return;
      }
      
      handleCustomizerMessage(event.data, overlay);
    });
  }
  
  /**
   * Handles messages from the customizer iframe
   * @param {Object} data - The message data
   * @param {HTMLElement} overlay - The overlay element
   */
  function handleCustomizerMessage(data, overlay) {
    switch (data.type) {
      case 'CART_UPDATED':
        closeOverlay(overlay);
        if (data.success) {
          setTimeout(openCartDrawer, 300);
        }
        break;
        
      case 'CLOSE_CUSTOMIZER':
        closeOverlay(overlay);
        break;
        
      case 'ADD_TO_CART':
        handleAddToCart(data.items, overlay);
        break;
    }
  }
  
  //#endregion

  //#region Cart Operations
  
  /**
   * Handles adding items to cart
   * @param {Array} items - The items to add to cart
   * @param {HTMLElement} overlay - The overlay element
   */
  function handleAddToCart(items, overlay) {
    console.log('ADD_TO_CART payload:', items);
    
    // Clone items to avoid modifying original
    const processedItems = JSON.parse(JSON.stringify(items));
    
    // Add to cart with processed items
    fetch('/cart/add.js', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'same-origin',
      body: JSON.stringify({ items: processedItems }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Successfully added to cart:', data);
      closeOverlay(overlay);
      
      // Open cart drawer with delay
      setTimeout(openCartDrawer, 300);
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
    });
  }
  
  /**
   * Opens the cart drawer using multiple fallback methods
   * @returns {boolean} True if any method was attempted
   */
  function openCartDrawer() {
    console.log('Attempting to open cart drawer...');
    
    // Try direct AJAX cart open first
    try {
      // Method 1: Try Shopify AJAX API directly
      fetch('/cart.js', { method: 'GET', credentials: 'same-origin' })
        .then(res => {
          console.log('Cart fetch status:', res.status);
        });
      
      // Method 2: Try cart page with drawer param
      fetch('/cart?view=drawer', { method: 'GET', credentials: 'same-origin' });
      
      console.log('Triggered AJAX cart fetch');
    } catch (e) {
      console.error('AJAX cart fetch failed:', e);
    }
    
    // Fathead-specific cart selectors
    const fatheadSelectors = [
      '.cart-count-bubble',
      '.cart-trigger',
      '.site-header__cart',
      '.header__cart',
      '#site-header-cart',
      '.header-cart-btn',
      '#CartButton',
      '.cart-page-link',
      '.header-bar__module a[href="/cart"]'
    ];
    
    // Try clicking all possible cart elements
    [...fatheadSelectors, ...document.querySelectorAll('a[href="/cart"]')].forEach(selector => {
      let elements;
      if (typeof selector === 'string') {
        elements = document.querySelectorAll(selector);
      } else {
        elements = [selector];
      }
      
      if (elements.length > 0) {
        console.log('Found cart element:', selector);
        elements[0].click();
      }
    });
    
    return true;
  }
  
  //#endregion

  //#region Utility Functions
  
  /**
   * Gets the variant ID from URL params or button attribute
   * @param {HTMLElement} button - The customizer button element
   * @returns {string} The variant ID
   */
  function getVariantId(button) {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('variant')) {
      const variantId = urlParams.get('variant');
      console.log('Using variant ID from URL:', variantId);
      return variantId;
    } else {
      const variantId = button.getAttribute('data-variant-id');
      console.log('Using variant ID from button attribute:', variantId);
      return variantId;
    }
  }
  
  /**
   * Checks if the origin is allowed for postMessage communication
   * @param {string} origin - The origin to check
   * @returns {boolean} Whether the origin is allowed
   */
  function isAllowedOrigin(origin) {
    return allowedOrigins.includes(origin) || 
           origin === 'null' || 
           allowedOrigins.some(allowed => origin.includes(allowed));
  }
  
  //#endregion

  // Expose the init function globally
  window.CustomizerModal = { init };
})(); 
