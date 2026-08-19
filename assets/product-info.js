if (!customElements.get('product-info')) {
  customElements.define(
    'product-info',
    class ProductInfo extends HTMLElement {
      quantityInput = undefined;
      quantityForm = undefined;
      onVariantChangeUnsubscriber = undefined;
      cartUpdateUnsubscriber = undefined;
      abortController = undefined;
      pendingRequestUrl = null;
      variantRequestId = 0;
      static requestCache = new Map();
      preProcessHtmlCallbacks = [];
      postProcessHtmlCallbacks = [];

      constructor() {
        super();

        this.quantityInput = this.querySelector('.quantity__input');
      }

      connectedCallback() {
        this.initializeProductSwapUtility();

        this.onVariantChangeUnsubscriber = subscribe(
          PUB_SUB_EVENTS.optionValueSelectionChange,
          this.handleOptionValueChange.bind(this)
        );

        this.initQuantityHandlers();
        this.initPinDetailsScrollChain();
        this.dispatchEvent(new CustomEvent('product-info:loaded', { bubbles: true }));
      }

      initPinDetailsScrollChain() {
        if (this.pinDetailsWheelHandler) return;

        this.pinDetailsWheelHandler = (event) => {
          if (!window.matchMedia('(min-width: 750px)').matches) return;

          const container = event.target.closest(
            '.product--pin-details .product__info-wrapper.product__column-sticky > .product__info-container'
          );
          if (!container || !this.contains(container)) return;

          const maxScroll = container.scrollHeight - container.clientHeight;
          const deltaY = event.deltaY;

          if (maxScroll <= 1) {
            event.preventDefault();
            window.scrollBy({ top: deltaY, left: event.deltaX, behavior: 'auto' });
            return;
          }

          const atTop = container.scrollTop <= 0;
          const atBottom = container.scrollTop >= maxScroll - 1;

          if ((deltaY > 0 && atBottom) || (deltaY < 0 && atTop)) {
            event.preventDefault();
            window.scrollBy({ top: deltaY, left: event.deltaX, behavior: 'auto' });
          }
        };

        this.addEventListener('wheel', this.pinDetailsWheelHandler, { passive: false, capture: true });
      }

      addPreProcessCallback(callback) {
        this.preProcessHtmlCallbacks.push(callback);
      }

      initQuantityHandlers() {
        if (!this.quantityInput) return;

        this.quantityForm = this.querySelector('.product-form__quantity');
        if (!this.quantityForm) return;

        this.setQuantityBoundries();
        if (!this.dataset.originalSection) {
          this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
        }
      }

      disconnectedCallback() {
        this.onVariantChangeUnsubscriber();
        this.cartUpdateUnsubscriber?.();
        if (this.pinDetailsWheelHandler) {
          this.removeEventListener('wheel', this.pinDetailsWheelHandler, { capture: true });
          this.pinDetailsWheelHandler = undefined;
        }
      }

      initializeProductSwapUtility() {
        this.preProcessHtmlCallbacks.push((html) =>
          html.querySelectorAll('.scroll-trigger').forEach((element) => element.classList.add('scroll-trigger--cancel'))
        );
        this.postProcessHtmlCallbacks.push((newNode) => {
          requestAnimationFrame(() => {
            const hasPaymentButton = newNode.querySelector('.shopify-payment-button');
            if (hasPaymentButton && window?.Shopify?.PaymentButton?.init) {
              window.Shopify.PaymentButton.init();
            }
          });
        });
      }

      handleOptionValueChange({ data: { event, target, selectedOptionValues } }) {
        if (!this.contains(event.target)) return;

        const isMobile = window.matchMedia('(max-width: 749px)').matches;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        target?.focus?.({ preventScroll: true });

        this.resetProductFormState();
        this.applyOptimisticVariant(selectedOptionValues);

        const productUrl = target.dataset.productUrl || this.pendingRequestUrl || this.dataset.url;
        this.pendingRequestUrl = productUrl;
        const shouldSwapProduct = this.dataset.url !== productUrl;

        this.renderProductInfo({
          requestUrl: this.buildRequestUrlWithParams(productUrl, selectedOptionValues, false),
          targetId: target.id,
          callback: shouldSwapProduct
            ? this.handleSwapProduct(productUrl, false)
            : this.handleUpdateProductInfo(productUrl),
        });

        if (isMobile) {
          window.scrollTo(scrollX, scrollY);
          requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
        }
      }

      applyOptimisticVariant(selectedOptionValues) {
        const match = this.findVariantFromOptionValues(selectedOptionValues);
        if (!match) return;

        if (match.id) this.updateVariantInputs(match.id);
        if (match.featuredMediaId) {
          this.querySelector('media-gallery')?.setActiveMedia?.(
            `${this.dataset.section}-${match.featuredMediaId}`,
            true
          );
        }
        this.productForm?.toggleSubmitButton(false);
      }

      findVariantFromOptionValues(selectedOptionValues) {
        const lookupNode = this.querySelector('variant-selects [data-variant-lookup]');
        if (!lookupNode) return null;

        let variants = [];
        try {
          variants = JSON.parse(lookupNode.textContent);
        } catch (error) {
          return null;
        }

        const selectedKey = [...selectedOptionValues].map(String).sort().join(',');
        return (
          variants.find((variant) => {
            const key = (variant.optionValueIds || []).map(String).sort().join(',');
            return key === selectedKey;
          }) || null
        );
      }

      prefetchVariantFromInput(input) {
        const productUrl = input.dataset.productUrl || this.dataset.url;
        const selected = this.variantSelectors?.selectedOptionValues || [];
        const optionValueId = input.dataset.optionValueId;
        if (!optionValueId) return;

        const fieldset = input.closest('fieldset');
        const nextSelected = selected.filter((id) => {
          if (!fieldset) return true;
          return !Array.from(fieldset.querySelectorAll('[data-option-value-id]')).some(
            (optionInput) => optionInput.dataset.optionValueId === id && optionInput !== input
          );
        });
        if (!nextSelected.includes(optionValueId)) nextSelected.push(optionValueId);

        const requestUrl = this.buildRequestUrlWithParams(productUrl, nextSelected, false);
        this.prefetchRequest(requestUrl);
      }

      prefetchRequest(requestUrl) {
        if (this.constructor.requestCache.has(requestUrl)) return;

        fetch(requestUrl)
          .then((response) => response.text())
          .then((responseText) => {
            this.storeRequestCache(requestUrl, responseText);
          })
          .catch(() => {});
      }

      storeRequestCache(requestUrl, responseText) {
        const cache = this.constructor.requestCache;
        cache.set(requestUrl, responseText);
        if (cache.size > 12) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
      }

      resetProductFormState() {
        this.productForm?.handleErrorMessage();
      }

      handleSwapProduct(productUrl, updateFullPage) {
        return (html) => {
          this.productModal?.remove();

          const newProductInfo = html.querySelector('product-info');
          if (!newProductInfo) return;

          const variant = this.getSelectedVariant(newProductInfo);
          this.updateURL(productUrl, variant?.id);

          this.preProcessHtmlCallbacks.forEach((callback) => callback(newProductInfo));
          this.replaceWith(newProductInfo);
          this.postProcessHtmlCallbacks.forEach((callback) => callback(newProductInfo));
        };
      }

      renderProductInfo({ requestUrl, targetId, callback }) {
        this.abortController?.abort();
        this.abortController = new AbortController();
        const requestId = ++this.variantRequestId;

        const applyResponse = (responseText) => {
          if (requestId !== this.variantRequestId) return;
          const isMobile = window.matchMedia('(max-width: 749px)').matches;
          const scrollX = window.scrollX;
          const scrollY = window.scrollY;
          this.pendingRequestUrl = null;
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          callback(html);
          if (isMobile) {
            window.scrollTo(scrollX, scrollY);
            requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
          }
        };

        const cached = this.constructor.requestCache.get(requestUrl);
        if (cached) {
          applyResponse(cached);
          return;
        }

        fetch(requestUrl, { signal: this.abortController.signal })
          .then((response) => response.text())
          .then((responseText) => {
            this.storeRequestCache(requestUrl, responseText);
            applyResponse(responseText);
          })
          .catch((error) => {
            if (error.name === 'AbortError') return;
            console.error(error);
          });
      }

      getSelectedVariant(productInfoNode) {
        const selectedVariant = productInfoNode.querySelector('variant-selects [data-selected-variant]')?.innerHTML;
        return !!selectedVariant ? JSON.parse(selectedVariant) : null;
      }

      buildRequestUrlWithParams(url, optionValues, shouldFetchFullPage = false) {
        const params = [];

        !shouldFetchFullPage && params.push(`section_id=${this.sectionId}`);

        if (optionValues.length) {
          params.push(`option_values=${optionValues.join(',')}`);
        }

        return `${url}?${params.join('&')}`;
      }

      updateOptionValues(html) {
        const variantSelects = html.querySelector('variant-selects');
        if (variantSelects && this.variantSelectors) {
          this.variantSelectors.replaceWith(variantSelects);
        }
      }

      handleUpdateProductInfo(productUrl) {
        return (html) => {
          const variant = this.getSelectedVariant(html);

          this.pickupAvailability?.update(variant);
          this.updateOptionValues(html);
          this.updateURL(productUrl, variant?.id);
          this.updateVariantInputs(variant?.id);

          if (!variant) {
            this.setUnavailable();
            return;
          }

          this.updateMedia(html, variant?.featured_media?.id);

          const updateSourceFromDestination = (id, shouldHide = (source) => false) => {
            const source = html.getElementById(`${id}-${this.sectionId}`);
            const destination = this.querySelector(`#${id}-${this.dataset.section}`);
            if (source && destination) {
              destination.innerHTML = source.innerHTML;
              destination.classList.toggle('hidden', shouldHide(source));
            }
          };

          updateSourceFromDestination('price');
          updateSourceFromDestination('Sku', ({ classList }) => classList.contains('hidden'));
          updateSourceFromDestination('Inventory', ({ innerText }) => innerText === '');
          updateSourceFromDestination('Volume');
          updateSourceFromDestination('Price-Per-Item', ({ classList }) => classList.contains('hidden'));

          this.updateQuantityRules(this.sectionId, html);
          this.querySelector(`#Quantity-Rules-${this.dataset.section}`)?.classList.remove('hidden');
          this.querySelector(`#Volume-Note-${this.dataset.section}`)?.classList.remove('hidden');

          const submitButton = html.getElementById(`ProductSubmitButton-${this.sectionId}`);
          this.productForm?.toggleSubmitButton(
            Boolean(submitButton?.hasAttribute('disabled')),
            window.variantStrings.soldOut
          );

          publish(PUB_SUB_EVENTS.variantChange, {
            data: {
              sectionId: this.sectionId,
              html,
              variant,
            },
          });
        };
      }

      updateVariantInputs(variantId) {
        this.querySelectorAll(
          `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
        ).forEach((productForm) => {
          const input = productForm.querySelector('input[name="id"]');
          if (!input) return;
          const nextValue = variantId ? String(variantId) : '';
          if (input.value === nextValue) return;
          input.value = nextValue;
          input.removeAttribute('disabled');
          requestAnimationFrame(() => {
            input.dispatchEvent(new Event('change', { bubbles: true }));
          });
        });
      }

      updateURL(url, variantId) {
        this.querySelector('share-button')?.updateUrl(
          `${window.shopUrl}${url}${variantId ? `?variant=${variantId}` : ''}`
        );

        if (this.dataset.updateUrl === 'false') return;
        window.history.replaceState({}, '', `${url}${variantId ? `?variant=${variantId}` : ''}`);
      }

      setUnavailable() {
        this.productForm?.toggleSubmitButton(true, window.variantStrings.unavailable);

        const selectors = ['price', 'Inventory', 'Sku', 'Price-Per-Item', 'Volume-Note', 'Volume', 'Quantity-Rules']
          .map((id) => `#${id}-${this.dataset.section}`)
          .join(', ');
        document.querySelectorAll(selectors).forEach(({ classList }) => classList.add('hidden'));
      }

      updateMedia(html, variantFeaturedMediaId) {
        if (!variantFeaturedMediaId) return;

        const gallery = this.querySelector('media-gallery');
        const activeMediaId = `${this.dataset.section}-${variantFeaturedMediaId}`;
        const existingMedia = gallery?.querySelector(`[data-media-id="${activeMediaId}"]`);

        if (existingMedia) {
          gallery.setActiveMedia?.(activeMediaId, true);
          return;
        }

        const mediaGallerySource = this.querySelector('media-gallery ul');
        const mediaGalleryDestination = html.querySelector(`media-gallery ul`);

        const refreshSourceData = () => {
          if (this.hasAttribute('data-zoom-on-hover')) enableZoomOnHover(2);
          const mediaGallerySourceItems = Array.from(mediaGallerySource.querySelectorAll('li[data-media-id]'));
          const sourceSet = new Set(mediaGallerySourceItems.map((item) => item.dataset.mediaId));
          const sourceMap = new Map(
            mediaGallerySourceItems.map((item, index) => [item.dataset.mediaId, { item, index }])
          );
          return [mediaGallerySourceItems, sourceSet, sourceMap];
        };

        if (mediaGallerySource && mediaGalleryDestination) {
          let [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();
          const mediaGalleryDestinationItems = Array.from(
            mediaGalleryDestination.querySelectorAll('li[data-media-id]')
          );
          const destinationSet = new Set(mediaGalleryDestinationItems.map(({ dataset }) => dataset.mediaId));
          let shouldRefresh = false;

          // add items from new data not present in DOM
          for (let i = mediaGalleryDestinationItems.length - 1; i >= 0; i--) {
            if (!sourceSet.has(mediaGalleryDestinationItems[i].dataset.mediaId)) {
              mediaGallerySource.prepend(mediaGalleryDestinationItems[i]);
              shouldRefresh = true;
            }
          }

          // remove items from DOM not present in new data
          for (let i = 0; i < mediaGallerySourceItems.length; i++) {
            if (!destinationSet.has(mediaGallerySourceItems[i].dataset.mediaId)) {
              mediaGallerySourceItems[i].remove();
              shouldRefresh = true;
            }
          }

          // refresh
          if (shouldRefresh) [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();

          // if media galleries don't match, sort to match new data order
          mediaGalleryDestinationItems.forEach((destinationItem, destinationIndex) => {
            const sourceData = sourceMap.get(destinationItem.dataset.mediaId);

            if (sourceData && sourceData.index !== destinationIndex) {
              mediaGallerySource.insertBefore(
                sourceData.item,
                mediaGallerySource.querySelector(`li:nth-of-type(${destinationIndex + 1})`)
              );

              // refresh source now that it has been modified
              [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();
            }
          });
        }

        // set featured media as active in the media gallery
        this.querySelector(`media-gallery`)?.setActiveMedia?.(
          `${this.dataset.section}-${variantFeaturedMediaId}`,
          true
        );

        // update media modal
        const modalContent = this.productModal?.querySelector(`.product-media-modal__content`);
        const newModalContent = html.querySelector(`product-modal .product-media-modal__content`);
        if (modalContent && newModalContent) modalContent.innerHTML = newModalContent.innerHTML;
      }

      setQuantityBoundries() {
        const data = {
          cartQuantity: this.quantityInput.dataset.cartQuantity ? parseInt(this.quantityInput.dataset.cartQuantity) : 0,
          min: this.quantityInput.dataset.min ? parseInt(this.quantityInput.dataset.min) : 1,
          max: this.quantityInput.dataset.max ? parseInt(this.quantityInput.dataset.max) : null,
          step: this.quantityInput.step ? parseInt(this.quantityInput.step) : 1,
        };

        let min = data.min;
        const max = data.max === null ? data.max : data.max - data.cartQuantity;
        if (max !== null) min = Math.min(min, max);
        if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

        this.quantityInput.min = min;

        if (max) {
          this.quantityInput.max = max;
        } else {
          this.quantityInput.removeAttribute('max');
        }
        this.quantityInput.value = min;

        publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
      }

      fetchQuantityRules() {
        const currentVariantId = this.productForm?.variantIdInput?.value;
        if (!currentVariantId) return;

        this.querySelector('.quantity__rules-cart .loading__spinner').classList.remove('hidden');
        return fetch(`${this.dataset.url}?variant=${currentVariantId}&section_id=${this.dataset.section}`)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            this.updateQuantityRules(this.dataset.section, html);
          })
          .catch((e) => console.error(e))
          .finally(() => this.querySelector('.quantity__rules-cart .loading__spinner').classList.add('hidden'));
      }

      updateQuantityRules(sectionId, html) {
        if (!this.quantityInput) return;
        this.setQuantityBoundries();

        const quantityFormUpdated = html.getElementById(`Quantity-Form-${sectionId}`);
        const selectors = ['.quantity__input', '.quantity__rules', '.quantity__label'];
        for (let selector of selectors) {
          const current = this.quantityForm.querySelector(selector);
          const updated = quantityFormUpdated.querySelector(selector);
          if (!current || !updated) continue;
          if (selector === '.quantity__input') {
            const attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
            for (let attribute of attributes) {
              const valueUpdated = updated.getAttribute(attribute);
              if (valueUpdated !== null) {
                current.setAttribute(attribute, valueUpdated);
              } else {
                current.removeAttribute(attribute);
              }
            }
          } else {
            current.innerHTML = updated.innerHTML;
            if (selector === '.quantity__label') {
              const updatedAriaLabelledBy = updated.getAttribute('aria-labelledby');
              if (updatedAriaLabelledBy) {
                current.setAttribute('aria-labelledby', updatedAriaLabelledBy);
                // Update the referenced visually hidden element
                const labelId = updatedAriaLabelledBy;
                const currentHiddenLabel = document.getElementById(labelId);
                const updatedHiddenLabel = html.getElementById(labelId);
                if (currentHiddenLabel && updatedHiddenLabel) {
                  currentHiddenLabel.textContent = updatedHiddenLabel.textContent;
                }
              }
            }
          }
        }
      }

      get productForm() {
        return this.querySelector(`product-form`);
      }

      get productModal() {
        return document.querySelector(`#ProductModal-${this.dataset.section}`);
      }

      get pickupAvailability() {
        return this.querySelector(`pickup-availability`);
      }

      get variantSelectors() {
        return this.querySelector('variant-selects');
      }

      get relatedProducts() {
        const relatedProductsSectionId = SectionId.getIdForSection(
          SectionId.parseId(this.sectionId),
          'related-products'
        );
        return document.querySelector(`product-recommendations[data-section-id^="${relatedProductsSectionId}"]`);
      }

      get quickOrderList() {
        const quickOrderListSectionId = SectionId.getIdForSection(
          SectionId.parseId(this.sectionId),
          'quick_order_list'
        );
        return document.querySelector(`quick-order-list[data-id^="${quickOrderListSectionId}"]`);
      }

      get sectionId() {
        return this.dataset.originalSection || this.dataset.section;
      }
    }
  );
}
