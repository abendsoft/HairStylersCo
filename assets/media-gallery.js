if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');
        if (!this.elements.thumbnails) return;

        this.elements.viewer.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 500));
        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
          mediaToSwitch
            .querySelector('button')
            .addEventListener('click', this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
        });
        if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) this.removeListSemantic();
      }

      onSlideChanged(event) {
        const thumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${event.detail.currentElement.dataset.mediaId}"]`
        );
        this.setActiveThumbnail(thumbnail);
      }

      setActiveMedia(mediaId, prepend) {
        const activeMedia =
          this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('[data-media-id]');
        if (!activeMedia) {
          return;
        }

        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        this.elements.viewer.querySelectorAll('[data-media-id]').forEach((element) => {
          element.classList.remove('is-active');
        });
        activeMedia.classList.add('is-active');
        this.ensureMediaImagesLoaded(activeMedia);

        if (prepend) {
          if (activeMedia.parentElement.firstChild !== activeMedia) {
            activeMedia.parentElement.prepend(activeMedia);
          }

          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
            if (activeThumbnail && activeThumbnail.parentElement.firstChild !== activeThumbnail) {
              activeThumbnail.parentElement.prepend(activeThumbnail);
            }
          }

          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        if (this.mql.matches) this.preventStickyHeader();

        const syncSlidePosition = () => {
          if (!this.mql.matches || this.elements.thumbnails) {
            activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
          }
          if (!this.mql.matches) {
            window.scrollTo(scrollX, scrollY);
          }
        };

        syncSlidePosition();
        requestAnimationFrame(syncSlidePosition);
        this.playActiveMedia(activeMedia);

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
        if (!activeThumbnail) return;
        this.setActiveThumbnail(activeThumbnail);
        this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
      }

      ensureMediaImagesLoaded(activeMedia) {
        activeMedia.querySelectorAll('img').forEach((img) => {
          if (img.getAttribute('loading') === 'lazy') {
            img.loading = 'eager';
            img.setAttribute('fetchpriority', 'high');
          }

          // Force browsers to start fetching lazy/offscreen images immediately.
          if (!img.complete) {
            const src = img.currentSrc || img.getAttribute('src');
            if (src) {
              const preloader = new Image();
              if (img.sizes) preloader.sizes = img.sizes;
              if (img.srcset) preloader.srcset = img.srcset;
              preloader.src = src;
            }
          }

          const spinner = activeMedia.querySelector('.loading__spinner');
          if (spinner && !img.complete) {
            spinner.classList.remove('hidden');
            const hideSpinner = () => spinner.classList.add('hidden');
            img.addEventListener('load', hideSpinner, { once: true });
            img.addEventListener('error', hideSpinner, { once: true });
          }
        });
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        thumbnail.querySelector('button').setAttribute('aria-current', true);
        if (this.elements.thumbnails.isSlideVisible(thumbnail, 10)) return;

        this.elements.thumbnails.slider.scrollTo({ left: thumbnail.offsetLeft });
      }

      announceLiveRegion(activeItem, position) {
        if (!this.elements.liveRegion || !window.accessibilityStrings?.imageAvailable) return;
        this.elements.liveRegion.setAttribute('aria-hidden', false);
        this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace('[index]', position);
        setTimeout(() => {
          this.elements.liveRegion.setAttribute('aria-hidden', true);
        }, 2000);
      }

      playActiveMedia(activeItem) {
        this.querySelectorAll('video, product-model').forEach((media) => {
          if (media.tagName === 'VIDEO') media.pause();
          if (media.modelViewerUI) media.modelViewerUI.pause();
        });
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute('role', 'presentation'));
      }
    }
  );
}
