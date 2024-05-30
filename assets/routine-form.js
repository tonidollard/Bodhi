function isInViewport(element) {
  // Get the bounding client rectangle position in the viewport
  var bounding = element.getBoundingClientRect();

  // Checking part. Here the code checks if it's *fully* visible
  // Edit this part if you just want a partial visibility
  if (
      bounding.top <= 200
  ) {
      return true;
  } else {
      return false;
  }
}

class RoutineModal extends HTMLElement {
  constructor() {
    super();
    this.container = this.querySelector('.routine-modal-info .product-info-modal');
    this.backdrop = this.querySelector('.routine-modal-backdrop');
    this.closeButton = this.querySelector('.close-button');
    document.querySelectorAll('.info-button').forEach(
      (button) => button.addEventListener('click', this.openModal.bind(this))
    );
    this.closeButton.addEventListener('click', this.onClose.bind(this))
    this.backdrop.addEventListener('click', this.onClose.bind(this));
  }

  openModal(e){
   var modalHtml = e.target.closest(".routine--form-field-inner").querySelector('.product-info-modal').innerHTML;
   this.container.innerHTML = modalHtml;
   document.body.style.overflow = 'hidden';
   this.setAttribute('open','');

  }

  onClose(){
    this.removeAttribute('open');
    document.body.style.overflow = 'visible';
  }
}
customElements.define('routine-modal', RoutineModal);

class QuantityInputRoutine extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true })
    this.routineForm = document.querySelector('routine-form');
    this.variant = JSON.parse(this.querySelector('[data-variant]').textContent);
    this.parentNode.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  buttonChanges(status, text){
    const submitButton = document.querySelector('.routine--sidebar button[type="submit"]');
    if(status){
      submitButton.setAttribute('aria-disabled', status);
      submitButton.setAttribute('disabled', status);
    } else {
      submitButton.removeAttribute('aria-disabled');
      submitButton.removeAttribute('disabled');
    }
    submitButton.querySelector('span').innerHTML = text;
  }

  onAddToCartUpdate() {
    if(this.routineForm.quantity == 0) {
      this.buttonChanges(true, 'Select 3 Options');
    } else if (this.routineForm.quantity >= 1 && this.routineForm.quantity < 3) {
      this.buttonChanges(true, `Select ${3 - this.routineForm.quantity} More Options`); 
    } else {
      this.buttonChanges(false, 'Add to Cart');
    }
  }

  onUpdateInputState(status){
    const previousValue = this.input.value;
    if(status === 'add-item'){
      this.routineForm.addItem(this.variant.id, 1, this.parentNode);
      this.handleSelection('plus');
    } else {
      if(status === 'plus') {
        this.handleSelection('plus');
      } else {
        this.handleSelection('minus');
      }
      
      this.routineForm.updateItem(this.variant.id, this.input.value, this.parentNode);
      if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
    }
  }

  onButtonClick(event) {
    event.preventDefault();
    this.onUpdateInputState(event.target.name);
    this.onAddToCartUpdate();
  }

  createSelectionElement(status){
    const placeHolderImage = document.querySelector('.selection-container').dataset.placeholder;
    const elementDiv = `<div class="selection--inner${status === 'plus' ? '' : ' in-active'}" ${ status === 'plus' ? `data-variant-${this.variant.id}` : '' }>
                          <button class="remove-item" ${status === 'plus' ? `data-id-${this.variant.id}` : ''}><svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" role="presentation" class="icon icon-close" fill="none" viewBox="0 0 18 17">
                              <path d="M.865 15.978a.5.5 0 00.707.707l7.433-7.431 7.579 7.282a.501.501 0 00.846-.37.5.5 0 00-.153-.351L9.712 8.546l7.417-7.416a.5.5 0 10-.707-.708L8.991 7.853 1.413.573a.5.5 0 10-.693.72l7.563 7.268-7.418 7.417z" fill="currentColor">
                              </path></svg>
                          </button>
                          <img src="${status === 'plus' ? this.variant.featured_image.src : placeHolderImage}" width="200" height="200">
                      </div>`
    return elementDiv;
  }

  onRemoveButton(event) {
    event.preventDefault();
    this.onUpdateInputState('minus');
    this.onAddToCartUpdate();
  }

  handleSelection(status){
    const selectionContainer = document.querySelector('.selection-container');
    const activeSelectionItems = document.querySelectorAll('.selection--inner:not(.in-active)');
    const inActiveSelectionItems = document.querySelectorAll('.selection--inner.in-active');
    const activeSelection = document.querySelector(`[data-variant-${this.variant.id}]`);
    const itemIndex = this.routineForm.items.findIndex(item => item.id == this.variant.id);
  
    if(status == "plus") {
      this.input.stepUp(); 
      this.routineForm.updateQuantity('plus');
      this.routineForm.updatePrice('plus', this.variant.price);
      if(!activeSelection){
        if( inActiveSelectionItems[0]){
          inActiveSelectionItems[0].insertAdjacentHTML("afterend", this.createSelectionElement('plus'));
          inActiveSelectionItems[0].remove();
        } else {
          selectionContainer.insertAdjacentHTML("beforeend", this.createSelectionElement('plus'));
        }
        document.querySelector(`[data-variant-${this.variant.id}] button`).addEventListener('click', this.onRemoveButton.bind(this));
      }      
    } else {
      this.input.stepDown();
      this.routineForm.updateQuantity('minus');
      this.routineForm.updatePrice('minus', this.variant.price);
      if(this.routineForm.items[itemIndex].quantity == 1){
        activeSelection.remove();
        if(activeSelectionItems.length < 4){
          selectionContainer.insertAdjacentHTML("beforeend", this.createSelectionElement('minus'));
        }
      }
    }
  }
}

customElements.define('quantity-input-routine', QuantityInputRoutine);

if (!customElements.get('routine-form')) {
    customElements.define('routine-form', class RoutineForm extends HTMLElement {
      constructor() {
        super();
        this.items = [];
        this.price = 0;
        this.quantity = 0;
        this.addToCartBtn = this.querySelector('.rotuine-form__submit');
        this.addToCartBtn.addEventListener('click', this.onSubmitHandler.bind(this));
        this.cartItems = document.querySelector('cart-items');

        window.addEventListener('scroll', function (event) {
          if( window.innerWidth < 991){
            if (isInViewport(document.querySelector('.routine--main'))) {
              document.querySelector('.routine--main').classList.add('active');
            } else {
              document.querySelector('.routine--main').classList.remove('active');
            }
          }
         
        }, false);
      }

      updateQuantity(status){
        if(status == "plus"){
          this.quantity += 1
        } else {
          this.quantity -= 1
        }
      }

      updatePrice(status, price){
        const mainPrice =  document.querySelector('.main-price');
        if(status === 'plus'){
          this.price += price;
        } else {
          this.price -= price;
        }
        var newPrice = this.quantity <= 2 ? `<span>$${(this.price / 100).toFixed(2)}</span>`:  `<s class="light">$${(this.price / 100).toFixed(2)}</s><span>$${((this.price * 0.9)/ 100).toFixed(2)}</span>`;

        mainPrice.innerHTML = newPrice;
      }

      updateItem(id, quantity, container) {
        const itemIndex = this.items.findIndex(item => item.id == id);
        const variantExists = document.querySelector(`[data-variant-${id}]`);
        this.items[itemIndex].quantity = quantity;
        if(variantExists ){
          if(quantity > 1) {
            if(variantExists.querySelector('.bubble-quantity')) {
              variantExists.querySelector('.bubble-quantity').remove();
            }
            variantExists.insertAdjacentHTML('beforeend', `<span class="bubble-quantity">${quantity}</span>`);
          } else {
            variantExists.querySelector('.bubble-quantity').remove();
          }
        }

        if(quantity == 0 ){
          this.items.splice(itemIndex, 1); 
          container.classList.remove('active');
        }
      }

      addItem(id, quantity, container){
        this.items.push({ id, quantity });
        container.classList.add('active');
      }
  
      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.addToCartBtn.classList.contains('loading')) return;
  
        //this.handleErrorMessage();
        this.addToCartBtn.setAttribute('aria-disabled', true);
        this.addToCartBtn.classList.add('loading');
        this.addToCartBtn.querySelector('.loading-overlay__spinner').classList.remove('hidden');

        const body = JSON.stringify({
          items: this.items,
          sections: this.cartItems.getSectionsToRender().map((section) => section.section),
          sections_url: window.location.pathname
        });
        
        fetch(`${routes.cart_add_url}`, {...fetchConfig(), ...{ body }})
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.handleErrorMessage(response.description);
              return;
            }
            console.log(response);
            this.cartItems.renderAddToCart(response);
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.addToCartBtn.classList.remove('loading');
            this.addToCartBtn.removeAttribute('aria-disabled');
            this.addToCartBtn.querySelector('.loading-overlay__spinner').classList.add('hidden');
          });
      }
  
      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');
  
        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);
  
        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    });
}
  