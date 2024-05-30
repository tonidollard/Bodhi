class ProductImageSlider extends MenuDrawer {
    constructor() {
        super();
        this.lightroom;
        this.currentIndex = 0;
        this.lightroomInit = false;
        this.sliderOptions = {
            slides: {
                perView: "auto",
                spacing: 0,
            },
        }

        this.thumbOptions = {
            slides: {
                perView: 6,
                spacing: 20,
            },
            breakpoints: {
                "(max-width: 749px)": {
                    slides: {
                        perView: 6,
                        spacing: 10,
                    },
                },
            },
        }
        
        document.querySelector('.product-image-slider').addEventListener("mouseenter", this.onLightRoom.bind(this));

        this.onInit();

    }

    onInit() {
        var main = this;
        this.slider = new KeenSlider(".product-image-slider", this.sliderOptions);

        this.thumbnails = new KeenSlider(
            ".product-image-thumbs",
            this.thumbOptions,
            [this.onThumbnailPlugin(this.slider)]
        );       

        document.querySelector('.product-image-slider').addEventListener('lgAfterSlide', function(event) {
            main.currentIndex = event.detail.index;
        });

        document.querySelector('.product-image-slider').addEventListener('lgBeforeClose', function(event) {
            main.slider.moveToIdx( main.currentIndex, false, { duration: 0 });
            main.thumbnails.moveToIdx( main.currentIndex, false, { duration: 0 });
        });
    }
  
   
  
    onLightRoomInit() {
             this.lightroom = lightGallery( document.querySelector('.product-image-slider'), {
                plugins: [lgZoom, lgThumbnail],
                thumbnail: true, 
                preload: 1,
                getCaptionFromTitleOrAlt: false,
                download: false,
                licenseKey: 'C096F77D-92294C64-9C2C7CFD-FF6E4A4F',
                mobileSettings: {
                  controls: true,
                },
            });
            this.lightroomInit = true;
    }

    onLightRoomOpen() {
		this.lightroom.openGallery();
    }
  
 	onLightRoom() {
       if(!this.lightroomInit) {
		this.onLightRoomInit();
       }
    }
  
    onDestroy() {
        var main = this;
        this.currentIndex = 0;
        this.slider.destroy();
        this.thumbnails.destroy();

        document.querySelector('.product-image-slider').removeEventListener('lgAfterSlide', function(event) {
            main.currentIndex = event.detail.index;
        });
        document.querySelector('.product-image-slider').removeEventListener('lgBeforeClose', function(event) {
            main.slider.moveToIdx( main.currentIndex, false, { duration: 0 });
            main.thumbnails.moveToIdx( main.currentIndex, false, { duration: 0 });
        });
    }

    onUpdate() {
        this.onDestroy();
        this.onInit();
        this.slider.moveToIdx(0, false, { duration: 0 });
        this.thumbnails.moveToIdx(0, false, { duration: 0 });
      	this.lightroom.refresh();
    }

    onThumbnailPlugin(main) {
        return (slider) => {
            function removeActive() {
                slider.slides.forEach((slide) => {
                    slide.classList.remove("active")
                })
            }
            function addActive(idx) {
                slider.slides[idx].classList.add("active")
            }

            function addClickEvents() {
                slider.slides.forEach((slide, idx) => {
                    slide.addEventListener("click", () => {
                        main.moveToIdx(idx)
                    })
                })
            }

            slider.on("created", () => {
                addActive(slider.track.details.rel)
                addClickEvents()
                main.on("animationStarted", (main) => {
                    removeActive()
                    const next = main.animator.targetIdx || 0
                    addActive(main.track.absToRel(next))
                    slider.moveToIdx(next)
                })
            })
        }
    }

}

customElements.define('product-image-slider', ProductImageSlider);