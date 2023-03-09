/**
 * Create a new ComboBox instance for the text field parameter (`input`).
 * 
 * @class
 * @param {HTMLInputElement} input Text field DOM object
 * @param {object|string} items Default items to show in a list
 * @param {options} [options] Configuration object
 */
export default function ComboBox( input, items, options = { onFilter: null, onSelect: null, endpoint: '', hbg: '' } ) {
	this.items = items;

  input.parentElement.style.position = 'relative';
  input.insertAdjacentHTML( 'beforebegin', `<input type="hidden" id="${ input.id }-hinput" name="${ input.id }-hinput" data-item-name value>` );
  input.insertAdjacentHTML( 'afterend', `<div id="${ input.id }-div" class="combobox"></div>`);

  // Hidden input that will contain selected item id and name
  this.hinput = input.previousElementSibling;
	this.input = input;
  // Div element that will contain the list
  this.div = input.nextElementSibling;
  // Custom highlighted background
  if( options.hbg ) {
    this.div.insertAdjacentHTML( 'afterend', 
      `<style>
        div#${ input.id }-div li.highlighted { background: ${ options.hbg }; }
        div#${ input.id }-div li:not(.highlighted):hover { background: ${ options.hbg }; }
      </style>`
    );
  }

  input.addEventListener( 'focus', () => { this.onFocus() } );
  input.addEventListener( 'keydown', ( e ) => { this.onKey( e ) } );
  input.addEventListener( 'keyup', ( e ) => { this.onKey( e ) } );
  input.addEventListener( 'blur', ( e ) => { this.onBlur( e ) } );

  if( options.onSelect ) this.onSelect = options.onSelect;
  if( options.onFilter ) this.onFilter = options.onFilter;
  if( options.endpoint ) this.endpoint = options.endpoint;
}

/**
 * Prototype for ComboBox instances.
 */
const ComboBoxBase = {
  constructor: ComboBox,

 	/**
	 * Focus event simply opens list if `this.items` are more than 0.
	 */
  onFocus: function() { 
    if( this.items.length > 0 ) this.open();
  },

	/**
	 * Keyboard events update the list.
	 *
	 * @param {KeyboardEvent} e
	 */
  onKey: function ( e ) {
    const str = this.processKeyboardEvents( e );

    if( this.endpoint && e.type === 'keyup' ) {

    }
		else if( str !== undefined ) {
			this.open( str );
		}
  },

	/**
	 * Create the list and show it in the div, this method is executed whenever the text field receives the focus or user types something.
   * Execute `this.onFilter` if any.
	 *
	 * @param {string} [str = ''] String typed by user
	 */
  open: function( str = '' ) {
    const items = this.items;
    const div = this.div;

    // Previously selected id
    let sid = this.hinput.value;
    // Found id while typing
    let fid = undefined;
    
    // https://stackoverflow.com/questions/9152096/make-an-html-element-non-focusable
    let html = '<ul tabindex="-1">';
    for( const item of items ) {
      if( this.onFilter && !this.onFilter( item ) ) continue;

      let { id, name, descr } = item;

      // There isn't previous selection so considers first item
      if( sid === '' ) {
        sid = id;
      }

			if( str !== '' && str.length >= 3 ) {
				// String.indexOf is case-sensitive
				let pos = name.toLowerCase().indexOf( str.toLowerCase() );

				// String typed by the user matches a list item
        if( pos !== -1 ) {
          name = name.substring( 0, pos ) + '<strong>' + name.substring( pos, str.length ) + '</strong>' + name.substring( ( pos + str.length ), name.length );
          
          if( !fid ) {
            fid = id;
          }
        }
			}

			html += `<li class="${ 'item' + id }">`;
      html +=   `<button type="button" class="combobox-button" data-item-id="${ id }" data-item-name="${ name }" data-item-descr="${ descr }" tabindex="-1">`;
			html += 	  `<span class="item-name">${ name }</span>`;
			html += 	  `<span class="item-desc">${ descr }</span>`;
      html +=   '</button>';
			html += '</li>';
		}
		html += '</ul>';

		div.innerHTML = html;
		div.style.display = 'block';

    // Highligth the found item while typing, if any, instead of previously selected one
    const current_id = fid || sid;
    const current_li = div.querySelector( 'li.item' + current_id );
    current_li.classList.add( 'highlighted' );

    // Show highlighted item first in the list
    div.firstElementChild.scrollTop = current_li.offsetTop;

    this.scrollPage( div );
  },

 	/**
	 * Remove `highlighted` class in the previous `li` item and add it in the current one.
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
    const txt = btn.querySelector( 'span.item-name' ).textContent;
    this.hinput.value = btn.dataset.itemId;
    this.input.value = this.hinput.dataset.itemName = txt;

    if( this.onSelect ) this.onSelect( li );
  },

 	/**
	 * Blur event closes list.
	 *
	 * @param {FocusEvent} e
	 */
  onBlur: function ( e ) {
    // https://stackoverflow.com/questions/39439115/how-to-execute-click-function-before-the-blur-function/57983847#57983847
    const rt = e.relatedTarget;

    if( rt !== this.input ) {
      // Close list
      this.div.style.display = 'none';

      // If the user clicked on a `li > button`
      if( rt && rt.classList.contains( 'combobox-button' ) ) {
        const previous_li = this.div.querySelector( 'li.highlighted' );
        const current_li = rt.parentElement;
        this.highlight( previous_li, current_li );
        this.select( current_li );
      }

      // Restore the text field value if the user cleared it (even partially) without making a new selection
      this.input.value = this.hinput.dataset.itemName;
    }
  },

	/**
	 * Method executed whenever the user types something on the text field.
	 *
	 * @param {KeyboardEvent} e
	 * @return undefined|string
	 */
	processKeyboardEvents: function( e ) {
		const input = this.input;
    const div = this.div;
    const current_li = div.querySelector( 'li.highlighted' );
    const k = standardizeKey( e );
    
		if( e.type === 'keydown' ) {
      if( k === 'Enter' || k === 'Escape' ) {
        e.preventDefault();
        
        if( k === 'Enter' ) { this.select( current_li ); }
        input.blur();
			}
		}
    else {
      if( k === 'ArrowDown' || k === 'ArrowUp' ) {
				let new_li = ( k === 'ArrowDown' ) ? current_li.nextElementSibling : current_li.previousElementSibling;

        // If there's a next item or a previous item
				if( new_li ) {
          const ul = div.firstElementChild;

					this.highlight( current_li, new_li );

					if( k == 'ArrowDown' && ( ( new_li.offsetTop + new_li.offsetHeight ) > ( ul.scrollTop + div.offsetHeight ) ) ) {
						ul.scrollTop = new_li.offsetTop - ( div.offsetHeight - new_li.offsetHeight );
					}
          else if( k == 'ArrowUp' && new_li.offsetTop < ul.scrollTop ) {
						ul.scrollTop = new_li.offsetTop;
					}
				}
			}
			// If the user types any other key, returns the text field value
			else {
				return input.value;
			}
		}

    // Standardize event.key IE/Edge values
		function standardizeKey( e ) {
			let k = e.key;

			switch( k ) {
				case 'Up': k = 'ArrowUp'; break;
				case 'Down': k = 'ArrowDown'; break;
				case 'Esc': k = 'Escape'; break;
			}

			return k;
		}
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