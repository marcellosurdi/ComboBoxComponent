/**
 * @module js/combobox
 * @author Marcello Surdi
 * 
 * @desc Source code
 */

/**
 * @class
 * 
 * @classdesc
 * Create a new ComboBox instance for the text field selected by `id` parameter.
 * 
 * @param {string} id Text field id value
 * @param {ComboBoxOptions} [options] {@linkcode module:js/combobox.ComboBoxOptionsNS|ComboBoxOptions} configuration object
 */
export function ComboBox( id, options = {} ) {
  const input = document.querySelector( `input#${ id }[type="text"]` );
  if( input === null ) {
    console.error( "Please provide a text field valid id ('type' html attribute must be set to 'text')" );
    return;
  }

  // Wrap input into a div container with relative positioning
  const div_container = document.createElement( 'DIV' );
  div_container.style.position = 'relative';
  input.parentElement.insertBefore( div_container, input );
  div_container.appendChild( input );

  this.input = input;
  this.controller = undefined;

  this.items = options.items || [];
  this.onSelect = options.onSelect || null;
  this.onFilter = options.onFilter || null;
  this.onFetch = options.onFetch || null;
  this.endpoint = options.endpoint || '';
  this.highlight_color = options.highlight_color || '';

  input.insertAdjacentHTML( 'beforebegin', `<input type="hidden" id="${ input.id }-hinput" name="${ input.id }-hinput" value data-item-name>` );
  input.insertAdjacentHTML( 'afterend', `<div id="${ input.id }-div" class="combobox" style="display: none;"></div>`);

  // Hidden input that will contain selected item id and name
  this.hinput = input.previousElementSibling;
  // Div element that will contain the list
  this.div = input.nextElementSibling;
  // Set custom highlight background color if any
  if( this.highlight_color ) {
    this.div.insertAdjacentHTML( 
      'afterend', 
      `<style>div#${ input.id }-div li.highlighted { background: ${ this.highlight_color }; }</style>`
    );
  }

  input.addEventListener( 'focus', () => { this.onFocus() } );
  input.addEventListener( 'keydown', ( e ) => { this.onKeyDown( e ) } );
  input.addEventListener( 'keyup', ( e ) => { this.onKeyUp( e ) } );
  input.addEventListener( 'blur', ( e ) => { this.onBlur( e ) } );
}





/**
 * Configuration option parameter
 * @namespace ComboBoxOptionsNS
 * @memberof module:js/combobox
 */

/**
 * @typedef {object} ComboBoxOptions
 * @memberof module:js/combobox.ComboBoxOptionsNS
 *
 * @property {array} items Default list items
 * @property {function} onSelect Callback to execute when user select an item from the list
 * @property {function} onFilter Callback to execute when the list is created/updated
 * @property {function} onFetch Callback to execute to transform items retrieved from remote endpoint
 * @property {string} endpoint Remote endpoint
 * @property {string} highlight_color Background color for highlighted items (any CSS value)
 */





/**
 * Prototype for ComboBox instances.
 * @namespace ComboBoxBase
 */
const ComboBoxBase = {
  constructor: ComboBox,

 	/**
	 * Open the list.
   * 
   * @see {@linkcode module:js/combobox~ComboBoxBase.update|update}
	 */
  onFocus: function() {
    if( this.div.style.display == 'none' ) this.update();
  },





	/**
	 * Process `Enter`, `Escape`, `ArrowUp` and `ArrowDown` keys when keydown events are fired.
	 *
	 * @param {KeyboardEvent} e
   * 
   * @see {@linkcode module:js/combobox~ComboBoxBase.standardizeKey|standardizeKey}
	 */
	onKeyDown: function( e ) {
    const k = this.standardizeKey( e );

		const input = this.input;
    const div = this.div;
    const current_li = div.querySelector( 'li.highlighted' );
    // `current_li` element isn't available because `this.div` may not be initialized yet
    if( !current_li ) return;

    
    if( k === 'Enter' || k === 'Escape' ) {
      e.preventDefault();

      if( k === 'Enter' ) this.select( current_li );
      input.blur();
    }
    else if( k === 'ArrowDown' || k === 'ArrowUp' ) {
      let new_li = ( k === 'ArrowDown' ) ? current_li.nextElementSibling : current_li.previousElementSibling;
      
      // If there's a next item or a previous item
      if( new_li ) {
        const ul = div.firstElementChild;

        this.highlight( current_li, new_li );

        if( ( new_li.offsetTop + new_li.offsetHeight ) > ( ul.scrollTop + div.offsetHeight ) ) {
          ul.scrollTop = new_li.offsetTop - ( div.offsetHeight - new_li.offsetHeight );
        }
        else if( new_li.offsetTop < ul.scrollTop ) {
          ul.scrollTop = new_li.offsetTop;
        }
      }
    }
	},





	/**
	 * Update the list according to user input, if `this.endpoint` configuration option exists try to fetch `this.items` from a remote endpoint 
   * and then update the list.
	 *
	 * @param {KeyboardEvent} e
   * 
   * @see {@linkcode module:js/combobox~ComboBoxBase.standardizeKey|standardizeKey}
   * @see {@linkcode module:js/combobox~ComboBoxBase.update|update}
	 */
  onKeyUp: function ( e ) {
    const k = this.standardizeKey( e );

    // `Enter`, `Escape`, `ArrowUp` and `ArrowDown` keys are processed only when keydown events are fired
    if( k === 'Enter' || k === 'Escape' || k === 'ArrowDown' || k === 'ArrowUp'  ) return;

    if( this.endpoint ) {
      const str = this.input.value;

      if( str.length >= 3 ) {

        let signal;

        if( this.controller !== undefined ) {
          this.controller.abort();
        }

        if( 'AbortController' in window ) {
          this.controller = new AbortController;
          signal = this.controller.signal;
        }

        fetch( this.endpoint + str, { signal } )
          .then( r => r.json() )
          .then( json => {
            this.items = this.onFetch ? this.onFetch( json ) : json;
            this.update();
          } )
          .catch( e => {
            if( e.name === 'AbortError' ) {
              console.log( `Uneccessary fetch aborted for '${ str }' string` );
            }
            console.warn( e );
          } );

      }
    }
		else {
			this.update();
		}
  },





 	/**
	 * Handle blur events.
	 *
	 * @param {FocusEvent} e
   * 
   * @see {@linkcode module:js/combobox~ComboBoxBase.onClick|onClick}
	 */
   onBlur: function ( e ) {
    // https://stackoverflow.com/questions/39439115/how-to-execute-click-function-before-the-blur-function/57983847#57983847
    const rt = e.relatedTarget;

    // User wants to use the scroll bar on desktop devices or clicked on an item on iOS devices
    if( rt === this.div.firstElementChild )  return;

    if( rt !== this.input ) {
      this.onClick( rt );
    }
  },





 	/**
	 * Close the list and select current item if any.
	 *
	 * @param {HTMLElement} el `relatedTarget` property for blur events or `target` property for click events
   * 
   * @see {@linkcode module:js/combobox~ComboBoxBase.highlight|highlight}
   * @see {@linkcode module:js/combobox~ComboBoxBase.select|select}
	 */
  onClick: function ( el ) {
    // Close list
    this.div.style.display = 'none';
    // Restore the text field value if the user cleared it (even partially) without making a new selection
    this.input.value = this.hinput.dataset.itemName;

    // `e.relatedTarget` on blur event may be `null`
    if( !el ) return;

    // The user clicked on a child `<span>` of `<button>`
    if( el.parentElement.classList.contains( 'combobox-button' ) ) el = el.parentElement;

    if( el.classList.contains( 'combobox-button' ) ) {
      const previous_li = this.div.querySelector( 'li.highlighted' );
      const current_li = el.parentElement;
      this.highlight( previous_li, current_li );
      this.select( current_li );
    }
  },





	/**
	 * Create/update the list from `this.items` and show it (this method is executed whenever the text field receives the 
   * focus or user types some text). Execute `this.onFilter` if any.
   * 
   * @see {@linkcode module:js/combobox~ComboBoxBase.highlight|highlight}
   * @see {@linkcode module:js/combobox~ComboBoxBase.onClick|onClick}
   * @see {@linkcode module:js/combobox~ComboBoxBase.scrollPage|scrollPage}
	 */
  update: function() {
    const items = this.items;
    // Return if `this.items` are less than 0
    if( items.length === 0 ) return;
    
    // String typed by user
    const str = this.input.value;
    const div = this.div;

    // Previously selected id
    let sid = this.hinput.value;
    // Found id while typing
    let fid = undefined;
    
    // https://stackoverflow.com/questions/9152096/make-an-html-element-non-focusable
    let html = '<ul tabindex="-1">';
    for( const item of items ) {
      if( this.onFilter && !this.onFilter( item ) ) continue;

      let { id, name, descr, icon } = item;

      // There isn't previous selection so consider first item
      if( sid === '' ) {
        sid = id;
      }

      let rname = name;
			if( str.length >= 3 ) {
				// String.indexOf is case-sensitive
				let pos = name.toLowerCase().indexOf( str.toLowerCase() );

				// String typed by the user matches a list item
        if( pos !== -1 ) {
          rname = name.replace( new RegExp( `${ str }`, 'i' ), `<strong>${ str }</strong>` );
          // Consider first occurrence only
          if( !fid ) {
            fid = id;
          }
        }
			}

			html += `<li class="${ 'item' + id }">`;
      html +=   `<button type="button" class="combobox-button" data-item-id="${ id }" data-item-name="${ name }" data-item-descr="${ descr }" tabindex="-1">`;
			html += 	  `<span class="item-name">${ rname }</span>`;
			html += 	  `<span class="item-desc">${ descr }</span>`;
      if( icon ) {
        html += 	`<span class="icon-${ icon }"></span>`;
      }
      html +=   '</button>';
			html += '</li>';
		}
		html += '</ul>';

		div.innerHTML = html;
		div.style.display = 'block';

    // Highligth the first found item while typing, if any, or previously selected one
    const current_id = fid || sid;
    const current_li = div.querySelector( 'li.item' + current_id );
    current_li.classList.add( 'highlighted' );

    const ul = div.firstElementChild;
    // Show highlighted item first in the list
    ul.scrollTop = current_li.offsetTop;

    ul.onmousemove = ( e ) => {
      const previous_li = div.querySelector( 'li.highlighted' );
      const current_li = e.target.closest( 'li' );
      // `current_li` variable may not exist if mouse goes out from the window
      if( current_li && previous_li !== current_li ) {
        this.highlight( previous_li, current_li );
      }
    };

    // Allow the user to use the scrollbar on desktop devices without losing focus in the text field
    ul.onscroll = () => setTimeout( () => this.input.focus(), 0 );

    // Allow the user to select item on iOS devices
    ul.onclick = ( e ) => this.onClick.call( this, e.target );

    this.scrollPage( div );
  },





 	/**
   * Remove `highlighted` class in the previous `li` item and add it in the current one (when user hovers the mouse over an item, or click on 
   * it, or uses the arrow up or arrow down keys on the keyboard).
	 *
	 * @param {HTMLLIElement} previous_li
	 * @param {HTMLLIElement} current_li
	 */
  highlight: function( previous_li, current_li ) {
    previous_li.classList.remove( 'highlighted' );
    current_li.classList.add( 'highlighted' );
  },





 	/**
	 * Select an item and execute `this.onSelect` if any.
	 *
	 * @param {HTMLLIElement} li
	 */
  select: function( li ) {
    const btn = li.querySelector( 'button' );
    this.hinput.value = btn.dataset.itemId;
    this.input.value = this.hinput.dataset.itemName = btn.dataset.itemName;

    if( this.onSelect ) this.onSelect( li );
  },





	/**
	 * Standardize event.key Edge values.
	 *
	 * @param {KeyboardEvent} e
	 * @return {string} The value of the key pressed by the user
	 */
  standardizeKey: function( e ) {
    let k = e.key;

    switch( k ) {
      case 'Up': k = 'ArrowUp'; break;
      case 'Down': k = 'ArrowDown'; break;
      case 'Esc': k = 'Escape'; break;
    }

    return k;
  },





  /**
   * Scroll the page if the div exceeds the viewport height.
   *
   * @param {HTMLDivElement} div Div element containing the list
   */
  scrollPage: function( div ) {
    const rect = div.getBoundingClientRect();
    const diff = ( rect.top + div.offsetHeight ) - document.documentElement.clientHeight

    if( diff > 0 ) {
      // Check if scroll behavior is supported
      if( 'scrollBehavior' in document.documentElement.style ) {
        window.scrollBy( {
          top: diff,
          left: 0,
          behavior: 'smooth'
        } );
      } else {
        window.scrollBy( 0, diff );
      }
    }
  },
}

ComboBox.prototype = ComboBoxBase;