if (!customElements.get('product-form')) {
  var sellingPlanContainer = document.querySelector('.selling-plan-fieldset');

  if (sellingPlanContainer) {
    var product = JSON.parse(document.getElementById('data-product').textContent);
    var productForm = document.querySelector('.product-form').querySelector('form');
    var isSubscription;



    // Watch for variant selection to update selling plan option selectors
    document.querySelectorAll('input[type=radio][name=selling_plan]').forEach(function (optionSelector) {
      optionSelector.addEventListener('change', function () {
        var isSubscription = this.value == '' ? false : true;
        PriceChange();
        if (isSubscription) {
          sellingPlanContainer.classList.remove('hidden-form');
        } else {
          sellingPlanContainer.classList.add('hidden-form');
        }
      });
    });

    // document.querySelector('[data-subscription]').click();

    // Watch for selling plan option change to update the selected selling plan
    sellingPlanContainer.querySelector('select').addEventListener('change', function () {
      document.querySelector('[data-subscription]').setAttribute('value', this.value);
    });

    productForm.querySelector('input[name="id"]').addEventListener('change', function () {
      PriceChange();
    });
  }
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cartNotification = document.querySelector('cart-notification');
      this.cartItems = document.querySelector('cart-items');
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      const submitButton = this.querySelector('[type="submit"]');
      if (submitButton.classList.contains('loading')) return;

      //this.handleErrorMessage();
      submitButton.setAttribute('aria-disabled', true);
      submitButton.classList.add('loading');
      this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const formData = new FormData(this.form);
      console.log(formData);
      formData.append('sections', this.cartItems.getSectionsToRender().map((section) => section.section));
      formData.append('sections_url', window.location.pathname);
      config.body = formData;

      console.log(new URLSearchParams(formData).toString());

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            this.handleErrorMessage(response.description);
            return;
          }
          console.log(response);
        
          document.getElementById('main-cart-drawer-items').scrollTop = 0;
          this.cartItems.renderAddToCart(response);
        
          dataLayer.push({ 'ecommerce': null });dataLayer.push({
            'event': 'add_to_cart',
            'ecommerce': {
                    'items': [{
                    'item_id': response.product_title,
                    'item_name': response.product_title,
                    'item_vendor':  response.vendor,
                    'item_variant': response.variant_title != null ?  response.variant_title : '' ,
                    'item_category': response.selling_plan_allocation ? 'Subscription' : 'One-time purchase',
                    'currency': currency,
                    'price': (response.price / 100).toFixed(2),
                    'quantity': 1,
                    
                    }]
                }
          });
          
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          submitButton.classList.remove('loading');
          submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading-overlay__spinner').classList.add('hidden');
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
