class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      this.closest('cart-items').updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status');
    this.cartDrawer = document.querySelector('cart-drawer');
    this.productList = document.querySelector('.product_list');
    this.productListItem = document.querySelector('.product_list--item');
    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]'))
      .reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener('change', this.debouncedOnChange.bind(this));

    this.cartItems = "main-cart-items";
    this.cartFooter = "main-cart-footer";
    this.cartItemSelector = '.js-contents';

    if(!document.body.classList.contains('cart')){
      if(this.productListItem){
        this.productList.classList.remove('hidden');
      } else {
        this.productList.classList.add('hidden');
      }
      this.cartItems = "main-cart-drawer-items";
      this.cartFooter = "main-cart-drawer-footer";
      this.cartItemSelector = '.cart_items--main';
    }
  }

  onChange(event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'));
  }

  getSectionsToRender() {
    return [
      {
        id: this.cartItems,
        section: this.cartItems,
        selector: this.cartItemSelector,
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section'
      },
      {
        id: this.cartFooter,
        section: this.cartFooter,
        selector: `#${this.cartFooter}`,
      }
    ];
  }

  updateQuantity(line, quantity, name) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname
    });

    fetch(`${routes.cart_change_url}`, {...fetchConfig(), ...{ body }})
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartFooter = document.getElementById(this.cartFooter);

        if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);

        this.getSectionsToRender().forEach((section => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);

          elementToReplace.innerHTML =
            this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
        }));

        this.updateLiveRegions(line, parsedState.item_count);
        const lineItem =  document.getElementById(`CartItem-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) lineItem.querySelector(`[name="${name}"]`).focus();

        this.disableLoading();
      }).catch((e) => {
        console.log(e);
        this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));
        document.getElementById('cart-errors').textContent = window.cartStrings.error;
        this.disableLoading();
      });
  }

  renderAddToCart(parsedState) {
    const cartFooter = document.getElementById(this.cartFooter);
    if (cartFooter) cartFooter.classList.remove('is-empty');
    this.classList.remove('is-empty');
    this.getSectionsToRender().forEach((section => {
      const elementToReplace =
        document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
      elementToReplace.innerHTML =
        this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
    }));
    this.cartDrawer.onOpen();
  }

  updateLiveRegions(line, itemCount) {
    
    // Causing error on cart without actual errors 
    // if (this.currentItemCount === itemCount) {
    //   document.getElementById(`Line-item-error-${line}`)
    //     .querySelector('.cart-item__error-text')
    //     .innerHTML = window.cartStrings.quantityError.replace(
    //       '[quantity]',
    //       document.getElementById(`Quantity-${line}`).value
    //     );
    // }

    this.currentItemCount = itemCount;
    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus = document.getElementById('cart-live-region-text');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    var newCartData =  new DOMParser().parseFromString(html, 'text/html');

    if(!newCartData.querySelector('.product_list--item') && newCartData.querySelector('.product_list')){
      newCartData.querySelector('.product_list').className += ' hidden';
    } 

    return newCartData.querySelector(selector).innerHTML;
    
  }

  enableLoading(line) {
    console.log(this.cartItems);
    document.getElementById(this.cartItems).classList.add('cart__items--disabled');
    this.querySelectorAll(`#CartItem-${line} .loading-overlay`).forEach((overlay) => overlay.classList.remove('hidden'));
    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading() {
    document.getElementById(this.cartItems).classList.remove('cart__items--disabled');
  }
}

customElements.define('cart-items', CartItems);
