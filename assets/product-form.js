if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');
        this.hideErrors = this.dataset.hideErrors === 'true';
        this.error = false;

        if (document.querySelector('cart-drawer')) {
          this.submitButton.setAttribute('aria-haspopup', 'dialog');
        }

        this.warmCartSession();
      }

      warmCartSession() {
        if (window.__curlearCartWarmed) return;
        window.__curlearCartWarmed = true;

        const warm = () => {
          fetch(`${routes.cart_url}.js`, { credentials: 'same-origin' }).catch(() => {});
        };

        if ('requestIdleCallback' in window) {
          requestIdleCallback(warm, { timeout: 2000 });
        } else {
          setTimeout(warm, 400);
        }
      }

      async getCart() {
        if (document.querySelector('cart-drawer')) {
          try {
            await Promise.race([
              customElements.whenDefined('cart-drawer'),
              new Promise((resolve) => setTimeout(resolve, 2500)),
            ]);
          } catch (e) {}
          return document.querySelector('cart-drawer');
        }

        if (document.querySelector('cart-notification')) {
          try {
            await Promise.race([
              customElements.whenDefined('cart-notification'),
              new Promise((resolve) => setTimeout(resolve, 2500)),
            ]);
          } catch (e) {}
          return document.querySelector('cart-notification');
        }

        return null;
      }

      async onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();
        this.error = false;

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner')?.classList.remove('hidden');

        const cart = await this.getCart();
        this.cart = cart;

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (cart?.getSectionsToRender) {
          formData.append(
            'sections',
            cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          cart.setActiveElement?.(document.activeElement);
        }
        config.body = formData;

        // Open drawer early so first-time visitors get instant feedback.
        if (cart?.tagName === 'CART-DRAWER' && typeof cart.open === 'function') {
          cart.classList.remove('is-empty');
          cart.querySelector('.drawer__inner')?.classList.remove('is-empty');
          cart.open(this.submitButton);
        }

        try {
          const response = await fetch(`${routes.cart_add_url}`, config);
          const responseJson = await response.json();

          if (responseJson.status) {
            publish(PUB_SUB_EVENTS.cartError, {
              source: 'product-form',
              productVariantId: formData.get('id'),
              errors: responseJson.errors || responseJson.description,
              message: responseJson.message,
            });
            this.handleErrorMessage(responseJson.description);
            cart?.close?.();

            const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
            if (soldOutMessage) {
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
            }
            return;
          }

          if (!cart) {
            window.location = window.routes.cart_url;
            return;
          }

          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'product-form',
            productVariantId: formData.get('id'),
            cartData: responseJson,
          });

          const quickAddModal = this.closest('quick-add-modal');
          if (quickAddModal) {
            document.body.addEventListener(
              'modalClosed',
              () => {
                setTimeout(() => {
                  cart.renderContents(responseJson);
                });
              },
              { once: true }
            );
            quickAddModal.hide(true);
          } else {
            cart.renderContents(responseJson);
          }
        } catch (e) {
          console.error(e);
          this.handleErrorMessage(window.cartStrings?.error);
          cart?.close?.();
        } finally {
          this.submitButton.classList.remove('loading');
          if (cart?.classList?.contains('is-empty')) cart.classList.remove('is-empty');
          if (!this.error) this.submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading__spinner')?.classList.add('hidden');
        }
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (!this.submitButton) return;

        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          this.submitButton.setAttribute('aria-disabled', 'true');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButton.removeAttribute('aria-disabled');
          this.submitButton.classList.remove('loading');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
          this.querySelector('.loading__spinner')?.classList.add('hidden');
        }

        this.querySelectorAll(
          '.shopify-payment-button__button, .shopify-payment-button__button--unbranded, .shopify-payment-button [role="button"]'
        ).forEach((button) => {
          if (disable) return;
          button.removeAttribute('disabled');
          button.removeAttribute('aria-disabled');
        });
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
