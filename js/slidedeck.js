/**
 * A slide deck object
 */
class SlideDeck {
    /**
     * Constructor for the SlideDeck object.
     * @param {NodeList} slides A list of HTML elements containing the slide text.
     * @param {L.map} map The Leaflet map where data will be shown.
     */
    constructor(slides, map) {
      this.slides = slides;
      this.map = map;
  
      this.dataLayer = L.layerGroup().addTo(map);
      this.currentSlideIndex = 0;
      this.coffeeMarker = L.icon({
          iconUrl: 'media/coffeemarker.png',
          iconSize:     [38, 38], // size of the icon
          iconAnchor:   [19, 44], // point of the icon which will correspond to marker's location
          // popupAnchor:  [100,100] // point from which the popup should open relative to the iconAnchor
      });
    }
  
    /**
    * ### updateDataLayer
    *
    * The updateDataLayer function will clear any markers or shapes previously
    * added to the GeoJSON layer on the map, and replace them with the data
    * provided in the `data` argument. The `data` should contain a GeoJSON
    * FeatureCollection object.
    *
    * @param {object} data A GeoJSON FeatureCollection object
    * @return {L.GeoJSONLayer} The new GeoJSON layer that has been added to the
    *                          data layer group.
    */
    updateDataLayer(data) {
      this.dataLayer.clearLayers();
      const geoJsonLayer = L.geoJSON(data, { 
                                            pointToLayer: (p, latlng) => L.marker(latlng, {icon: this.coffeeMarker}) 
                                           })
                                            .bindTooltip((l) => l.feature.properties.label)
                                            .addTo(this.dataLayer);
  
      return geoJsonLayer;
    }
  
    /**
     * ### getSlideFeatureCollection
     *
     * Load the slide's features from a GeoJSON file.
     *
     * @param {HTMLElement} slide The slide's HTML element. The element id should match the key for the slide's GeoJSON file
     * @return {object} The FeatureCollection as loaded from the data file
     */
    async getSlideFeatureCollection(slide) {
      const resp = await fetch(`data/${slide.id}.json`);
      const data = await resp.json();
      return data;
    }
  
    /**
     * ### hideAllSlides
     *
     * Add the hidden class to all slides' HTML elements.
     *
     * @param {NodeList} slides The set of all slide elements, in order.
     */
    hideAllSlides() {
      for (const slide of this.slides) {
        slide.classList.add('hidden');
      }
    }
  
    /**
     * ### syncMapToSlide
     *
     * Go to the slide that mathces the specified ID.
     *
     * @param {HTMLElement} slide The slide's HTML element
     */
    async syncMapToSlide(slide) {
      const collection = await this.getSlideFeatureCollection(slide);
      const layer = this.updateDataLayer(collection);
  
      /**
       * Create a temporary event handler that will show tooltips on the map
       * features, after the map is done "flying" to contain the data layer.
       */
      const handleFlyEnd = () => {
        if (slide.showpopups) {
          layer.eachLayer((l) => {
            l.bindTooltip(l.feature.properties.label, { permanent: true });
            l.openTooltip();
          });
        }
        this.map.removeEventListener('moveend', handleFlyEnd);
      };
  
      this.map.addEventListener('moveend', handleFlyEnd);
      if (collection.bounds) {
        this.map.flyToBounds(collection.bounds);
      } else {
        this.map.flyToBounds(layer.getBounds());
      }
    }
  
    /**
     * Show the slide with ID matched by currentSlideIndex. If currentSlideIndex is
     * null, then show the first slide.
     */
    syncMapToCurrentSlide() {
      const slide = this.slides[this.currentSlideIndex];
      this.syncMapToSlide(slide);
    }
  
    /**
     * Increment the currentSlideIndex and show the corresponding slide. If the
     * current slide is the final slide, then the next is the first.
     */
    goNextSlide() {
      this.currentSlideIndex++;
  
      if (this.currentSlideIndex === this.slides.length) {
        this.currentSlideIndex = 0;
      }
  
      this.syncMapToCurrentSlide();
    }
  
    /**
     * Decrement the currentSlideIndes and show the corresponding slide. If the
     * current slide is the first slide, then the previous is the final.
     */
    goPrevSlide() {
      this.currentSlideIndex--;
  
      if (this.currentSlideIndex < 0) {
        this.currentSlideIndex = this.slides.length - 1;
      }
  
      this.syncMapToCurrentSlide();
    }
  
    /**
     * ### preloadFeatureCollections
     *
     * Initiate a fetch on all slide data so that the browser can cache the
     * requests. This way, when a specific slide is loaded it has a better chance
     * of loading quickly.
     */
    preloadFeatureCollections() {
      for (const slide of this.slides) {
        this.getSlideFeatureCollection(slide);
      }
    }
  
    /**
     * Calculate the current slide index based on the current scroll position.
     */
    calcCurrentSlideIndex() {
      const scrollPos = window.scrollY;
      const windowHeight = window.innerHeight;
  
      let i;
      for (i = 0; i < this.slides.length; i++) {
        const slidePos = this.slides[i].offsetTop - scrollPos + (windowHeight * 2.7);
        if (slidePos >= 0) {
          break;
        }
      }
  
      if (i !== this.currentSlideIndex) {
        this.currentSlideIndex = i;
        this.syncMapToCurrentSlide();
      }
    }
  }
  
  export {
    SlideDeck,
  };
  