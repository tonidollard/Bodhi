class CartDrawer extends HTMLElement {
    constructor() {
      super();

      this.isOpen = false;
      this.scrollBarWidth = (window.innerWidth - document.body.clientWidth) + 'px';
      console.log(this.scrollBarWidth);
      this.closeButton = document.querySelectorAll('[data-cart-drawer-close]');
      this.drawerBackdrop = document.querySelector('.cart-drawer-backdrop');
      this.closeButton.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            this.onToggle();
        });
      });
    }

    onClose(){
        this.classList.remove('active');
        document.querySelector('body').style.paddingRight = 0
        this.drawerBackdrop.classList.remove('active');
        document.body.style.overflow = 'visible';
        this.isOpen = false;
    }

    onOpen(){
        this.classList.add('active');
        document.querySelector('body').style.paddingRight = this.scrollBarWidth;
        this.drawerBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.isOpen = true;
    }

    onToggle(){
        console.log('clicked');
        if(this.isOpen){
            this.onClose();     
        } else {
            this.onOpen();
        } 
    }
  }
  
customElements.define('cart-drawer', CartDrawer);


class CartNote extends HTMLElement {
    constructor() {
      super();

      this.addEventListener('change', debounce((event) => {
        const body = JSON.stringify({ note: event.target.value });
        fetch(`${routes.cart_update_url}`, {...fetchConfig(), ...{ body }});
      }, 300))
    }
}

customElements.define('cart-note', CartNote);