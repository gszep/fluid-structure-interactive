"use strict";
(self["webpackChunkwebgpu_collab_stringed_entities"] = self["webpackChunkwebgpu_collab_stringed_entities"] || []).push([["index"],{

/***/ "./node_modules/lil-gui/dist/lil-gui.esm.js":
/*!**************************************************!*\
  !*** ./node_modules/lil-gui/dist/lil-gui.esm.js ***!
  \**************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BooleanController: () => (/* binding */ BooleanController),
/* harmony export */   ColorController: () => (/* binding */ ColorController),
/* harmony export */   Controller: () => (/* binding */ Controller),
/* harmony export */   FunctionController: () => (/* binding */ FunctionController),
/* harmony export */   GUI: () => (/* binding */ GUI),
/* harmony export */   NumberController: () => (/* binding */ NumberController),
/* harmony export */   OptionController: () => (/* binding */ OptionController),
/* harmony export */   StringController: () => (/* binding */ StringController),
/* harmony export */   "default": () => (/* binding */ GUI)
/* harmony export */ });
/**
 * lil-gui
 * https://lil-gui.georgealways.com
 * @version 0.20.0
 * @author George Michael Brower
 * @license MIT
 */

/**
 * Base class for all controllers.
 */
class Controller {

	constructor( parent, object, property, className, elementType = 'div' ) {

		/**
		 * The GUI that contains this controller.
		 * @type {GUI}
		 */
		this.parent = parent;

		/**
		 * The object this controller will modify.
		 * @type {object}
		 */
		this.object = object;

		/**
		 * The name of the property to control.
		 * @type {string}
		 */
		this.property = property;

		/**
		 * Used to determine if the controller is disabled.
		 * Use `controller.disable( true|false )` to modify this value.
		 * @type {boolean}
		 */
		this._disabled = false;

		/**
		 * Used to determine if the Controller is hidden.
		 * Use `controller.show()` or `controller.hide()` to change this.
		 * @type {boolean}
		 */
		this._hidden = false;

		/**
		 * The value of `object[ property ]` when the controller was created.
		 * @type {any}
		 */
		this.initialValue = this.getValue();

		/**
		 * The outermost container DOM element for this controller.
		 * @type {HTMLElement}
		 */
		this.domElement = document.createElement( elementType );
		this.domElement.classList.add( 'controller' );
		this.domElement.classList.add( className );

		/**
		 * The DOM element that contains the controller's name.
		 * @type {HTMLElement}
		 */
		this.$name = document.createElement( 'div' );
		this.$name.classList.add( 'name' );

		Controller.nextNameID = Controller.nextNameID || 0;
		this.$name.id = `lil-gui-name-${++Controller.nextNameID}`;

		/**
		 * The DOM element that contains the controller's "widget" (which differs by controller type).
		 * @type {HTMLElement}
		 */
		this.$widget = document.createElement( 'div' );
		this.$widget.classList.add( 'widget' );

		/**
		 * The DOM element that receives the disabled attribute when using disable().
		 * @type {HTMLElement}
		 */
		this.$disable = this.$widget;

		this.domElement.appendChild( this.$name );
		this.domElement.appendChild( this.$widget );

		// Don't fire global key events while typing in a controller
		this.domElement.addEventListener( 'keydown', e => e.stopPropagation() );
		this.domElement.addEventListener( 'keyup', e => e.stopPropagation() );

		this.parent.children.push( this );
		this.parent.controllers.push( this );

		this.parent.$children.appendChild( this.domElement );

		this._listenCallback = this._listenCallback.bind( this );

		this.name( property );

	}

	/**
	 * Sets the name of the controller and its label in the GUI.
	 * @param {string} name
	 * @returns {this}
	 */
	name( name ) {
		/**
		 * The controller's name. Use `controller.name( 'Name' )` to modify this value.
		 * @type {string}
		 */
		this._name = name;
		this.$name.textContent = name;
		return this;
	}

	/**
	 * Pass a function to be called whenever the value is modified by this controller.
	 * The function receives the new value as its first parameter. The value of `this` will be the
	 * controller.
	 *
	 * For function controllers, the `onChange` callback will be fired on click, after the function
	 * executes.
	 * @param {Function} callback
	 * @returns {this}
	 * @example
	 * const controller = gui.add( object, 'property' );
	 *
	 * controller.onChange( function( v ) {
	 * 	console.log( 'The value is now ' + v );
	 * 	console.assert( this === controller );
	 * } );
	 */
	onChange( callback ) {
		/**
		 * Used to access the function bound to `onChange` events. Don't modify this value directly.
		 * Use the `controller.onChange( callback )` method instead.
		 * @type {Function}
		 */
		this._onChange = callback;
		return this;
	}

	/**
	 * Calls the onChange methods of this controller and its parent GUI.
	 * @protected
	 */
	_callOnChange() {

		this.parent._callOnChange( this );

		if ( this._onChange !== undefined ) {
			this._onChange.call( this, this.getValue() );
		}

		this._changed = true;

	}

	/**
	 * Pass a function to be called after this controller has been modified and loses focus.
	 * @param {Function} callback
	 * @returns {this}
	 * @example
	 * const controller = gui.add( object, 'property' );
	 *
	 * controller.onFinishChange( function( v ) {
	 * 	console.log( 'Changes complete: ' + v );
	 * 	console.assert( this === controller );
	 * } );
	 */
	onFinishChange( callback ) {
		/**
		 * Used to access the function bound to `onFinishChange` events. Don't modify this value
		 * directly. Use the `controller.onFinishChange( callback )` method instead.
		 * @type {Function}
		 */
		this._onFinishChange = callback;
		return this;
	}

	/**
	 * Should be called by Controller when its widgets lose focus.
	 * @protected
	 */
	_callOnFinishChange() {

		if ( this._changed ) {

			this.parent._callOnFinishChange( this );

			if ( this._onFinishChange !== undefined ) {
				this._onFinishChange.call( this, this.getValue() );
			}

		}

		this._changed = false;

	}

	/**
	 * Sets the controller back to its initial value.
	 * @returns {this}
	 */
	reset() {
		this.setValue( this.initialValue );
		this._callOnFinishChange();
		return this;
	}

	/**
	 * Enables this controller.
	 * @param {boolean} enabled
	 * @returns {this}
	 * @example
	 * controller.enable();
	 * controller.enable( false ); // disable
	 * controller.enable( controller._disabled ); // toggle
	 */
	enable( enabled = true ) {
		return this.disable( !enabled );
	}

	/**
	 * Disables this controller.
	 * @param {boolean} disabled
	 * @returns {this}
	 * @example
	 * controller.disable();
	 * controller.disable( false ); // enable
	 * controller.disable( !controller._disabled ); // toggle
	 */
	disable( disabled = true ) {

		if ( disabled === this._disabled ) return this;

		this._disabled = disabled;

		this.domElement.classList.toggle( 'disabled', disabled );
		this.$disable.toggleAttribute( 'disabled', disabled );

		return this;

	}

	/**
	 * Shows the Controller after it's been hidden.
	 * @param {boolean} show
	 * @returns {this}
	 * @example
	 * controller.show();
	 * controller.show( false ); // hide
	 * controller.show( controller._hidden ); // toggle
	 */
	show( show = true ) {

		this._hidden = !show;

		this.domElement.style.display = this._hidden ? 'none' : '';

		return this;

	}

	/**
	 * Hides the Controller.
	 * @returns {this}
	 */
	hide() {
		return this.show( false );
	}

	/**
	 * Changes this controller into a dropdown of options.
	 *
	 * Calling this method on an option controller will simply update the options. However, if this
	 * controller was not already an option controller, old references to this controller are
	 * destroyed, and a new controller is added to the end of the GUI.
	 * @example
	 * // safe usage
	 *
	 * gui.add( obj, 'prop1' ).options( [ 'a', 'b', 'c' ] );
	 * gui.add( obj, 'prop2' ).options( { Big: 10, Small: 1 } );
	 * gui.add( obj, 'prop3' );
	 *
	 * // danger
	 *
	 * const ctrl1 = gui.add( obj, 'prop1' );
	 * gui.add( obj, 'prop2' );
	 *
	 * // calling options out of order adds a new controller to the end...
	 * const ctrl2 = ctrl1.options( [ 'a', 'b', 'c' ] );
	 *
	 * // ...and ctrl1 now references a controller that doesn't exist
	 * assert( ctrl2 !== ctrl1 )
	 * @param {object|Array} options
	 * @returns {Controller}
	 */
	options( options ) {
		const controller = this.parent.add( this.object, this.property, options );
		controller.name( this._name );
		this.destroy();
		return controller;
	}

	/**
	 * Sets the minimum value. Only works on number controllers.
	 * @param {number} min
	 * @returns {this}
	 */
	min( min ) {
		return this;
	}

	/**
	 * Sets the maximum value. Only works on number controllers.
	 * @param {number} max
	 * @returns {this}
	 */
	max( max ) {
		return this;
	}

	/**
	 * Values set by this controller will be rounded to multiples of `step`. Only works on number
	 * controllers.
	 * @param {number} step
	 * @returns {this}
	 */
	step( step ) {
		return this;
	}

	/**
	 * Rounds the displayed value to a fixed number of decimals, without affecting the actual value
	 * like `step()`. Only works on number controllers.
	 * @example
	 * gui.add( object, 'property' ).listen().decimals( 4 );
	 * @param {number} decimals
	 * @returns {this}
	 */
	decimals( decimals ) {
		return this;
	}

	/**
	 * Calls `updateDisplay()` every animation frame. Pass `false` to stop listening.
	 * @param {boolean} listen
	 * @returns {this}
	 */
	listen( listen = true ) {

		/**
		 * Used to determine if the controller is currently listening. Don't modify this value
		 * directly. Use the `controller.listen( true|false )` method instead.
		 * @type {boolean}
		 */
		this._listening = listen;

		if ( this._listenCallbackID !== undefined ) {
			cancelAnimationFrame( this._listenCallbackID );
			this._listenCallbackID = undefined;
		}

		if ( this._listening ) {
			this._listenCallback();
		}

		return this;

	}

	_listenCallback() {

		this._listenCallbackID = requestAnimationFrame( this._listenCallback );

		// To prevent framerate loss, make sure the value has changed before updating the display.
		// Note: save() is used here instead of getValue() only because of ColorController. The !== operator
		// won't work for color objects or arrays, but ColorController.save() always returns a string.

		const curValue = this.save();

		if ( curValue !== this._listenPrevValue ) {
			this.updateDisplay();
		}

		this._listenPrevValue = curValue;

	}

	/**
	 * Returns `object[ property ]`.
	 * @returns {any}
	 */
	getValue() {
		return this.object[ this.property ];
	}

	/**
	 * Sets the value of `object[ property ]`, invokes any `onChange` handlers and updates the display.
	 * @param {any} value
	 * @returns {this}
	 */
	setValue( value ) {

		if ( this.getValue() !== value ) {

			this.object[ this.property ] = value;
			this._callOnChange();
			this.updateDisplay();

		}

		return this;

	}

	/**
	 * Updates the display to keep it in sync with the current value. Useful for updating your
	 * controllers when their values have been modified outside of the GUI.
	 * @returns {this}
	 */
	updateDisplay() {
		return this;
	}

	load( value ) {
		this.setValue( value );
		this._callOnFinishChange();
		return this;
	}

	save() {
		return this.getValue();
	}

	/**
	 * Destroys this controller and removes it from the parent GUI.
	 */
	destroy() {
		this.listen( false );
		this.parent.children.splice( this.parent.children.indexOf( this ), 1 );
		this.parent.controllers.splice( this.parent.controllers.indexOf( this ), 1 );
		this.parent.$children.removeChild( this.domElement );
	}

}

class BooleanController extends Controller {

	constructor( parent, object, property ) {

		super( parent, object, property, 'boolean', 'label' );

		this.$input = document.createElement( 'input' );
		this.$input.setAttribute( 'type', 'checkbox' );
		this.$input.setAttribute( 'aria-labelledby', this.$name.id );

		this.$widget.appendChild( this.$input );

		this.$input.addEventListener( 'change', () => {
			this.setValue( this.$input.checked );
			this._callOnFinishChange();
		} );

		this.$disable = this.$input;

		this.updateDisplay();

	}

	updateDisplay() {
		this.$input.checked = this.getValue();
		return this;
	}

}

function normalizeColorString( string ) {

	let match, result;

	if ( match = string.match( /(#|0x)?([a-f0-9]{6})/i ) ) {

		result = match[ 2 ];

	} else if ( match = string.match( /rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/ ) ) {

		result = parseInt( match[ 1 ] ).toString( 16 ).padStart( 2, 0 )
			+ parseInt( match[ 2 ] ).toString( 16 ).padStart( 2, 0 )
			+ parseInt( match[ 3 ] ).toString( 16 ).padStart( 2, 0 );

	} else if ( match = string.match( /^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i ) ) {

		result = match[ 1 ] + match[ 1 ] + match[ 2 ] + match[ 2 ] + match[ 3 ] + match[ 3 ];

	}

	if ( result ) {
		return '#' + result;
	}

	return false;

}

const STRING = {
	isPrimitive: true,
	match: v => typeof v === 'string',
	fromHexString: normalizeColorString,
	toHexString: normalizeColorString
};

const INT = {
	isPrimitive: true,
	match: v => typeof v === 'number',
	fromHexString: string => parseInt( string.substring( 1 ), 16 ),
	toHexString: value => '#' + value.toString( 16 ).padStart( 6, 0 )
};

const ARRAY = {
	isPrimitive: false,

	// The arrow function is here to appease tree shakers like esbuild or webpack.
	// See https://esbuild.github.io/api/#tree-shaking
	match: v => Array.isArray( v ),

	fromHexString( string, target, rgbScale = 1 ) {

		const int = INT.fromHexString( string );

		target[ 0 ] = ( int >> 16 & 255 ) / 255 * rgbScale;
		target[ 1 ] = ( int >> 8 & 255 ) / 255 * rgbScale;
		target[ 2 ] = ( int & 255 ) / 255 * rgbScale;

	},
	toHexString( [ r, g, b ], rgbScale = 1 ) {

		rgbScale = 255 / rgbScale;

		const int = ( r * rgbScale ) << 16 ^
			( g * rgbScale ) << 8 ^
			( b * rgbScale ) << 0;

		return INT.toHexString( int );

	}
};

const OBJECT = {
	isPrimitive: false,
	match: v => Object( v ) === v,
	fromHexString( string, target, rgbScale = 1 ) {

		const int = INT.fromHexString( string );

		target.r = ( int >> 16 & 255 ) / 255 * rgbScale;
		target.g = ( int >> 8 & 255 ) / 255 * rgbScale;
		target.b = ( int & 255 ) / 255 * rgbScale;

	},
	toHexString( { r, g, b }, rgbScale = 1 ) {

		rgbScale = 255 / rgbScale;

		const int = ( r * rgbScale ) << 16 ^
			( g * rgbScale ) << 8 ^
			( b * rgbScale ) << 0;

		return INT.toHexString( int );

	}
};

const FORMATS = [ STRING, INT, ARRAY, OBJECT ];

function getColorFormat( value ) {
	return FORMATS.find( format => format.match( value ) );
}

class ColorController extends Controller {

	constructor( parent, object, property, rgbScale ) {

		super( parent, object, property, 'color' );

		this.$input = document.createElement( 'input' );
		this.$input.setAttribute( 'type', 'color' );
		this.$input.setAttribute( 'tabindex', -1 );
		this.$input.setAttribute( 'aria-labelledby', this.$name.id );

		this.$text = document.createElement( 'input' );
		this.$text.setAttribute( 'type', 'text' );
		this.$text.setAttribute( 'spellcheck', 'false' );
		this.$text.setAttribute( 'aria-labelledby', this.$name.id );

		this.$display = document.createElement( 'div' );
		this.$display.classList.add( 'display' );

		this.$display.appendChild( this.$input );
		this.$widget.appendChild( this.$display );
		this.$widget.appendChild( this.$text );

		this._format = getColorFormat( this.initialValue );
		this._rgbScale = rgbScale;

		this._initialValueHexString = this.save();
		this._textFocused = false;

		this.$input.addEventListener( 'input', () => {
			this._setValueFromHexString( this.$input.value );
		} );

		this.$input.addEventListener( 'blur', () => {
			this._callOnFinishChange();
		} );

		this.$text.addEventListener( 'input', () => {
			const tryParse = normalizeColorString( this.$text.value );
			if ( tryParse ) {
				this._setValueFromHexString( tryParse );
			}
		} );

		this.$text.addEventListener( 'focus', () => {
			this._textFocused = true;
			this.$text.select();
		} );

		this.$text.addEventListener( 'blur', () => {
			this._textFocused = false;
			this.updateDisplay();
			this._callOnFinishChange();
		} );

		this.$disable = this.$text;

		this.updateDisplay();

	}

	reset() {
		this._setValueFromHexString( this._initialValueHexString );
		return this;
	}

	_setValueFromHexString( value ) {

		if ( this._format.isPrimitive ) {

			const newValue = this._format.fromHexString( value );
			this.setValue( newValue );

		} else {

			this._format.fromHexString( value, this.getValue(), this._rgbScale );
			this._callOnChange();
			this.updateDisplay();

		}

	}

	save() {
		return this._format.toHexString( this.getValue(), this._rgbScale );
	}

	load( value ) {
		this._setValueFromHexString( value );
		this._callOnFinishChange();
		return this;
	}

	updateDisplay() {
		this.$input.value = this._format.toHexString( this.getValue(), this._rgbScale );
		if ( !this._textFocused ) {
			this.$text.value = this.$input.value.substring( 1 );
		}
		this.$display.style.backgroundColor = this.$input.value;
		return this;
	}

}

class FunctionController extends Controller {

	constructor( parent, object, property ) {

		super( parent, object, property, 'function' );

		// Buttons are the only case where widget contains name
		this.$button = document.createElement( 'button' );
		this.$button.appendChild( this.$name );
		this.$widget.appendChild( this.$button );

		this.$button.addEventListener( 'click', e => {
			e.preventDefault();
			this.getValue().call( this.object );
			this._callOnChange();
		} );

		// enables :active pseudo class on mobile
		this.$button.addEventListener( 'touchstart', () => {}, { passive: true } );

		this.$disable = this.$button;

	}

}

class NumberController extends Controller {

	constructor( parent, object, property, min, max, step ) {

		super( parent, object, property, 'number' );

		this._initInput();

		this.min( min );
		this.max( max );

		const stepExplicit = step !== undefined;
		this.step( stepExplicit ? step : this._getImplicitStep(), stepExplicit );

		this.updateDisplay();

	}

	decimals( decimals ) {
		this._decimals = decimals;
		this.updateDisplay();
		return this;
	}

	min( min ) {
		this._min = min;
		this._onUpdateMinMax();
		return this;
	}

	max( max ) {
		this._max = max;
		this._onUpdateMinMax();
		return this;
	}

	step( step, explicit = true ) {
		this._step = step;
		this._stepExplicit = explicit;
		return this;
	}

	updateDisplay() {

		const value = this.getValue();

		if ( this._hasSlider ) {

			let percent = ( value - this._min ) / ( this._max - this._min );
			percent = Math.max( 0, Math.min( percent, 1 ) );

			this.$fill.style.width = percent * 100 + '%';

		}

		if ( !this._inputFocused ) {
			this.$input.value = this._decimals === undefined ? value : value.toFixed( this._decimals );
		}

		return this;

	}

	_initInput() {

		this.$input = document.createElement( 'input' );
		this.$input.setAttribute( 'type', 'text' );
		this.$input.setAttribute( 'aria-labelledby', this.$name.id );

		// On touch devices only, use input[type=number] to force a numeric keyboard.
		// Ideally we could use one input type everywhere, but [type=number] has quirks
		// on desktop, and [inputmode=decimal] has quirks on iOS.
		// See https://github.com/georgealways/lil-gui/pull/16

		const isTouch = window.matchMedia( '(pointer: coarse)' ).matches;

		if ( isTouch ) {
			this.$input.setAttribute( 'type', 'number' );
			this.$input.setAttribute( 'step', 'any' );
		}

		this.$widget.appendChild( this.$input );

		this.$disable = this.$input;

		const onInput = () => {

			let value = parseFloat( this.$input.value );

			if ( isNaN( value ) ) return;

			if ( this._stepExplicit ) {
				value = this._snap( value );
			}

			this.setValue( this._clamp( value ) );

		};

		// Keys & mouse wheel
		// ---------------------------------------------------------------------

		const increment = delta => {

			const value = parseFloat( this.$input.value );

			if ( isNaN( value ) ) return;

			this._snapClampSetValue( value + delta );

			// Force the input to updateDisplay when it's focused
			this.$input.value = this.getValue();

		};

		const onKeyDown = e => {
			// Using `e.key` instead of `e.code` also catches NumpadEnter
			if ( e.key === 'Enter' ) {
				this.$input.blur();
			}
			if ( e.code === 'ArrowUp' ) {
				e.preventDefault();
				increment( this._step * this._arrowKeyMultiplier( e ) );
			}
			if ( e.code === 'ArrowDown' ) {
				e.preventDefault();
				increment( this._step * this._arrowKeyMultiplier( e ) * -1 );
			}
		};

		const onWheel = e => {
			if ( this._inputFocused ) {
				e.preventDefault();
				increment( this._step * this._normalizeMouseWheel( e ) );
			}
		};

		// Vertical drag
		// ---------------------------------------------------------------------

		let testingForVerticalDrag = false,
			initClientX,
			initClientY,
			prevClientY,
			initValue,
			dragDelta;

		// Once the mouse is dragged more than DRAG_THRESH px on any axis, we decide
		// on the user's intent: horizontal means highlight, vertical means drag.
		const DRAG_THRESH = 5;

		const onMouseDown = e => {

			initClientX = e.clientX;
			initClientY = prevClientY = e.clientY;
			testingForVerticalDrag = true;

			initValue = this.getValue();
			dragDelta = 0;

			window.addEventListener( 'mousemove', onMouseMove );
			window.addEventListener( 'mouseup', onMouseUp );

		};

		const onMouseMove = e => {

			if ( testingForVerticalDrag ) {

				const dx = e.clientX - initClientX;
				const dy = e.clientY - initClientY;

				if ( Math.abs( dy ) > DRAG_THRESH ) {

					e.preventDefault();
					this.$input.blur();
					testingForVerticalDrag = false;
					this._setDraggingStyle( true, 'vertical' );

				} else if ( Math.abs( dx ) > DRAG_THRESH ) {

					onMouseUp();

				}

			}

			// This isn't an else so that the first move counts towards dragDelta
			if ( !testingForVerticalDrag ) {

				const dy = e.clientY - prevClientY;

				dragDelta -= dy * this._step * this._arrowKeyMultiplier( e );

				// Clamp dragDelta so we don't have 'dead space' after dragging past bounds.
				// We're okay with the fact that bounds can be undefined here.
				if ( initValue + dragDelta > this._max ) {
					dragDelta = this._max - initValue;
				} else if ( initValue + dragDelta < this._min ) {
					dragDelta = this._min - initValue;
				}

				this._snapClampSetValue( initValue + dragDelta );

			}

			prevClientY = e.clientY;

		};

		const onMouseUp = () => {
			this._setDraggingStyle( false, 'vertical' );
			this._callOnFinishChange();
			window.removeEventListener( 'mousemove', onMouseMove );
			window.removeEventListener( 'mouseup', onMouseUp );
		};

		// Focus state & onFinishChange
		// ---------------------------------------------------------------------

		const onFocus = () => {
			this._inputFocused = true;
		};

		const onBlur = () => {
			this._inputFocused = false;
			this.updateDisplay();
			this._callOnFinishChange();
		};

		this.$input.addEventListener( 'input', onInput );
		this.$input.addEventListener( 'keydown', onKeyDown );
		this.$input.addEventListener( 'wheel', onWheel, { passive: false } );
		this.$input.addEventListener( 'mousedown', onMouseDown );
		this.$input.addEventListener( 'focus', onFocus );
		this.$input.addEventListener( 'blur', onBlur );

	}

	_initSlider() {

		this._hasSlider = true;

		// Build DOM
		// ---------------------------------------------------------------------

		this.$slider = document.createElement( 'div' );
		this.$slider.classList.add( 'slider' );

		this.$fill = document.createElement( 'div' );
		this.$fill.classList.add( 'fill' );

		this.$slider.appendChild( this.$fill );
		this.$widget.insertBefore( this.$slider, this.$input );

		this.domElement.classList.add( 'hasSlider' );

		// Map clientX to value
		// ---------------------------------------------------------------------

		const map = ( v, a, b, c, d ) => {
			return ( v - a ) / ( b - a ) * ( d - c ) + c;
		};

		const setValueFromX = clientX => {
			const rect = this.$slider.getBoundingClientRect();
			let value = map( clientX, rect.left, rect.right, this._min, this._max );
			this._snapClampSetValue( value );
		};

		// Mouse drag
		// ---------------------------------------------------------------------

		const mouseDown = e => {
			this._setDraggingStyle( true );
			setValueFromX( e.clientX );
			window.addEventListener( 'mousemove', mouseMove );
			window.addEventListener( 'mouseup', mouseUp );
		};

		const mouseMove = e => {
			setValueFromX( e.clientX );
		};

		const mouseUp = () => {
			this._callOnFinishChange();
			this._setDraggingStyle( false );
			window.removeEventListener( 'mousemove', mouseMove );
			window.removeEventListener( 'mouseup', mouseUp );
		};

		// Touch drag
		// ---------------------------------------------------------------------

		let testingForScroll = false, prevClientX, prevClientY;

		const beginTouchDrag = e => {
			e.preventDefault();
			this._setDraggingStyle( true );
			setValueFromX( e.touches[ 0 ].clientX );
			testingForScroll = false;
		};

		const onTouchStart = e => {

			if ( e.touches.length > 1 ) return;

			// If we're in a scrollable container, we should wait for the first
			// touchmove to see if the user is trying to slide or scroll.
			if ( this._hasScrollBar ) {

				prevClientX = e.touches[ 0 ].clientX;
				prevClientY = e.touches[ 0 ].clientY;
				testingForScroll = true;

			} else {

				// Otherwise, we can set the value straight away on touchstart.
				beginTouchDrag( e );

			}

			window.addEventListener( 'touchmove', onTouchMove, { passive: false } );
			window.addEventListener( 'touchend', onTouchEnd );

		};

		const onTouchMove = e => {

			if ( testingForScroll ) {

				const dx = e.touches[ 0 ].clientX - prevClientX;
				const dy = e.touches[ 0 ].clientY - prevClientY;

				if ( Math.abs( dx ) > Math.abs( dy ) ) {

					// We moved horizontally, set the value and stop checking.
					beginTouchDrag( e );

				} else {

					// This was, in fact, an attempt to scroll. Abort.
					window.removeEventListener( 'touchmove', onTouchMove );
					window.removeEventListener( 'touchend', onTouchEnd );

				}

			} else {

				e.preventDefault();
				setValueFromX( e.touches[ 0 ].clientX );

			}

		};

		const onTouchEnd = () => {
			this._callOnFinishChange();
			this._setDraggingStyle( false );
			window.removeEventListener( 'touchmove', onTouchMove );
			window.removeEventListener( 'touchend', onTouchEnd );
		};

		// Mouse wheel
		// ---------------------------------------------------------------------

		// We have to use a debounced function to call onFinishChange because
		// there's no way to tell when the user is "done" mouse-wheeling.
		const callOnFinishChange = this._callOnFinishChange.bind( this );
		const WHEEL_DEBOUNCE_TIME = 400;
		let wheelFinishChangeTimeout;

		const onWheel = e => {

			// ignore vertical wheels if there's a scrollbar
			const isVertical = Math.abs( e.deltaX ) < Math.abs( e.deltaY );
			if ( isVertical && this._hasScrollBar ) return;

			e.preventDefault();

			// set value
			const delta = this._normalizeMouseWheel( e ) * this._step;
			this._snapClampSetValue( this.getValue() + delta );

			// force the input to updateDisplay when it's focused
			this.$input.value = this.getValue();

			// debounce onFinishChange
			clearTimeout( wheelFinishChangeTimeout );
			wheelFinishChangeTimeout = setTimeout( callOnFinishChange, WHEEL_DEBOUNCE_TIME );

		};

		this.$slider.addEventListener( 'mousedown', mouseDown );
		this.$slider.addEventListener( 'touchstart', onTouchStart, { passive: false } );
		this.$slider.addEventListener( 'wheel', onWheel, { passive: false } );

	}

	_setDraggingStyle( active, axis = 'horizontal' ) {
		if ( this.$slider ) {
			this.$slider.classList.toggle( 'active', active );
		}
		document.body.classList.toggle( 'lil-gui-dragging', active );
		document.body.classList.toggle( `lil-gui-${axis}`, active );
	}

	_getImplicitStep() {

		if ( this._hasMin && this._hasMax ) {
			return ( this._max - this._min ) / 1000;
		}

		return 0.1;

	}

	_onUpdateMinMax() {

		if ( !this._hasSlider && this._hasMin && this._hasMax ) {

			// If this is the first time we're hearing about min and max
			// and we haven't explicitly stated what our step is, let's
			// update that too.
			if ( !this._stepExplicit ) {
				this.step( this._getImplicitStep(), false );
			}

			this._initSlider();
			this.updateDisplay();

		}

	}

	_normalizeMouseWheel( e ) {

		let { deltaX, deltaY } = e;

		// Safari and Chrome report weird non-integral values for a notched wheel,
		// but still expose actual lines scrolled via wheelDelta. Notched wheels
		// should behave the same way as arrow keys.
		if ( Math.floor( e.deltaY ) !== e.deltaY && e.wheelDelta ) {
			deltaX = 0;
			deltaY = -e.wheelDelta / 120;
			deltaY *= this._stepExplicit ? 1 : 10;
		}

		const wheel = deltaX + -deltaY;

		return wheel;

	}

	_arrowKeyMultiplier( e ) {

		let mult = this._stepExplicit ? 1 : 10;

		if ( e.shiftKey ) {
			mult *= 10;
		} else if ( e.altKey ) {
			mult /= 10;
		}

		return mult;

	}

	_snap( value ) {

		// Make the steps "start" at min or max.
		let offset = 0;
		if ( this._hasMin ) {
			offset = this._min;
		} else if ( this._hasMax ) {
			offset = this._max;
		}

		value -= offset;

		value = Math.round( value / this._step ) * this._step;

		value += offset;

		// Used to prevent "flyaway" decimals like 1.00000000000001
		value = parseFloat( value.toPrecision( 15 ) );

		return value;

	}

	_clamp( value ) {
		// either condition is false if min or max is undefined
		if ( value < this._min ) value = this._min;
		if ( value > this._max ) value = this._max;
		return value;
	}

	_snapClampSetValue( value ) {
		this.setValue( this._clamp( this._snap( value ) ) );
	}

	get _hasScrollBar() {
		const root = this.parent.root.$children;
		return root.scrollHeight > root.clientHeight;
	}

	get _hasMin() {
		return this._min !== undefined;
	}

	get _hasMax() {
		return this._max !== undefined;
	}

}

class OptionController extends Controller {

	constructor( parent, object, property, options ) {

		super( parent, object, property, 'option' );

		this.$select = document.createElement( 'select' );
		this.$select.setAttribute( 'aria-labelledby', this.$name.id );

		this.$display = document.createElement( 'div' );
		this.$display.classList.add( 'display' );

		this.$select.addEventListener( 'change', () => {
			this.setValue( this._values[ this.$select.selectedIndex ] );
			this._callOnFinishChange();
		} );

		this.$select.addEventListener( 'focus', () => {
			this.$display.classList.add( 'focus' );
		} );

		this.$select.addEventListener( 'blur', () => {
			this.$display.classList.remove( 'focus' );
		} );

		this.$widget.appendChild( this.$select );
		this.$widget.appendChild( this.$display );

		this.$disable = this.$select;

		this.options( options );

	}

	options( options ) {

		this._values = Array.isArray( options ) ? options : Object.values( options );
		this._names = Array.isArray( options ) ? options : Object.keys( options );

		this.$select.replaceChildren();

		this._names.forEach( name => {
			const $option = document.createElement( 'option' );
			$option.textContent = name;
			this.$select.appendChild( $option );
		} );

		this.updateDisplay();

		return this;

	}

	updateDisplay() {
		const value = this.getValue();
		const index = this._values.indexOf( value );
		this.$select.selectedIndex = index;
		this.$display.textContent = index === -1 ? value : this._names[ index ];
		return this;
	}

}

class StringController extends Controller {

	constructor( parent, object, property ) {

		super( parent, object, property, 'string' );

		this.$input = document.createElement( 'input' );
		this.$input.setAttribute( 'type', 'text' );
		this.$input.setAttribute( 'spellcheck', 'false' );
		this.$input.setAttribute( 'aria-labelledby', this.$name.id );

		this.$input.addEventListener( 'input', () => {
			this.setValue( this.$input.value );
		} );

		this.$input.addEventListener( 'keydown', e => {
			if ( e.code === 'Enter' ) {
				this.$input.blur();
			}
		} );

		this.$input.addEventListener( 'blur', () => {
			this._callOnFinishChange();
		} );

		this.$widget.appendChild( this.$input );

		this.$disable = this.$input;

		this.updateDisplay();

	}

	updateDisplay() {
		this.$input.value = this.getValue();
		return this;
	}

}

var stylesheet = `.lil-gui {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: 1;
  font-weight: normal;
  font-style: normal;
  text-align: left;
  color: var(--text-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  --background-color: #1f1f1f;
  --text-color: #ebebeb;
  --title-background-color: #111111;
  --title-text-color: #ebebeb;
  --widget-color: #424242;
  --hover-color: #4f4f4f;
  --focus-color: #595959;
  --number-color: #2cc9ff;
  --string-color: #a2db3c;
  --font-size: 11px;
  --input-font-size: 11px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-family-mono: Menlo, Monaco, Consolas, "Droid Sans Mono", monospace;
  --padding: 4px;
  --spacing: 4px;
  --widget-height: 20px;
  --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
  --name-width: 45%;
  --slider-knob-width: 2px;
  --slider-input-width: 27%;
  --color-input-width: 27%;
  --slider-input-min-width: 45px;
  --color-input-min-width: 45px;
  --folder-indent: 7px;
  --widget-padding: 0 0 0 3px;
  --widget-border-radius: 2px;
  --checkbox-size: calc(0.75 * var(--widget-height));
  --scrollbar-width: 5px;
}
.lil-gui, .lil-gui * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lil-gui.root {
  width: var(--width, 245px);
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}
.lil-gui.root > .title {
  background: var(--title-background-color);
  color: var(--title-text-color);
}
.lil-gui.root > .children {
  overflow-x: hidden;
  overflow-y: auto;
}
.lil-gui.root > .children::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
  background: var(--background-color);
}
.lil-gui.root > .children::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-width);
  background: var(--focus-color);
}
@media (pointer: coarse) {
  .lil-gui.allow-touch-styles, .lil-gui.allow-touch-styles .lil-gui {
    --widget-height: 28px;
    --padding: 6px;
    --spacing: 6px;
    --font-size: 13px;
    --input-font-size: 16px;
    --folder-indent: 10px;
    --scrollbar-width: 7px;
    --slider-input-min-width: 50px;
    --color-input-min-width: 65px;
  }
}
.lil-gui.force-touch-styles, .lil-gui.force-touch-styles .lil-gui {
  --widget-height: 28px;
  --padding: 6px;
  --spacing: 6px;
  --font-size: 13px;
  --input-font-size: 16px;
  --folder-indent: 10px;
  --scrollbar-width: 7px;
  --slider-input-min-width: 50px;
  --color-input-min-width: 65px;
}
.lil-gui.autoPlace {
  max-height: 100%;
  position: fixed;
  top: 0;
  right: 15px;
  z-index: 1001;
}

.lil-gui .controller {
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
}
.lil-gui .controller.disabled {
  opacity: 0.5;
}
.lil-gui .controller.disabled, .lil-gui .controller.disabled * {
  pointer-events: none !important;
}
.lil-gui .controller > .name {
  min-width: var(--name-width);
  flex-shrink: 0;
  white-space: pre;
  padding-right: var(--spacing);
  line-height: var(--widget-height);
}
.lil-gui .controller .widget {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--widget-height);
}
.lil-gui .controller.string input {
  color: var(--string-color);
}
.lil-gui .controller.boolean {
  cursor: pointer;
}
.lil-gui .controller.color .display {
  width: 100%;
  height: var(--widget-height);
  border-radius: var(--widget-border-radius);
  position: relative;
}
@media (hover: hover) {
  .lil-gui .controller.color .display:hover:before {
    content: " ";
    display: block;
    position: absolute;
    border-radius: var(--widget-border-radius);
    border: 1px solid #fff9;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.lil-gui .controller.color input[type=color] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.lil-gui .controller.color input[type=text] {
  margin-left: var(--spacing);
  font-family: var(--font-family-mono);
  min-width: var(--color-input-min-width);
  width: var(--color-input-width);
  flex-shrink: 0;
}
.lil-gui .controller.option select {
  opacity: 0;
  position: absolute;
  width: 100%;
  max-width: 100%;
}
.lil-gui .controller.option .display {
  position: relative;
  pointer-events: none;
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  line-height: var(--widget-height);
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  padding-left: 0.55em;
  padding-right: 1.75em;
  background: var(--widget-color);
}
@media (hover: hover) {
  .lil-gui .controller.option .display.focus {
    background: var(--focus-color);
  }
}
.lil-gui .controller.option .display.active {
  background: var(--focus-color);
}
.lil-gui .controller.option .display:after {
  font-family: "lil-gui";
  content: "↕";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-right: 0.375em;
}
.lil-gui .controller.option .widget,
.lil-gui .controller.option select {
  cursor: pointer;
}
@media (hover: hover) {
  .lil-gui .controller.option .widget:hover .display {
    background: var(--hover-color);
  }
}
.lil-gui .controller.number input {
  color: var(--number-color);
}
.lil-gui .controller.number.hasSlider input {
  margin-left: var(--spacing);
  width: var(--slider-input-width);
  min-width: var(--slider-input-min-width);
  flex-shrink: 0;
}
.lil-gui .controller.number .slider {
  width: 100%;
  height: var(--widget-height);
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  padding-right: var(--slider-knob-width);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
}
@media (hover: hover) {
  .lil-gui .controller.number .slider:hover {
    background: var(--hover-color);
  }
}
.lil-gui .controller.number .slider.active {
  background: var(--focus-color);
}
.lil-gui .controller.number .slider.active .fill {
  opacity: 0.95;
}
.lil-gui .controller.number .fill {
  height: 100%;
  border-right: var(--slider-knob-width) solid var(--number-color);
  box-sizing: content-box;
}

.lil-gui-dragging .lil-gui {
  --hover-color: var(--widget-color);
}
.lil-gui-dragging * {
  cursor: ew-resize !important;
}

.lil-gui-dragging.lil-gui-vertical * {
  cursor: ns-resize !important;
}

.lil-gui .title {
  height: var(--title-height);
  font-weight: 600;
  padding: 0 var(--padding);
  width: 100%;
  text-align: left;
  background: none;
  text-decoration-skip: objects;
}
.lil-gui .title:before {
  font-family: "lil-gui";
  content: "▾";
  padding-right: 2px;
  display: inline-block;
}
.lil-gui .title:active {
  background: var(--title-background-color);
  opacity: 0.75;
}
@media (hover: hover) {
  body:not(.lil-gui-dragging) .lil-gui .title:hover {
    background: var(--title-background-color);
    opacity: 0.85;
  }
  .lil-gui .title:focus {
    text-decoration: underline var(--focus-color);
  }
}
.lil-gui.root > .title:focus {
  text-decoration: none !important;
}
.lil-gui.closed > .title:before {
  content: "▸";
}
.lil-gui.closed > .children {
  transform: translateY(-7px);
  opacity: 0;
}
.lil-gui.closed:not(.transition) > .children {
  display: none;
}
.lil-gui.transition > .children {
  transition-duration: 300ms;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
  overflow: hidden;
  pointer-events: none;
}
.lil-gui .children:empty:before {
  content: "Empty";
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
  display: block;
  height: var(--widget-height);
  font-style: italic;
  line-height: var(--widget-height);
  opacity: 0.5;
}
.lil-gui.root > .children > .lil-gui > .title {
  border: 0 solid var(--widget-color);
  border-width: 1px 0;
  transition: border-color 300ms;
}
.lil-gui.root > .children > .lil-gui.closed > .title {
  border-bottom-color: transparent;
}
.lil-gui + .controller {
  border-top: 1px solid var(--widget-color);
  margin-top: 0;
  padding-top: var(--spacing);
}
.lil-gui .lil-gui .lil-gui > .title {
  border: none;
}
.lil-gui .lil-gui .lil-gui > .children {
  border: none;
  margin-left: var(--folder-indent);
  border-left: 2px solid var(--widget-color);
}
.lil-gui .lil-gui .controller {
  border: none;
}

.lil-gui label, .lil-gui input, .lil-gui button {
  -webkit-tap-highlight-color: transparent;
}
.lil-gui input {
  border: 0;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--input-font-size);
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  background: var(--widget-color);
  color: var(--text-color);
  width: 100%;
}
@media (hover: hover) {
  .lil-gui input:hover {
    background: var(--hover-color);
  }
  .lil-gui input:active {
    background: var(--focus-color);
  }
}
.lil-gui input:disabled {
  opacity: 1;
}
.lil-gui input[type=text],
.lil-gui input[type=number] {
  padding: var(--widget-padding);
  -moz-appearance: textfield;
}
.lil-gui input[type=text]:focus,
.lil-gui input[type=number]:focus {
  background: var(--focus-color);
}
.lil-gui input[type=checkbox] {
  appearance: none;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: var(--widget-border-radius);
  text-align: center;
  cursor: pointer;
}
.lil-gui input[type=checkbox]:checked:before {
  font-family: "lil-gui";
  content: "✓";
  font-size: var(--checkbox-size);
  line-height: var(--checkbox-size);
}
@media (hover: hover) {
  .lil-gui input[type=checkbox]:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button {
  outline: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  width: 100%;
  border: none;
}
.lil-gui .controller button {
  height: var(--widget-height);
  text-transform: none;
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
}
@media (hover: hover) {
  .lil-gui .controller button:hover {
    background: var(--hover-color);
  }
  .lil-gui .controller button:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui .controller button:active {
  background: var(--focus-color);
}

@font-face {
  font-family: "lil-gui";
  src: url("data:application/font-woff;charset=utf-8;base64,d09GRgABAAAAAAUsAAsAAAAACJwAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAAH4AAADAImwmYE9TLzIAAAGIAAAAPwAAAGBKqH5SY21hcAAAAcgAAAD0AAACrukyyJBnbHlmAAACvAAAAF8AAACEIZpWH2hlYWQAAAMcAAAAJwAAADZfcj2zaGhlYQAAA0QAAAAYAAAAJAC5AHhobXR4AAADXAAAABAAAABMAZAAAGxvY2EAAANsAAAAFAAAACgCEgIybWF4cAAAA4AAAAAeAAAAIAEfABJuYW1lAAADoAAAASIAAAIK9SUU/XBvc3QAAATEAAAAZgAAAJCTcMc2eJxVjbEOgjAURU+hFRBK1dGRL+ALnAiToyMLEzFpnPz/eAshwSa97517c/MwwJmeB9kwPl+0cf5+uGPZXsqPu4nvZabcSZldZ6kfyWnomFY/eScKqZNWupKJO6kXN3K9uCVoL7iInPr1X5baXs3tjuMqCtzEuagm/AAlzQgPAAB4nGNgYRBlnMDAysDAYM/gBiT5oLQBAwuDJAMDEwMrMwNWEJDmmsJwgCFeXZghBcjlZMgFCzOiKOIFAB71Bb8AeJy1kjFuwkAQRZ+DwRAwBtNQRUGKQ8OdKCAWUhAgKLhIuAsVSpWz5Bbkj3dEgYiUIszqWdpZe+Z7/wB1oCYmIoboiwiLT2WjKl/jscrHfGg/pKdMkyklC5Zs2LEfHYpjcRoPzme9MWWmk3dWbK9ObkWkikOetJ554fWyoEsmdSlt+uR0pCJR34b6t/TVg1SY3sYvdf8vuiKrpyaDXDISiegp17p7579Gp3p++y7HPAiY9pmTibljrr85qSidtlg4+l25GLCaS8e6rRxNBmsnERunKbaOObRz7N72ju5vdAjYpBXHgJylOAVsMseDAPEP8LYoUHicY2BiAAEfhiAGJgZWBgZ7RnFRdnVJELCQlBSRlATJMoLV2DK4glSYs6ubq5vbKrJLSbGrgEmovDuDJVhe3VzcXFwNLCOILB/C4IuQ1xTn5FPilBTj5FPmBAB4WwoqAHicY2BkYGAA4sk1sR/j+W2+MnAzpDBgAyEMQUCSg4EJxAEAwUgFHgB4nGNgZGBgSGFggJMhDIwMqEAYAByHATJ4nGNgAIIUNEwmAABl3AGReJxjYAACIQYlBiMGJ3wQAEcQBEV4nGNgZGBgEGZgY2BiAAEQyQWEDAz/wXwGAAsPATIAAHicXdBNSsNAHAXwl35iA0UQXYnMShfS9GPZA7T7LgIu03SSpkwzYTIt1BN4Ak/gKTyAeCxfw39jZkjymzcvAwmAW/wgwHUEGDb36+jQQ3GXGot79L24jxCP4gHzF/EIr4jEIe7wxhOC3g2TMYy4Q7+Lu/SHuEd/ivt4wJd4wPxbPEKMX3GI5+DJFGaSn4qNzk8mcbKSR6xdXdhSzaOZJGtdapd4vVPbi6rP+cL7TGXOHtXKll4bY1Xl7EGnPtp7Xy2n00zyKLVHfkHBa4IcJ2oD3cgggWvt/V/FbDrUlEUJhTn/0azVWbNTNr0Ens8de1tceK9xZmfB1CPjOmPH4kitmvOubcNpmVTN3oFJyjzCvnmrwhJTzqzVj9jiSX911FjeAAB4nG3HMRKCMBBA0f0giiKi4DU8k0V2GWbIZDOh4PoWWvq6J5V8If9NVNQcaDhyouXMhY4rPTcG7jwYmXhKq8Wz+p762aNaeYXom2n3m2dLTVgsrCgFJ7OTmIkYbwIbC6vIB7WmFfAAAA==") format("woff");
}`;

function _injectStyles( cssContent ) {
	const injected = document.createElement( 'style' );
	injected.innerHTML = cssContent;
	const before = document.querySelector( 'head link[rel=stylesheet], head style' );
	if ( before ) {
		document.head.insertBefore( injected, before );
	} else {
		document.head.appendChild( injected );
	}
}


let stylesInjected = false;

class GUI {

	/**
	 * Creates a panel that holds controllers.
	 * @example
	 * new GUI();
	 * new GUI( { container: document.getElementById( 'custom' ) } );
	 *
	 * @param {object} [options]
	 * @param {boolean} [options.autoPlace=true]
	 * Adds the GUI to `document.body` and fixes it to the top right of the page.
	 *
	 * @param {HTMLElement} [options.container]
	 * Adds the GUI to this DOM element. Overrides `autoPlace`.
	 *
	 * @param {number} [options.width=245]
	 * Width of the GUI in pixels, usually set when name labels become too long. Note that you can make
	 * name labels wider in CSS with `.lil‑gui { ‑‑name‑width: 55% }`.
	 *
	 * @param {string} [options.title=Controls]
	 * Name to display in the title bar.
	 *
	 * @param {boolean} [options.closeFolders=false]
	 * Pass `true` to close all folders in this GUI by default.
	 *
	 * @param {boolean} [options.injectStyles=true]
	 * Injects the default stylesheet into the page if this is the first GUI.
	 * Pass `false` to use your own stylesheet.
	 *
	 * @param {number} [options.touchStyles=true]
	 * Makes controllers larger on touch devices. Pass `false` to disable touch styles.
	 *
	 * @param {GUI} [options.parent]
	 * Adds this GUI as a child in another GUI. Usually this is done for you by `addFolder()`.
	 */
	constructor( {
		parent,
		autoPlace = parent === undefined,
		container,
		width,
		title = 'Controls',
		closeFolders = false,
		injectStyles = true,
		touchStyles = true
	} = {} ) {

		/**
		 * The GUI containing this folder, or `undefined` if this is the root GUI.
		 * @type {GUI}
		 */
		this.parent = parent;

		/**
		 * The top level GUI containing this folder, or `this` if this is the root GUI.
		 * @type {GUI}
		 */
		this.root = parent ? parent.root : this;

		/**
		 * The list of controllers and folders contained by this GUI.
		 * @type {Array<GUI|Controller>}
		 */
		this.children = [];

		/**
		 * The list of controllers contained by this GUI.
		 * @type {Array<Controller>}
		 */
		this.controllers = [];

		/**
		 * The list of folders contained by this GUI.
		 * @type {Array<GUI>}
		 */
		this.folders = [];

		/**
		 * Used to determine if the GUI is closed. Use `gui.open()` or `gui.close()` to change this.
		 * @type {boolean}
		 */
		this._closed = false;

		/**
		 * Used to determine if the GUI is hidden. Use `gui.show()` or `gui.hide()` to change this.
		 * @type {boolean}
		 */
		this._hidden = false;

		/**
		 * The outermost container element.
		 * @type {HTMLElement}
		 */
		this.domElement = document.createElement( 'div' );
		this.domElement.classList.add( 'lil-gui' );

		/**
		 * The DOM element that contains the title.
		 * @type {HTMLElement}
		 */
		this.$title = document.createElement( 'button' );
		this.$title.classList.add( 'title' );
		this.$title.setAttribute( 'aria-expanded', true );

		this.$title.addEventListener( 'click', () => this.openAnimated( this._closed ) );

		// enables :active pseudo class on mobile
		this.$title.addEventListener( 'touchstart', () => {}, { passive: true } );

		/**
		 * The DOM element that contains children.
		 * @type {HTMLElement}
		 */
		this.$children = document.createElement( 'div' );
		this.$children.classList.add( 'children' );

		this.domElement.appendChild( this.$title );
		this.domElement.appendChild( this.$children );

		this.title( title );

		if ( this.parent ) {

			this.parent.children.push( this );
			this.parent.folders.push( this );

			this.parent.$children.appendChild( this.domElement );

			// Stop the constructor early, everything onward only applies to root GUI's
			return;

		}

		this.domElement.classList.add( 'root' );

		if ( touchStyles ) {
			this.domElement.classList.add( 'allow-touch-styles' );
		}

		// Inject stylesheet if we haven't done that yet
		if ( !stylesInjected && injectStyles ) {
			_injectStyles( stylesheet );
			stylesInjected = true;
		}

		if ( container ) {

			container.appendChild( this.domElement );

		} else if ( autoPlace ) {

			this.domElement.classList.add( 'autoPlace' );
			document.body.appendChild( this.domElement );

		}

		if ( width ) {
			this.domElement.style.setProperty( '--width', width + 'px' );
		}

		this._closeFolders = closeFolders;

	}

	/**
	 * Adds a controller to the GUI, inferring controller type using the `typeof` operator.
	 * @example
	 * gui.add( object, 'property' );
	 * gui.add( object, 'number', 0, 100, 1 );
	 * gui.add( object, 'options', [ 1, 2, 3 ] );
	 *
	 * @param {object} object The object the controller will modify.
	 * @param {string} property Name of the property to control.
	 * @param {number|object|Array} [$1] Minimum value for number controllers, or the set of
	 * selectable values for a dropdown.
	 * @param {number} [max] Maximum value for number controllers.
	 * @param {number} [step] Step value for number controllers.
	 * @returns {Controller}
	 */
	add( object, property, $1, max, step ) {

		if ( Object( $1 ) === $1 ) {

			return new OptionController( this, object, property, $1 );

		}

		const initialValue = object[ property ];

		switch ( typeof initialValue ) {

			case 'number':

				return new NumberController( this, object, property, $1, max, step );

			case 'boolean':

				return new BooleanController( this, object, property );

			case 'string':

				return new StringController( this, object, property );

			case 'function':

				return new FunctionController( this, object, property );

		}

		console.error( `gui.add failed
	property:`, property, `
	object:`, object, `
	value:`, initialValue );

	}

	/**
	 * Adds a color controller to the GUI.
	 * @example
	 * params = {
	 * 	cssColor: '#ff00ff',
	 * 	rgbColor: { r: 0, g: 0.2, b: 0.4 },
	 * 	customRange: [ 0, 127, 255 ],
	 * };
	 *
	 * gui.addColor( params, 'cssColor' );
	 * gui.addColor( params, 'rgbColor' );
	 * gui.addColor( params, 'customRange', 255 );
	 *
	 * @param {object} object The object the controller will modify.
	 * @param {string} property Name of the property to control.
	 * @param {number} rgbScale Maximum value for a color channel when using an RGB color. You may
	 * need to set this to 255 if your colors are too bright.
	 * @returns {Controller}
	 */
	addColor( object, property, rgbScale = 1 ) {
		return new ColorController( this, object, property, rgbScale );
	}

	/**
	 * Adds a folder to the GUI, which is just another GUI. This method returns
	 * the nested GUI so you can add controllers to it.
	 * @example
	 * const folder = gui.addFolder( 'Position' );
	 * folder.add( position, 'x' );
	 * folder.add( position, 'y' );
	 * folder.add( position, 'z' );
	 *
	 * @param {string} title Name to display in the folder's title bar.
	 * @returns {GUI}
	 */
	addFolder( title ) {
		const folder = new GUI( { parent: this, title } );
		if ( this.root._closeFolders ) folder.close();
		return folder;
	}

	/**
	 * Recalls values that were saved with `gui.save()`.
	 * @param {object} obj
	 * @param {boolean} recursive Pass false to exclude folders descending from this GUI.
	 * @returns {this}
	 */
	load( obj, recursive = true ) {

		if ( obj.controllers ) {

			this.controllers.forEach( c => {

				if ( c instanceof FunctionController ) return;

				if ( c._name in obj.controllers ) {
					c.load( obj.controllers[ c._name ] );
				}

			} );

		}

		if ( recursive && obj.folders ) {

			this.folders.forEach( f => {

				if ( f._title in obj.folders ) {
					f.load( obj.folders[ f._title ] );
				}

			} );

		}

		return this;

	}

	/**
	 * Returns an object mapping controller names to values. The object can be passed to `gui.load()` to
	 * recall these values.
	 * @example
	 * {
	 * 	controllers: {
	 * 		prop1: 1,
	 * 		prop2: 'value',
	 * 		...
	 * 	},
	 * 	folders: {
	 * 		folderName1: { controllers, folders },
	 * 		folderName2: { controllers, folders }
	 * 		...
	 * 	}
	 * }
	 *
	 * @param {boolean} recursive Pass false to exclude folders descending from this GUI.
	 * @returns {object}
	 */
	save( recursive = true ) {

		const obj = {
			controllers: {},
			folders: {}
		};

		this.controllers.forEach( c => {

			if ( c instanceof FunctionController ) return;

			if ( c._name in obj.controllers ) {
				throw new Error( `Cannot save GUI with duplicate property "${c._name}"` );
			}

			obj.controllers[ c._name ] = c.save();

		} );

		if ( recursive ) {

			this.folders.forEach( f => {

				if ( f._title in obj.folders ) {
					throw new Error( `Cannot save GUI with duplicate folder "${f._title}"` );
				}

				obj.folders[ f._title ] = f.save();

			} );

		}

		return obj;

	}

	/**
	 * Opens a GUI or folder. GUI and folders are open by default.
	 * @param {boolean} open Pass false to close.
	 * @returns {this}
	 * @example
	 * gui.open(); // open
	 * gui.open( false ); // close
	 * gui.open( gui._closed ); // toggle
	 */
	open( open = true ) {

		this._setClosed( !open );

		this.$title.setAttribute( 'aria-expanded', !this._closed );
		this.domElement.classList.toggle( 'closed', this._closed );

		return this;

	}

	/**
	 * Closes the GUI.
	 * @returns {this}
	 */
	close() {
		return this.open( false );
	}

	_setClosed( closed ) {
		if ( this._closed === closed ) return;
		this._closed = closed;
		this._callOnOpenClose( this );
	}

	/**
	 * Shows the GUI after it's been hidden.
	 * @param {boolean} show
	 * @returns {this}
	 * @example
	 * gui.show();
	 * gui.show( false ); // hide
	 * gui.show( gui._hidden ); // toggle
	 */
	show( show = true ) {

		this._hidden = !show;

		this.domElement.style.display = this._hidden ? 'none' : '';

		return this;

	}

	/**
	 * Hides the GUI.
	 * @returns {this}
	 */
	hide() {
		return this.show( false );
	}

	openAnimated( open = true ) {

		// set state immediately
		this._setClosed( !open );

		this.$title.setAttribute( 'aria-expanded', !this._closed );

		// wait for next frame to measure $children
		requestAnimationFrame( () => {

			// explicitly set initial height for transition
			const initialHeight = this.$children.clientHeight;
			this.$children.style.height = initialHeight + 'px';

			this.domElement.classList.add( 'transition' );

			const onTransitionEnd = e => {
				if ( e.target !== this.$children ) return;
				this.$children.style.height = '';
				this.domElement.classList.remove( 'transition' );
				this.$children.removeEventListener( 'transitionend', onTransitionEnd );
			};

			this.$children.addEventListener( 'transitionend', onTransitionEnd );

			// todo: this is wrong if children's scrollHeight makes for a gui taller than maxHeight
			const targetHeight = !open ? 0 : this.$children.scrollHeight;

			this.domElement.classList.toggle( 'closed', !open );

			requestAnimationFrame( () => {
				this.$children.style.height = targetHeight + 'px';
			} );

		} );

		return this;

	}

	/**
	 * Change the title of this GUI.
	 * @param {string} title
	 * @returns {this}
	 */
	title( title ) {
		/**
		 * Current title of the GUI. Use `gui.title( 'Title' )` to modify this value.
		 * @type {string}
		 */
		this._title = title;
		this.$title.textContent = title;
		return this;
	}

	/**
	 * Resets all controllers to their initial values.
	 * @param {boolean} recursive Pass false to exclude folders descending from this GUI.
	 * @returns {this}
	 */
	reset( recursive = true ) {
		const controllers = recursive ? this.controllersRecursive() : this.controllers;
		controllers.forEach( c => c.reset() );
		return this;
	}

	/**
	 * Pass a function to be called whenever a controller in this GUI changes.
	 * @param {function({object:object, property:string, value:any, controller:Controller})} callback
	 * @returns {this}
	 * @example
	 * gui.onChange( event => {
	 * 	event.object     // object that was modified
	 * 	event.property   // string, name of property
	 * 	event.value      // new value of controller
	 * 	event.controller // controller that was modified
	 * } );
	 */
	onChange( callback ) {
		/**
		 * Used to access the function bound to `onChange` events. Don't modify this value
		 * directly. Use the `gui.onChange( callback )` method instead.
		 * @type {Function}
		 */
		this._onChange = callback;
		return this;
	}

	_callOnChange( controller ) {

		if ( this.parent ) {
			this.parent._callOnChange( controller );
		}

		if ( this._onChange !== undefined ) {
			this._onChange.call( this, {
				object: controller.object,
				property: controller.property,
				value: controller.getValue(),
				controller
			} );
		}
	}

	/**
	 * Pass a function to be called whenever a controller in this GUI has finished changing.
	 * @param {function({object:object, property:string, value:any, controller:Controller})} callback
	 * @returns {this}
	 * @example
	 * gui.onFinishChange( event => {
	 * 	event.object     // object that was modified
	 * 	event.property   // string, name of property
	 * 	event.value      // new value of controller
	 * 	event.controller // controller that was modified
	 * } );
	 */
	onFinishChange( callback ) {
		/**
		 * Used to access the function bound to `onFinishChange` events. Don't modify this value
		 * directly. Use the `gui.onFinishChange( callback )` method instead.
		 * @type {Function}
		 */
		this._onFinishChange = callback;
		return this;
	}

	_callOnFinishChange( controller ) {

		if ( this.parent ) {
			this.parent._callOnFinishChange( controller );
		}

		if ( this._onFinishChange !== undefined ) {
			this._onFinishChange.call( this, {
				object: controller.object,
				property: controller.property,
				value: controller.getValue(),
				controller
			} );
		}
	}

	/**
	 * Pass a function to be called when this GUI or its descendants are opened or closed.
	 * @param {function(GUI)} callback
	 * @returns {this}
	 * @example
	 * gui.onOpenClose( changedGUI => {
	 * 	console.log( changedGUI._closed );
	 * } );
	 */
	onOpenClose( callback ) {
		this._onOpenClose = callback;
		return this;
	}

	_callOnOpenClose( changedGUI ) {
		if ( this.parent ) {
			this.parent._callOnOpenClose( changedGUI );
		}

		if ( this._onOpenClose !== undefined ) {
			this._onOpenClose.call( this, changedGUI );
		}
	}

	/**
	 * Destroys all DOM elements and event listeners associated with this GUI.
	 */
	destroy() {

		if ( this.parent ) {
			this.parent.children.splice( this.parent.children.indexOf( this ), 1 );
			this.parent.folders.splice( this.parent.folders.indexOf( this ), 1 );
		}

		if ( this.domElement.parentElement ) {
			this.domElement.parentElement.removeChild( this.domElement );
		}

		Array.from( this.children ).forEach( c => c.destroy() );

	}

	/**
	 * Returns an array of controllers contained by this GUI and its descendents.
	 * @returns {Controller[]}
	 */
	controllersRecursive() {
		let controllers = Array.from( this.controllers );
		this.folders.forEach( f => {
			controllers = controllers.concat( f.controllersRecursive() );
		} );
		return controllers;
	}

	/**
	 * Returns an array of folders contained by this GUI and its descendents.
	 * @returns {GUI[]}
	 */
	foldersRecursive() {
		let folders = Array.from( this.folders );
		this.folders.forEach( f => {
			folders = folders.concat( f.foldersRecursive() );
		} );
		return folders;
	}

}




/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var lil_gui__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! lil-gui */ "./node_modules/lil-gui/dist/lil-gui.esm.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/utils.ts");
/* harmony import */ var _shaders_render_wgsl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shaders/render.wgsl */ "./src/shaders/render.wgsl");
/* harmony import */ var _shaders_simulate_wgsl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shaders/simulate.wgsl */ "./src/shaders/simulate.wgsl");




const SCALE = 2; // Scale factor for the canvas size. determines texture resolution
const CANVAS_STRETCH = 2.0; // canvas size stretch factor
const MAX_TEX_SIZE = 1024;
const WORKGROUP_SIZE = 256;
// Sizes in bytes - useful for calculating buffer sizes and offsets
const sizes = {
    f32: 4,
    u32: 4,
    i32: 4,
    vec2: 8,
    vec4: 16,
};
// Uniform values container
const uniforms = {
    computeStepsPerFrame: 20,
    targetFPS: 120,
    actinCount: 40000, // 4000 is minimum for nice action.
    membraneCount: 200,
    onlyBindWhenAngle: 0.01,
    foodNearbyThreshold: 0.01,
    unbindProb: 0.016,
    polymerRepulsion: 0.422,
    membraneCohesionRange: 16,
    actinCohesionRange: 1,
    startsNucleatedProb: 0.03,
    actinSensorRandomOffset: 0.5, // lower looks neater, but results in parallel-to-membrane polymers
    actinStericForce: 0.5,
    membraneTension: 8.4,
    foodSpawnArea: 0.77,
};
const controlsBufferSize = 60; // Updated to match WGSL struct padded size
const controlsBufferData = new ArrayBuffer(controlsBufferSize);
const controlsDataView = new DataView(controlsBufferData);
async function index() {
    // setup and configure WebGPU
    const device = await (0,_utils__WEBPACK_IMPORTED_MODULE_0__.requestDevice)();
    const canvas = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.configureCanvas)(device);
    // set time to a random int between 0 and 1000
    let time = Math.floor(Math.random() * 1000);
    console.log("Time: ", time);
    // TEXTURELOADINGINGNIGINIGNG ---- START
    const artisticTexture = device.createTexture({
        size: [MAX_TEX_SIZE, MAX_TEX_SIZE],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    // create a sampler for the texture
    const sampler = device.createSampler({
        addressModeU: "repeat",
        addressModeV: "repeat",
        magFilter: "linear",
        minFilter: "linear",
        mipmapFilter: "linear",
    });
    // TEXTURELOADINGINGNIGINIGNG ---- END
    const width = MAX_TEX_SIZE / SCALE; // canvas.size.width / SCALE;
    // After configuring the canvas, resize it to match texture resolution
    canvas.canvas.width = width * CANVAS_STRETCH;
    canvas.canvas.height = width * CANVAS_STRETCH;
    canvas.canvas.style.width = width * CANVAS_STRETCH + "px";
    canvas.canvas.style.height = width * CANVAS_STRETCH + "px";
    canvas.canvas.style.maxWidth = "97vh";
    canvas.canvas.style.maxHeight = "97vh";
    const textures = { size: { width: Math.ceil(width), height: Math.ceil(width) } };
    const TEXTURE_WORKGROUP_COUNT = [
        Math.ceil(textures.size.width / Math.sqrt(WORKGROUP_SIZE)),
        Math.ceil(textures.size.height / Math.sqrt(WORKGROUP_SIZE)),
    ];
    const texturesRendering = { size: { width: Math.ceil(width), height: Math.ceil(width) } };
    const BUFFER_WORKGROUP_COUNT_ACTIN = Math.ceil(uniforms.actinCount / WORKGROUP_SIZE);
    const BUFFER_WORKGROUP_COUNT_MEMBRANE = Math.ceil(uniforms.membraneCount / WORKGROUP_SIZE);
    /////////////////////////
    // Set up memory resources
    const visibility = GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT;
    const { querySet, resolveBuffer, resultBuffer } = await (0,_utils__WEBPACK_IMPORTED_MODULE_0__.createPerformanceQueries)(device);
    // Create storage textures
    const storageTextures = device.createTexture({
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
        label: "storageTextures",
        format: "r32float",
        size: {
            width: textures.size.width,
            height: textures.size.height,
            depthOrArrayLayers: 11,
        },
    });
    const storageTexturesRendering = device.createTexture({
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
        label: "storageTexturesRendering",
        format: "r32float",
        size: {
            width: textures.size.width,
            height: textures.size.height,
            depthOrArrayLayers: 6,
        },
    });
    const storageTexturesLayout = device.createBindGroupLayout({
        label: "storageTexturesLayout",
        entries: [
            {
                visibility,
                binding: 0,
                storageTexture: {
                    access: "read-write",
                    format: "r32float",
                    viewDimension: "2d-array",
                },
            },
            { visibility, binding: 1, texture: {} },
            { visibility, binding: 2, sampler: {} },
            {
                visibility,
                binding: 3,
                storageTexture: {
                    access: "read-write",
                    format: "r32float",
                    viewDimension: "2d-array",
                },
            },
        ],
    });
    const storageTexturesBindGroup = device.createBindGroup({
        label: "storageTexturesBindGroup",
        layout: storageTexturesLayout,
        entries: [
            { binding: 0, resource: storageTextures.createView() },
            { binding: 1, resource: artisticTexture.createView() },
            { binding: 2, resource: sampler },
            { binding: 3, resource: storageTexturesRendering.createView() },
        ],
    });
    // Uniform buffers
    const canvasBuffer = device.createBuffer({
        label: "Canvas Uniform Buffer",
        size: 16, // size (vec2<i32> = 8) + time (f32 = 4) + padding = 16
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    const controlsBuffer = device.createBuffer({
        label: "Controls Uniform Buffer",
        size: controlsBufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    // setup interactions
    const interactions = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.setupInteractions)(device, canvas.context.canvas, textures.size);
    const uniformsLayout = device.createBindGroupLayout({
        entries: [
            { visibility, binding: 0, buffer: { type: "uniform" } },
            { visibility, binding: 1, buffer: { type: "uniform" } },
            { visibility, binding: 2, buffer: { type: "uniform" } },
        ],
    });
    const uniformsBindGroup = device.createBindGroup({
        label: "Uniforms Bind Group",
        layout: uniformsLayout,
        entries: [
            { binding: 0, resource: { buffer: canvasBuffer } },
            { binding: 1, resource: { buffer: controlsBuffer } },
            { binding: 2, resource: { buffer: interactions.buffer } },
        ],
    });
    // Function to write the uniforms object into the ArrayBuffer according to WGSL struct layout
    const writeUniforms = () => {
        // Write canvas size and time
        const canvasData = new ArrayBuffer(16); // Use padded size
        const canvasView = new DataView(canvasData);
        canvasView.setInt32(0, textures.size.width, true);
        canvasView.setInt32(4, textures.size.height, true);
        canvasView.setFloat32(8, time, true); // Write time here
        // Bytes 12-15 are padding
        device.queue.writeBuffer(canvasBuffer, 0, canvasData);
        // Write controls with adjusted offsets:
        controlsDataView.setUint32(0, uniforms.membraneCount, true); // offset 0: membraneCount
        controlsDataView.setUint32(4, uniforms.actinCount, true); // offset 4: actinCount
        controlsDataView.setFloat32(8, uniforms.onlyBindWhenAngle, true); // offset 8: separateStrength
        controlsDataView.setFloat32(12, uniforms.foodNearbyThreshold, true); // offset 12: cohesionStrength
        controlsDataView.setFloat32(16, uniforms.unbindProb, true); // offset 16: directionStrength
        controlsDataView.setFloat32(20, uniforms.polymerRepulsion, true); // offset 20: polymerRepulsion
        controlsDataView.setInt32(24, uniforms.membraneCohesionRange, true); // offset 24: membraneCohesionRange
        controlsDataView.setInt32(28, uniforms.actinCohesionRange, true); // offset 28: actinCohesionRange
        controlsDataView.setFloat32(32, uniforms.startsNucleatedProb, true); // offset 32: angle
        controlsDataView.setFloat32(36, uniforms.actinSensorRandomOffset, true); // offset 36: nSensors
        controlsDataView.setFloat32(40, uniforms.actinStericForce, true); // offset 40: speed
        controlsDataView.setFloat32(44, uniforms.membraneTension, true); // offset 44: pheromoneDeposal
        controlsDataView.setFloat32(48, uniforms.foodSpawnArea, true); // offset 48: stigmergyBlurStrength
        device.queue.writeBuffer(controlsBuffer, 0, controlsBufferData);
    };
    writeUniforms();
    const membraneBuffer = device.createBuffer({
        size: sizes.vec2 * 2 * uniforms.membraneCount, // vec2 * 2 for position and direction
        usage: GPUBufferUsage.STORAGE,
    });
    const actinesBUffer = device.createBuffer({
        size: (sizes.f32 + sizes.vec2 * 3) * uniforms.actinCount, // vec2 * 3 for position and direction, neighbors
        usage: GPUBufferUsage.STORAGE,
    });
    // Add the connection locks buffer
    const actinConnectionLocksBuffer = device.createBuffer({
        label: "Actin Connection Locks Buffer",
        size: sizes.i32 * uniforms.actinCount, // One atomic<i32> per actin
        usage: GPUBufferUsage.STORAGE,
    });
    const agentsLayout = device.createBindGroupLayout({
        label: "agentsLayout",
        entries: [
            { visibility, binding: 0, buffer: { type: "storage" } },
            { visibility, binding: 1, buffer: { type: "storage" } },
            { visibility, binding: 2, buffer: { type: "storage" } },
        ],
    });
    const agentsBindGroup = device.createBindGroup({
        label: "agents bindgroup",
        layout: agentsLayout,
        entries: [
            { binding: 0, resource: { buffer: membraneBuffer } },
            { binding: 1, resource: { buffer: actinesBUffer } },
            { binding: 2, resource: { buffer: actinConnectionLocksBuffer } },
        ],
    });
    /////
    // Overall memory layout
    const layout = device.createPipelineLayout({
        bindGroupLayouts: [storageTexturesLayout, uniformsLayout, agentsLayout],
    });
    // Create a separate layout for the render pipeline
    const renderPipelineLayout = device.createPipelineLayout({
        label: "Render Pipeline Layout",
        bindGroupLayouts: [storageTexturesLayout, uniformsLayout],
    });
    /////////////////////////
    // Set up code instructions
    const module = await (0,_utils__WEBPACK_IMPORTED_MODULE_0__.createShader)(device, _shaders_simulate_wgsl__WEBPACK_IMPORTED_MODULE_2__);
    const resetActinPipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "reset_actin" },
    });
    const resetMembranePipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "reset_membrane" },
    });
    const membranePipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "update_membrane" },
    });
    const actinBindPipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "bind_actin_monomer" },
    });
    const actinPolymerPositionPipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "update_actin_polymer_position" },
    });
    const actinMonomerPositionPipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "update_actin_monomer_position" },
    });
    const unbindMinPolePipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "unbind_minus_end" },
    });
    const membraneToTexturesPipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "membrane_to_textures" },
    });
    const actinesToTexturesPipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "actines_to_textures" },
    });
    const clearTexturesPipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "clear_textures" },
    });
    const texturesPipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "update_textures" },
    });
    const consolidateTexturesPipeline = device.createComputePipeline({
        layout,
        compute: { module, entryPoint: "consolidate_textures" },
    });
    // Traditional render pipeline of vert -> frag
    const renderModule = await (0,_utils__WEBPACK_IMPORTED_MODULE_0__.createShader)(device, _shaders_render_wgsl__WEBPACK_IMPORTED_MODULE_1__);
    const renderPipeline = device.createRenderPipeline({
        label: "Render Pipeline",
        layout: renderPipelineLayout,
        vertex: {
            module: renderModule,
            entryPoint: "vert",
        },
        fragment: {
            module: renderModule,
            entryPoint: "frag",
            targets: [{ format: canvas.format }], // Stage 1 renders to intermediate texture
        },
        primitive: {
            topology: "triangle-list",
        },
    });
    /////////////////////////
    // RUN the reset shader function
    const reset = () => {
        // Uniforms are potentially changed by GUI before reset, so write them.
        writeUniforms();
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        pass.setBindGroup(0, storageTexturesBindGroup);
        pass.setBindGroup(1, uniformsBindGroup);
        pass.setBindGroup(2, agentsBindGroup);
        pass.setPipeline(resetActinPipeline);
        pass.dispatchWorkgroups(BUFFER_WORKGROUP_COUNT_ACTIN);
        pass.setPipeline(resetMembranePipeline);
        pass.dispatchWorkgroups(BUFFER_WORKGROUP_COUNT_MEMBRANE);
        pass.end();
        device.queue.submit([encoder.finish()]);
    };
    reset();
    var avgTime = 0;
    const framesPerTimeLog = 30;
    const gpuTimeDisplay = document.getElementById("gpuTime");
    const fpsDisplay = document.getElementById("fpsCounter");
    let lastTime = performance.now();
    let frameCount = 0;
    let totalGpuTime = 0;
    let measurementCount = 0;
    // RUN the sim compute function and render pixels
    function timestep() {
        time++;
        device.queue.writeBuffer(canvasBuffer, 8, new Float32Array([time]).buffer);
        device.queue.writeBuffer(interactions.buffer, 0, interactions.data);
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass({
            ...(querySet && {
                timestampWrites: {
                    querySet,
                    beginningOfPassWriteIndex: 0,
                    endOfPassWriteIndex: 1,
                },
            }),
        });
        pass.setBindGroup(0, storageTexturesBindGroup);
        pass.setBindGroup(1, uniformsBindGroup);
        pass.setBindGroup(2, agentsBindGroup);
        for (let i = 0; i < uniforms.computeStepsPerFrame; i++) {
            pass.setPipeline(clearTexturesPipeline);
            pass.dispatchWorkgroups(...TEXTURE_WORKGROUP_COUNT);
            pass.setPipeline(membranePipeline);
            pass.dispatchWorkgroups(BUFFER_WORKGROUP_COUNT_MEMBRANE);
            pass.setPipeline(actinBindPipeline);
            pass.dispatchWorkgroups(BUFFER_WORKGROUP_COUNT_ACTIN);
            pass.setPipeline(actinPolymerPositionPipeline);
            pass.dispatchWorkgroups(BUFFER_WORKGROUP_COUNT_ACTIN);
            pass.setPipeline(actinMonomerPositionPipeline);
            pass.dispatchWorkgroups(BUFFER_WORKGROUP_COUNT_ACTIN);
            pass.setPipeline(unbindMinPolePipeline);
            pass.dispatchWorkgroups(BUFFER_WORKGROUP_COUNT_ACTIN);
            pass.setPipeline(membraneToTexturesPipeline);
            pass.dispatchWorkgroups(BUFFER_WORKGROUP_COUNT_MEMBRANE);
            pass.setPipeline(actinesToTexturesPipeline);
            pass.dispatchWorkgroups(BUFFER_WORKGROUP_COUNT_ACTIN);
            pass.setPipeline(texturesPipeline);
            pass.dispatchWorkgroups(...TEXTURE_WORKGROUP_COUNT);
            // pass.setPipeline(consolidateTexturesPipeline);
            // pass.dispatchWorkgroups(...TEXTURE_WORKGROUP_COUNT);
        }
        pass.end();
        encoder.resolveQuerySet(querySet, 0, querySet.count, resolveBuffer, 0);
        if (resultBuffer.mapState === "unmapped") {
            encoder.copyBufferToBuffer(resolveBuffer, 0, resultBuffer, 0, resultBuffer.size);
        }
        // Finally, run the render pass
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: canvas.context.getCurrentTexture().createView(),
                    loadOp: "load", // Load existing content from stage 1
                    storeOp: "store",
                },
            ],
        });
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(0, storageTexturesBindGroup);
        renderPass.setBindGroup(1, uniformsBindGroup);
        renderPass.draw(6, 1, 0, 0);
        renderPass.end();
        device.queue.submit([encoder.finish()]);
        // TIME BENCHMARKING
        if (resultBuffer.mapState === "unmapped") {
            resultBuffer.mapAsync(GPUMapMode.READ).then(() => {
                const times = new BigInt64Array(resultBuffer.getMappedRange());
                const gpuTime = Number(times[1] - times[0]) / 1_000_000;
                totalGpuTime += gpuTime;
                measurementCount++;
                resultBuffer.unmap();
            });
        }
        // GPU performance section
        if (time % framesPerTimeLog == 0) {
            const currentTime = performance.now();
            const timeElapsed = currentTime - lastTime;
            // GPU Timing - only update if we have measurements
            if (measurementCount > 0) {
                const avgGpuTime = (totalGpuTime / measurementCount).toFixed(3);
                gpuTimeDisplay.textContent = `GPU Time: ${avgGpuTime} ms`;
                // Reset GPU timing accumulators
                totalGpuTime = 0;
                measurementCount = 0;
            }
            // FPS Calculation
            const fps = Math.round((frameCount * 1000) / timeElapsed);
            fpsDisplay.textContent = `FPS: ${fps}`;
            // Reset counters
            frameCount = 0;
            lastTime = currentTime;
        }
        // Increment frame counter
        frameCount++;
    }
    let gui = new lil_gui__WEBPACK_IMPORTED_MODULE_3__["default"]();
    gui.add(uniforms, "computeStepsPerFrame").min(1).max(75).step(1).name("Compute Steps");
    gui.add(uniforms, "targetFPS").min(1).max(120).step(1).name("Target FPS");
    gui.add(uniforms, "onlyBindWhenAngle").min(0.000000001).max(4.0).name("Only Bind When Angle");
    gui.add(uniforms, "foodNearbyThreshold").min(0.0000001).max(1.0).name("Food Nearby Threshold");
    gui.add(uniforms, "unbindProb").min(0).max(0.999).name("unbind probability");
    gui.add(uniforms, "membraneCohesionRange").min(1).max(50).step(1).name("Membrane Cohesion Range");
    gui.add(uniforms, "actinCohesionRange").min(1).max(100).step(1).name("Actin Cohesion Range");
    gui.add(uniforms, "startsNucleatedProb").min(0.0).max(0.1).step(0.001).name("Actin starts as polymer");
    gui.add(uniforms, "actinStericForce").min(0.0).max(1.0).name("Actin Steric Force");
    gui.add(uniforms, "membraneTension").min(0.3).max(30.0).name("Membrane Tension");
    gui.add(uniforms, "foodSpawnArea").min(0.0).max(1.0).name("Food Spawn Area");
    gui.add(uniforms, "polymerRepulsion").min(0.0).max(1.0).name("Polymer Repulsion");
    gui.add(uniforms, "actinSensorRandomOffset").min(0.0).max(1.0).name("Actin Sensor Random Offset");
    gui.add({ executeFunction: reset }, "executeFunction").name("Reset Simulation");
    gui.onChange(writeUniforms); // Write all uniforms to buffer on any GUI change
    gui.close();
    let lastFrameTime = 0;
    const getFrameInterval = () => 1000 / uniforms.targetFPS; // Convert FPS to milliseconds
    function frame(currentTime) {
        // Check if enough time has passed based on target FPS
        if (currentTime - lastFrameTime >= getFrameInterval()) {
            timestep();
            lastFrameTime = currentTime;
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return;
}
index();


/***/ }),

/***/ "./src/shaders/render.wgsl":
/*!*********************************!*\
  !*** ./src/shaders/render.wgsl ***!
  \*********************************/
/***/ ((module) => {

module.exports = "struct VertexOutput {\n    @builtin(position) Position : vec4f,\n    @location(0) fragUV : vec2f,\n}\n\n@vertex\nfn vert(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {\n    const pos = array(\n        vec2( 1.0,  1.0),\n        vec2( 1.0, -1.0),\n        vec2(-1.0, -1.0),\n        vec2( 1.0,  1.0),\n        vec2(-1.0, -1.0),\n        vec2(-1.0,  1.0),\n    );\n\n    const uv = array(\n        vec2(1.0, 0.0),\n        vec2(1.0, 1.0),\n        vec2(0.0, 1.0),\n        vec2(1.0, 0.0),\n        vec2(0.0, 1.0),\n        vec2(0.0, 0.0),\n    );\n\n    var output : VertexOutput;\n    output.Position = vec4(pos[VertexIndex], 0.0, 1.0);\n    output.fragUV = uv[VertexIndex];\n    return output;\n}\n\nstruct Canvas {\n    size: vec2<i32>\n}\n\n\nstruct Interactions {\n    position: vec2<f32>,\n    size: f32,\n};\n\nconst STIGMERGYMONOMER = 0;\nconst STIGMERGYPOLYMER = 1;\nconst STIGMERGYMEMBRANE = 2;\nconst AGENTINDEX = 3;\nconst LIFETIME = 4;\nconst ACTININDEX = 5;\nconst MEMBRANEFOODSIGNAL = 6;\nconst DEBUG = 7;\nconst TIMESIGNAL = 8;\nconst STIGMERGYGRADIENT = 9;\n\n\n// Textures\n@group(0) @binding(0)  \n  var storageTextures: texture_storage_2d_array<r32float, read_write>;\n\n// Uniforms\n@group(1) @binding(0) \n  var<uniform> canvas: Canvas;\n\n@group(1) @binding(2)\n  var<uniform> interactions: Interactions; // for user interactions, like mouse position or touch input\n\n\n@fragment\nfn frag(@location(0) uv : vec2f) -> @location(0) vec4f {\n    let x = vec2<i32>(uv * vec2<f32>(canvas.size));\n\n    let stigmergyMo = textureLoad(storageTextures, x, STIGMERGYMONOMER).r;\n    let stigmergyPo = textureLoad(storageTextures, x, STIGMERGYPOLYMER).r;\n    let stigmergyMe = textureLoad(storageTextures, x, STIGMERGYMEMBRANE).r;\n    let idx = textureLoad(storageTextures, x, AGENTINDEX).r;\n    var debug = textureLoad(storageTextures, x, DEBUG).r;\n    var lifetime = textureLoad(storageTextures, x, LIFETIME).r ;\n    let foodsignal = textureLoad(storageTextures, x, MEMBRANEFOODSIGNAL).r;\n    let timesignal = textureLoad(storageTextures, x, TIMESIGNAL).r;\n\n    var color = vec4(0.0, 0.0, 0.0, 1.0);\n    if (idx > 0.0){\n        // BLEND in timesignal color for stigmergyPo and stigmergyMO\n        if (stigmergyPo > 0.1 || stigmergyMo > 0.1) {\n            let timesignalColor = vec4(0, timesignal * 0.5, 0.0, 1.0) * 0.5;\n            color += timesignalColor;\n        }\n        if (stigmergyPo > 0.1) {\n            // subtract with the timesignal\n            let randomSample = 0.4+random_uniform(idx)*0.6;\n            color += randomSample*vec4(1.0 - clamp(timesignal/6, 0, 0.9)/4, 0.0, 0.0, 1.0);\n        }\n        else if (stigmergyMo > 0.1) {\n            let randomSample = 0.4+random_uniform(idx)*0.6;\n            color += randomSample*vec4(0.0, 0.7, 0.0, 1.0);\n        }\n        if (stigmergyMe > 0.1 && idx > 0.0) {\n            let randomSample = 0.4+random_uniform(idx)*0.6;\n            color = randomSample*vec4(0.2, 0.6, 1.0, 1.0);\n        }\n    }\n\n    let gradient = textureLoad(storageTextures, x, STIGMERGYGRADIENT).r;\n    let sigmoid_gradient = 1.0 / (1.0 + exp(-(gradient+0.0000001) * 4.0));\n    color += vec4(0, 0, gradient*0.5, 1.0) * 0.05;\n\n    lifetime = select(0.0, lifetime, foodsignal > 0.001);\n    color = color + debug + lifetime*0.5;\n    return color;\n}\n\nfn index_to_rainbow(idx: f32) -> vec4f {\n    if idx == 0.0 {\n        return vec4(0.0, 0.0, 0.0, 1.0);\n    }\n    let r = 0.5 + 0.5 * sin(idx * 0.1 + 0.0);\n    let g = 0.5 + 0.5 * sin(idx * 0.1 + 2.094);\n    let b = 0.5 + 0.5 * sin(idx * 0.1 + 4.188);\n    return vec4(r, g, b, 1.0);\n}\nfn even_uneven(idx: f32) -> vec4f {\n    if idx == 0.0 {\n        return vec4(0.0, 0.0, 0.0, 1.0);\n    }\n    if (idx % 2.0 == 0.0) {\n        return vec4(1.0, 0.0, 0.0, 1.0);\n    }\n    return vec4(0, 1, 0, 1.0);\n}\n\n// A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm for u32.\nfn hash_u32(x_in: u32) -> u32 {\n    var x = x_in;\n    x += (x << 10u);\n    x ^= (x >> 6u);\n    x += (x << 3u);\n    x ^= (x >> 11u);\n    x += (x << 15u);\n    return x;\n}\n\n// Compound hashing algorithms for vectors.\nfn hash_vec2u(v: vec2u) -> u32 {\n    return hash_u32(v.x ^ hash_u32(v.y));\n}\n\nfn hash_vec3u(v: vec3u) -> u32 {\n    return hash_u32(v.x ^ hash_u32(v.y) ^ hash_u32(v.z));\n}\n\nfn hash_vec4u(v: vec4u) -> u32 {\n    return hash_u32(v.x ^ hash_u32(v.y) ^ hash_u32(v.z) ^ hash_u32(v.w));\n}\n\n// Construct a float with half-open range [0:1] using low 23 bits.\n// All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.\nfn float_construct_from_u32(m_in: u32) -> f32 {\n    let ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask\n    let ieeeOne = 0x3F800000u;      // 1.0 in IEEE binary32\n\n    var m = m_in;\n    m &= ieeeMantissa;              // Keep only mantissa bits (fractional part)\n    m |= ieeeOne;                   // Add fractional part to 1.0\n\n    let f = bitcast<f32>(m);        // Range [1:2]\n    return f - 1.0;                 // Range [0:1]\n}\n\n// Pseudo-random value in half-open range [0:1] from a f32 seed.\nfn random_uniform(seed: f32) -> f32 {\n    return float_construct_from_u32(hash_u32(bitcast<u32>(seed)));\n}";

/***/ }),

/***/ "./src/shaders/simulate.wgsl":
/*!***********************************!*\
  !*** ./src/shaders/simulate.wgsl ***!
  \***********************************/
/***/ ((module) => {

module.exports = "struct Membrane {\n  position: vec2f,\n  orientation: vec2f,\n}\n\nstruct Actin {\n  position: vec2f,\n  orientation: vec2f,\n  upstream: i32,\n  downstream: i32,\n  timer: f32, \n}\n\nstruct Canvas {\n  size: vec2<i32>,\n  time: f32,\n}\n\nstruct NeighborStruct {\n  idx: i32,\n  distance: f32,\n}\n\n// Define the Controls struct matching TypeScript layout\nstruct Controls {    \n    membraneCount: u32,        // offset 0, size 4, align 4\n    actinCount: u32,           // offset 4, size 4, align 4\n    onlyBindWhenAngle: f32,     // offset 8, size 4, align 4\n    foodNearbyThreshold: f32,     // offset 12, size 4, align 4\n    unbindProb: f32,          // offset 16, size 4, align 4\n    polymerRepulsion: f32,        // offset 20, size 4, align 4\n    membraneCohesionRange: i32,// offset 24, size 4, align 4\n    actinCohesionRange: i32,   // offset 28, size 4, align 4\n    startsNucleatedProb: f32,  // offset 32, size 4, align 4\n    actinSensorRandomOffset: f32,             // offset 36, size 4, align 4\n    actinStericForce: f32,                // offset 40, size 4, align 4\n    membraneTension: f32,     // offset 44, size 4, align 4\n    foodSpawnArea: f32,// offset 48, size 4, align 4\n                               // Total size = 52 bytes. Padded size = 60 bytes.\n}\n\nstruct Interactions {\n    position: vec2<f32>,\n    size: f32,\n};\n\n// Textures\n@group(0) @binding(0)  \n  var storageTextures: texture_storage_2d_array<r32float, read_write>;\n@group(0) @binding(1)  \n  var artisticTexture: texture_2d<f32>; // for artistic effects, not used in simulation\n@group(0) @binding(3)  \n  var storageTexturesRendering: texture_storage_2d_array<r32float, read_write>;\n\n\n// Uniforms\n@group(1) @binding(0) \n  var<uniform> canvas: Canvas;\n\n@group(1) @binding(1)\n  var<uniform> controls: Controls;\n\n@group(1) @binding(2)\n  var<uniform> interactions: Interactions; // for user interactions, like mouse position or touch input\n\n// Other buffers\n@group(2) @binding(0)  \n  var<storage, read_write> membrane : array<Membrane>;\n\n@group(2) @binding(1)\n  var<storage, read_write> actines : array<Actin>;\n\n// for actin connection locking\n@group(2) @binding(2)\nvar<storage, read_write> connectionLocks: array<atomic<i32>>;\n\nconst STIGMERGYMONOMER = 0;\nconst STIGMERGYPOLYMER = 1;\nconst STIGMERGYMEMBRANE = 2;\nconst AGENTINDEX = 3;\nconst LIFETIME = 4;\nconst ACTININDEX = 5;\nconst MEMBRANEFOODSIGNAL = 6;\nconst DEBUG = 7;\nconst TIMESIGNAL = 8;\nconst STIGMERGYGRADIENT = 9;\n\nconst DX = vec2i(1, 0);\nconst DY = vec2i(0, 1);\nconst UNCONNECTED = -1;\nconst PI = 3.14159265358979323846;\n\nconst R = 0;\nconst G = 1;\nconst B = 2;\n\nconst RENDERSMOOTHNESS = 0.999;\nconst EPS = 1e-37;\n\nfn normalize_safely(x: vec2<f32>) -> vec2<f32> {\n  return x / max(length(x), EPS);\n}\n\nfn as_r32float(r: f32) -> vec4<f32> {\n    return vec4<f32>(f32(r), 0.0, 0.0, 1.0);\n}\n\nfn load_texture(F: i32, p: vec2<i32>) -> f32 {\n  let q = p + canvas.size;\n  return textureLoad(storageTextures, q  % canvas.size, F).r;\n}\n\nfn store_texture(F: i32, p: vec2<i32>, value: f32) {\n  let q = p + canvas.size;\n  textureStore(storageTextures, q  % canvas.size, F, as_r32float(value));\n}\n\nfn store_texture_float(F: i32, p: vec2<f32>, value: f32) {\n  let q = vec2<i32>(p + (0.5 - fract(p)));\n  store_texture(F, q, value);\n}\n\nfn load_texture_float(F: i32, p: vec2<f32>) -> f32 {\n  let q = vec2<i32>(p + (0.5 - fract(p)));\n  return load_texture(F, q);\n}\n\nfn gaussian_blur(p: vec2<i32>, texture: i32, spreadAmt: f32) -> f32 {\n  return ( \n    2.0 * (  // adjacents\n      load_texture(texture, p + DX) + load_texture(texture, p - DX) + load_texture(texture, p + DY) + load_texture(texture, p - DY)\n    ) + (  // diagonals\n      load_texture(texture, p + DX + DY) + load_texture(texture, p + DX - DY) + load_texture(texture, p - DX + DY) + load_texture(texture, p - DX - DY)\n    ) + 8.0 *(  // center\n      load_texture(texture, p)\n    )\n  ) / (20.0 - spreadAmt);\n}\n\nfn spread_actin_index(p: vec2<i32>) {\n  let actinIndex = load_texture(ACTININDEX, p);\n  if (actinIndex <= 0.0) {\n    return;\n  }\n\n  var adjacents = array<vec2<i32>, 8>(DY,DX + DY,DX,DX - DY,-DY,-DX - DY,-DX,-DX + DY);\n\n  // shuffle because race conditions introduce a bias\n  for (var i = 7; i > 0; i--) {\n    let random = random_uniform(f32(actinIndex) + f32(i) + canvas.time);\n    let j = i32(random * f32(i + 1));\n    // Swap elements\n    let temp = adjacents[i];\n    adjacents[i] = adjacents[j];\n    adjacents[j] = temp;\n  }\n\n  // Loop through adjacent pixels\n  for (var i = 0; i < 8; i++) {\n    let adjacent_pos = p + adjacents[i];\n    store_texture(ACTININDEX, adjacent_pos, actinIndex);\n  }\n}\n\nfn line_force_membrane(idx: i32) -> Membrane {\n  let count = i32(controls.membraneCount);\n  var membrane_segment = membrane[idx];\n\n  let upstream = membrane[(idx + 1 + count) % count];\n  let downstream = membrane[(idx - 1 + count) % count];\n\n  let x = upstream.position - membrane_segment.position;\n  let y = downstream.position - membrane_segment.position;\n\n  membrane_segment.orientation = normalize_safely(upstream.position - downstream.position);\n  membrane_segment.position += 0.5 * (normalize_safely(x) * (length(x) - 1 / controls.membraneTension) + normalize_safely(y) * (length(y) -  1 / controls.membraneTension));\n\n  return membrane_segment;\n}\n\n@compute @workgroup_size(256)\nfn update_membrane(@builtin(global_invocation_id) id : vec3u) {\n  let count = i32(controls.membraneCount);\n\n  let idx = i32(id.x);\n  if (idx >= count) {\n    return;\n  }\n  \n  var agent = membrane[idx];\n  let p = agent.position;\n\n  let tangent = agent.orientation;\n  let normal = vec2<f32>(-tangent.y, tangent.x);\n\n  // strong line forces\n  agent = line_force_membrane(idx);\n\n  // weak steric forces\n  let range = f32(controls.membraneCohesionRange)*2.0;\n  var stericForce = vec2<f32>(0.0, 0.0);\n  for (var t = -1.0; t <= 1.0; t += 1.0) {  // easier debugg. was -5, 5\n    for (var n = 1.0*range; n <= 1.0*range; n += 1.0*range) {  // easier debugg. was 1, 5\n      stericForce += 2.0*(load_texture_float(STIGMERGYPOLYMER, p + t * tangent + n * normal) - load_texture_float(STIGMERGYPOLYMER, p + t * tangent - n * normal) );\n    }\n  }\n\n  var force = 0.07 * -normal * stericForce;\n  agent.position += force;\n\n  // update agent\n  membrane[idx] = agent;\n}\n\nfn isMonomer(actin: Actin) -> bool {\n  return actin.upstream == UNCONNECTED && actin.downstream == UNCONNECTED;\n}\n\nfn isPlusEnd(actin: Actin) -> bool {\n  return actin.upstream >= 0 && actin.downstream == UNCONNECTED;\n}\n\nfn isMinusEnd(actin: Actin) -> bool {\n  return actin.upstream == UNCONNECTED && actin.downstream >= 0;\n}\n\nfn isPolymer(actin: Actin) -> bool {\n  return actin.upstream >= 0 || actin.downstream >= 0;\n}\n\nfn isPolymerStrict(actin: Actin) -> bool {\n  // means it's not a plus or min end of the polymer\n  return actin.upstream >= 0 && actin.downstream >= 0;\n}\nfn isPlusEndOfTwo(actin: Actin) -> bool {\n  // Used to let polymers of 2 behave like 1 monomer (for better diffusion)\n  // adds complexity, but will leave in until something better is found\n  // it's the plus end of a polymer of length 2\n  if (isPlusEnd(actin) && actines[actin.upstream].upstream == UNCONNECTED) {\n    return true;\n  }\n  return false;\n}\n\nfn isMinusEndOfTwo(actin: Actin) -> bool {\n  // Used to let polymers of 2 behave like 1 monomer (for better diffusion)\n  // adds complexity, but will leave in until something better is found\n  // it's the minus end of a polymer of length 2\n  if (isMinusEnd(actin) && actines[actin.downstream].downstream == UNCONNECTED) {\n    return true;\n  }\n  return false;\n}\n\n@compute @workgroup_size(256)\nfn update_actin_monomer_position(@builtin(global_invocation_id) id : vec3u) {\n  let idx = i32(id.x);\n  let actin = actines[idx];\n\n  if (isPolymer(actin) && !isMinusEndOfTwo(actin) && !isPlusEndOfTwo(actin)) {\n    return;\n  }\n\n  let p = actines[idx].position;\n  let tangent = actines[idx].orientation;\n  let normal = vec2<f32>(-tangent.y, tangent.x);\n\n  // weak steric forcess\n  let range = f32(controls.actinCohesionRange);\n  var stericForce = vec2<f32>(0.0);\n  let membraneSignal = load_texture_float(STIGMERGYMEMBRANE, p) * 3.0;\n  // choose either this one or the next. both are nice\n  let actinRepulsionScale = 0.2 + 0.8 * exp(-membraneSignal * 1000.0);\n  // let actinRepulsionScale = select(1.0, 0.2, membraneSignal/3.0 > 0.0001);\n  \n  for (var t = -2.0*range; t <= 2.0*range; t += 1.0*range) {  \n    for (var n = -2.0*range; n <= 2.0*range; n += 1.0*range) { \n      let sample_pos = p + t * tangent + n * normal;\n      let densityMO = load_texture_float(STIGMERGYMONOMER, sample_pos) * 0.4;\n      let densityME = load_texture_float(STIGMERGYMEMBRANE, sample_pos) * 3.0;\n  \n      var density = densityME + densityMO*0.4;\n      let direction = normalize_safely(p - sample_pos);\n\n      // steer towards highest lifetime density\n      let lifetimeDensity = load_texture_float(LIFETIME, sample_pos);\n      let foodSignal = load_texture_float(MEMBRANEFOODSIGNAL, sample_pos);\n      let moveCondition = lifetimeDensity > 0.3 && foodSignal > controls.foodNearbyThreshold;\n      // stericForce -= select(vec2<f32>(0.0), normalize_safely(p - sample_pos) * lifetimeDensity * 1.0, moveCondition);\n      stericForce -= select(vec2<f32>(0.0), direction * lifetimeDensity, moveCondition) *0.5;\n      // Repulsion force - reduced actin repulsion near membrane\n      stericForce += select(vec2<f32>(0.0), direction * densityMO * actinRepulsionScale, densityMO > 0.0);\n      stericForce += select(vec2<f32>(0.0), direction * densityME, densityME > 0.0);\n    }\n  }\n\n  // go into the direction of the orientation texture\n  // Apply forces - steric force for avoidance, orientation for directed movement\n  actines[id.x].position += controls.actinStericForce * stericForce;\n}\n\n@compute @workgroup_size(256)\nfn update_actin_polymer_position(@builtin(global_invocation_id) id : vec3u) {\n  let idx = i32(id.x);\n  let actin = actines[idx];\n\n  if (isMonomer(actin) || isMinusEndOfTwo(actin) || isPlusEndOfTwo(actin)) {\n    return;\n  }\n\n  let p = actin.position;\n  let tangent = actin.orientation;\n  let normal = vec2<f32>(-tangent.y, tangent.x);\n\n  // weak steric forcess\n  let range = f32(controls.actinCohesionRange) * 3.0;\n  var stericForce = vec2<f32>(0.0);\n  \n  // Sample in a circle pattern\n  let sampleCount = 8; \n  for (var i = 0.0; i < f32(sampleCount); i += 1.0) {\n    let angle = 2.0 * PI * (i / f32(sampleCount));\n    let sampleDir = vec2f(cos(angle), sin(angle));\n    // make a radius that is subject to randomness\n    let radius = 0.1 + random_uniform(f32(idx) + i + canvas.time) * 0.9; // random radius between 0 and 1\n    let sample_pos = p + radius * range * sampleDir;\n\n    let densityMO = load_texture_float(STIGMERGYMONOMER, sample_pos);\n    let densityPO = load_texture_float(STIGMERGYPOLYMER, sample_pos);\n    let densityME = load_texture_float(STIGMERGYMEMBRANE, sample_pos);\n\n    // if (isPlusEnd(actin)){\n    //   store_texture_float(DEBUG, sample_pos, 1.0);\n    // }\n\n    var density = densityME;\n    if (isPolymerStrict(actin) || isPlusEnd(actin)) {\n      density += densityPO * controls.polymerRepulsion;\n    }\n\n    stericForce += select(\n      vec2<f32>(0.0), \n      normalize_safely(p - sample_pos) * density, \n      density > 0.0\n    );\n  }\n\n  // strong line forces\n  // 1. Stronger spring forces for maintaining distance\n  var line_force = vec2f(0.0);\n  let upstream = actin.upstream;\n  let downstream = actin.downstream;\n  let applyLineForceUpstream = upstream >= 0;\n  let applyLineForceDownstream = downstream >= 0;\n  line_force += select(vec2f(0.0), normalize_safely(actines[upstream].position - p) * (length(actines[upstream].position - p) - 1), applyLineForceUpstream);\n  line_force += select(vec2f(0.0), normalize_safely(actines[downstream].position - p) * (length(actines[downstream].position - p) - 1), applyLineForceDownstream);\n\n  // 3. Combine forces \n  actines[id.x].position += 0.5 * line_force + 0.1 * stericForce;\n}\n\n@compute @workgroup_size(256)\nfn bind_actin_monomer(@builtin(global_invocation_id) id : vec3u) {\n  let count = i32(controls.actinCount);\n  let idx = i32(id.x);\n  let actin = actines[idx];\n\n  if (isPolymer(actin)) {\n    return;\n  }\n\n  let p = actin.position;\n  let tangent = actin.orientation;\n  let normal = vec2<f32>(-tangent.y, tangent.x);\n\n  // weak steric forcess\n  let range = f32(controls.actinCohesionRange);\n  var neighborPolymer = NeighborStruct(-1, 999999.9);\n\n  let sampleCount = 6; \n  for (var i = 0.0; i < f32(sampleCount); i += 1.0) {\n    let angle2 = 2.0 * PI * (i / f32(sampleCount));\n    let sampleDir = vec2f(cos(angle2), sin(angle2));\n    // make a radius that is subject to randomness\n    let radius = 0.0 + random_uniform(f32(idx) + i + canvas.time) * 1.0; // random radius between 0 and 1\n    let sample_pos = p + radius * range * 2.0 * sampleDir;\n\n    let lifetimeDensity = load_texture_float(LIFETIME, sample_pos);\n\n    // monomers look for polymers to connect to\n    let actinSignal = i32(load_texture_float(ACTININDEX, sample_pos));\n    let dist = length(p - sample_pos);\n    let farFromPolymer = lifetimeDensity < 0.01;\n    \n    if (actinSignal <= 0 || farFromPolymer) {\n      continue;\n    }\n\n    let idxN = actinSignal - 1;\n    let neighbor = actines[idxN];\n    let available = isPlusEnd(neighbor);\n\n    if (!available || idxN == idx){\n      continue;\n    }\n\n    // Check binding angle\n    let polymer_direction = normalize_safely(neighbor.position - actines[neighbor.upstream].position);\n    let binding_direction = normalize_safely(p - neighbor.position);\n    let angle = acos(dot(polymer_direction, binding_direction));\n    \n    // TODO this conditional statement affects net binding rates\n    // Only allow binding if angle is small (close to straight)\n      if (dist < neighborPolymer.distance) {\n          neighborPolymer = NeighborStruct(idxN, dist);\n      } else if (dist == neighborPolymer.distance && random_uniform(f32(idx) + f32(idxN) + canvas.time) < 0.3) {\n          neighborPolymer = NeighborStruct(idxN, dist);\n      }\n  }\n\n  // 3. Handle binding with neighborPolymer\n  let foodSignal = load_texture_float(MEMBRANEFOODSIGNAL, p);\n  let foodNearby = foodSignal > controls.foodNearbyThreshold;\n  if (foodNearby && neighborPolymer.idx >= 0) {\n    if (atomicCompareExchangeWeak(&connectionLocks[neighborPolymer.idx], 0, 1).exchanged) {\n      // locked the target neighborPolymer.\n      atomicStore(&connectionLocks[idx], 1);\n      if (actines[neighborPolymer.idx].downstream == UNCONNECTED) {\n        actines[idx].upstream = neighborPolymer.idx;\n        actines[neighborPolymer.idx].downstream = idx;\n\n        // also put the actin exactly on the polymer + direction\n        let direction = normalize_safely(actines[neighborPolymer.idx].position - actines[actines[neighborPolymer.idx].upstream].position);\n        let newPosition = actines[neighborPolymer.idx].position + direction * 3.0; // Move forward from current position\n        actines[idx].position = newPosition;\n        actines[idx].timer = 0.0; // reset lifetime\n      }\n    }\n  }\n}\n\n\n@compute @workgroup_size(256)\nfn unbind_minus_end(@builtin(global_invocation_id) id : vec3u) {\n  let idx = i32(id.x);\n  let actin = actines[idx];\n  let p = actin.position;\n  let dd = actin.downstream;\n\n  // 4. unbind -pole\n  if (actin.upstream == UNCONNECTED && dd >= 0) {\n    store_texture_float(DEBUG, p, 1.0);\n    \n    // to keep min size of 3. ensure downstream's downstream is connected\n    let ddd = actines[dd].downstream;\n    if (ddd >= 0) {\n      if (random_uniform(p.x + p.y + canvas.time) < controls.unbindProb) {\n        actines[actin.downstream].upstream = UNCONNECTED;\n        actines[idx].downstream = UNCONNECTED;\n        actines[idx].timer = 0.0; //\n      }\n    }\n  }\n}\n\n@compute @workgroup_size(256)\nfn membrane_to_textures(@builtin(global_invocation_id) id : vec3u) {\n  let count = i32(controls.membraneCount);\n\n  let idx = i32(id.x);\n  if (idx >= count) {\n    return;\n  }\n  \n  var agent = membrane[idx];\n  let p = agent.position;\n  let tangent = agent.orientation;\n\n  for (var t = -1.0; t <= 1.0; t += 1.0) {\n    let q = p + t * tangent;\n    store_texture_float(STIGMERGYMEMBRANE, q, 1.0);\n    store_texture_float(AGENTINDEX, q, f32(idx + 1));\n  }\n}\n\n@compute @workgroup_size(256)\nfn actines_to_textures(@builtin(global_invocation_id) id : vec3u) {\n  let count = i32(controls.actinCount);\n\n  let idx = i32(id.x);\n  if (idx >= count) {\n    return;\n  }\n  let ct = actines[idx].timer;\n  actines[idx].timer = ct + 0.001; // increment timer\n\n  let actin = actines[idx];\n  let p = actin.position;\n  let tangent = actin.orientation;\n  let normal = vec2<f32>(-tangent.y, tangent.x);\n  let direction = tangent * normal;\n\n  if (isMonomer(actin) || isPlusEndOfTwo(actin)) {\n    store_texture_float(STIGMERGYMONOMER, p, load_texture_float(STIGMERGYMONOMER, p) + 0.01);\n  }\n  else if (actin.upstream >= 0 && actin.downstream >= 0) {\n    // only make polymers apply force when connected as a group > 3\n    store_texture_float(STIGMERGYPOLYMER, p, 1.0);\n    store_texture_float(TIMESIGNAL, p, ct);\n  }\n  store_texture_float(AGENTINDEX, p, f32(idx + 1));\n\n  // depose ACTININDEX + LIFETIME if polymer head\n  let foodNearby = load_texture_float(MEMBRANEFOODSIGNAL, p) > 0.001;\n  if (isPlusEnd(actin) && foodNearby) {\n    let upstream = actines[actin.upstream];\n    let direction = normalize_safely(p - upstream.position);\n    // // let it be random\n    // let randomOffset = random_uniform(f32(idx) + canvas.time); // random offset between 0 and 0.5\n    let dropPosition = p + direction * 3.0; // Move forward from current position\n    \n    store_texture_float(ACTININDEX, dropPosition, f32(idx + 1));\n    store_texture_float(LIFETIME, dropPosition, 1.0);\n    store_texture_float(DEBUG, dropPosition, 2.0);\n    // 0 means it's available to connect\n    atomicStore(&connectionLocks[idx], 0);\n  }\n  else {\n    // 1 means it cannot connect\n    atomicStore(&connectionLocks[idx], 1);\n  }\n}\n\n@compute @workgroup_size(16, 16)\nfn update_textures(@builtin(global_invocation_id) id : vec3u) {\n  let p = vec2i(id.xy);\n\n  store_texture(STIGMERGYMONOMER, p, gaussian_blur(p, STIGMERGYMONOMER, 0.0));\n  store_texture(STIGMERGYPOLYMER, p, gaussian_blur(p, STIGMERGYPOLYMER, 0.0));\n  store_texture(STIGMERGYMEMBRANE, p, gaussian_blur(p, STIGMERGYMEMBRANE, 0.0));\n  store_texture(LIFETIME, p, gaussian_blur(p, LIFETIME, 0.0));\n  spread_actin_index(p);\n  store_texture(MEMBRANEFOODSIGNAL, p, gaussian_blur(p, MEMBRANEFOODSIGNAL, 0.0));\n  store_texture(MEMBRANEFOODSIGNAL, p, gaussian_blur(p, MEMBRANEFOODSIGNAL, 0.0));\n  store_texture(STIGMERGYGRADIENT, p, gaussian_blur(p, STIGMERGYGRADIENT, 0.0));\n\n\n  let x = vec2<f32>(p) + vec2<f32>(0.5, 0.5); // center of pixel\n  let y = interactions.position;\n\n  let dims = vec2<f32>(canvas.size);\n  let distance = length((x - y) - dims * floor((x - y) / dims + 0.5));\n\n  if distance < abs(interactions.size) {\n      store_texture_float(MEMBRANEFOODSIGNAL, x, 1.0);\n  }\n\n  // also blur the rendering textures\n  // store_texture_rendering(R, p, gaussian_blur_rendering(p, R, 0.0));\n  // store_texture_rendering(G, p, gaussian_blur_rendering(p, G, 0.0));\n  // store_texture_rendering(B, p, gaussian_blur_rendering(p, B, 0.0));\n}\n\n@compute @workgroup_size(16, 16)\nfn clear_textures(@builtin(global_invocation_id) id : vec3u) {\n  let p = vec2i(id.xy);\n\n  // Remove actinindex when lifetime is low\n  let lifetime = load_texture(LIFETIME, p);\n  if (lifetime < 0.01){\n    store_texture(ACTININDEX, p, 0.0);\n    store_texture(LIFETIME, p, 0.0);\n  }\n\n  store_texture(STIGMERGYMONOMER, p, 0.997*load_texture(STIGMERGYMONOMER, p));\n  store_texture(STIGMERGYPOLYMER, p, 0.75*load_texture(STIGMERGYPOLYMER, p));\n  store_texture(STIGMERGYMEMBRANE, p, 0.95*load_texture(STIGMERGYMEMBRANE, p));\n  store_texture(AGENTINDEX, p, 0.0);\n  store_texture(MEMBRANEFOODSIGNAL, p, 0.995*load_texture(MEMBRANEFOODSIGNAL, p));\n  store_texture(DEBUG, p, 0.0);\n  store_texture(LIFETIME, p, 0.99*load_texture(LIFETIME, p));\n  store_texture(TIMESIGNAL, p, 0.99*load_texture(TIMESIGNAL, p));\n  store_texture(STIGMERGYGRADIENT, p, 0.8*load_texture(STIGMERGYGRADIENT, p));\n\n  // store_texture_rendering(R, p, RENDERSMOOTHNESS*load_texture_rendering(R, p));\n  // store_texture_rendering(G, p, RENDERSMOOTHNESS*load_texture_rendering(G, p));\n  // store_texture_rendering(B, p, RENDERSMOOTHNESS*load_texture_rendering(B, p));\n}\n\n@compute @workgroup_size(256)\nfn reset_membrane(@builtin(global_invocation_id) id : vec3u) {\n  let idx = i32(id.x);\n  if (idx >= i32(controls.membraneCount)) {\n    return;\n  }\n  \n  // MEMBRANE\n  let center = vec2<f32>(canvas.size) * 0.5;\n  let radius = min(center.x, center.y) * 0.3;\n  let angle_step = 2.0 * PI / f32(controls.membraneCount);\n  let current_angle = f32(idx) * angle_step;\n\n  let x = center.x + radius * cos(current_angle);\n  let y = center.y + radius * sin(current_angle);\n  membrane[idx].position = vec2<f32>(x, y);\n\n  let random_angle = random_uniform(f32(idx));\n  membrane[idx].orientation = vec2<f32>(cos(random_angle * 2.0 * PI), sin(random_angle * 2.0 * PI));\n}\n\n@compute @workgroup_size(256)\nfn reset_actin(@builtin(global_invocation_id) id : vec3u) {\n  let idx = i32(id.x);\n  \n  // actines\n  let center = vec2<f32>(canvas.size) * 0.5;\n  let radius = min(center.x, center.y) * 0.5;\n  // distribute around a circle\n  let current_angle = random_uniform(f32(idx) + 0.1) * 2.0 * PI;\n  let normalized_radius = sqrt(random_uniform(f32(idx) + 0.2)) * radius * 0.3;\n  \n  let xt = center.x + normalized_radius * cos(current_angle);\n  let yt = center.y + normalized_radius * sin(current_angle);\n  actines[idx].position = vec2<f32>(xt, yt);\n  \n  let random_angle = random_uniform(f32(idx));\n  actines[idx].orientation = vec2<f32>(cos(random_angle * 2.0 * PI), sin(random_angle * 2.0 * PI));\n  actines[idx].downstream = UNCONNECTED;\n  actines[idx].upstream = UNCONNECTED;\n\n  let isNucleated = random_uniform(f32(idx) + random_angle + canvas.time) < controls.startsNucleatedProb && idx >1 && idx < i32(controls.actinCount) - 1;\n  storageBarrier();\n  if isNucleated {\n    actines[idx].downstream = idx+1;\n    actines[idx+1].upstream = idx;\n  }\n  actines[idx].timer = 0.0; // reset lifetime\n}\n\nfn rotate(v: vec2<f32>, angle: f32) -> vec2<f32> {\n  let c = cos(angle);\n  let s = sin(angle);\n  return vec2<f32>(c * v.x - s * v.y, s * v.x + c * v.y);\n}\n\n// A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm for u32.\nfn hash_u32(x_in: u32) -> u32 {\n    var x = x_in;\n    x += (x << 10u);\n    x ^= (x >> 6u);\n    x += (x << 3u);\n    x ^= (x >> 11u);\n    x += (x << 15u);\n    return x;\n}\n\n// Compound hashing algorithms for vectors.\nfn hash_vec2u(v: vec2u) -> u32 {\n    return hash_u32(v.x ^ hash_u32(v.y));\n}\n\nfn hash_vec3u(v: vec3u) -> u32 {\n    return hash_u32(v.x ^ hash_u32(v.y) ^ hash_u32(v.z));\n}\n\nfn hash_vec4u(v: vec4u) -> u32 {\n    return hash_u32(v.x ^ hash_u32(v.y) ^ hash_u32(v.z) ^ hash_u32(v.w));\n}\n\n// Construct a float with half-open range [0:1] using low 23 bits.\n// All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.\nfn float_construct_from_u32(m_in: u32) -> f32 {\n    let ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask\n    let ieeeOne = 0x3F800000u;      // 1.0 in IEEE binary32\n\n    var m = m_in;\n    m &= ieeeMantissa;              // Keep only mantissa bits (fractional part)\n    m |= ieeeOne;                   // Add fractional part to 1.0\n\n    let f = bitcast<f32>(m);        // Range [1:2]\n    return f - 1.0;                 // Range [0:1]\n}\n\n// Pseudo-random value in half-open range [0:1] from a f32 seed.\nfn random_uniform(seed: f32) -> f32 {\n    return float_construct_from_u32(hash_u32(bitcast<u32>(seed)));\n}\n\nfn load_texture_rendering(F: i32, p: vec2<i32>) -> f32 {\n  let q = p + canvas.size;\n  return textureLoad(storageTexturesRendering, q  % canvas.size, F).r;\n}\nfn store_texture_rendering(F: i32, p: vec2<i32>, value: f32) {\n  let q = p + canvas.size;\n  textureStore(storageTexturesRendering, q  % canvas.size, F, as_r32float(value));\n}\n\nfn gaussian_blur_rendering(p: vec2<i32>, texture: i32, spreadAmt: f32) -> f32 {\n  return ( \n    2.0 * (  // adjacents\n      load_texture_rendering(texture, p + DX) + load_texture_rendering(texture, p - DX) + load_texture_rendering(texture, p + DY) + load_texture_rendering(texture, p - DY)\n    ) + (  // diagonals\n      load_texture_rendering(texture, p + DX + DY) + load_texture_rendering(texture, p + DX - DY) + load_texture_rendering(texture, p - DX + DY) + load_texture_rendering(texture, p - DX - DY)\n    ) + 8.0 *(  // center\n      load_texture_rendering(texture, p)\n    )\n  ) / (20.0 - spreadAmt);\n}\n\n\n\n@compute @workgroup_size(16, 16)\nfn consolidate_textures(@builtin(global_invocation_id) id : vec3u) {\n  let p = vec2i(id.xy);\n  let count = i32(controls.actinCount);\n\n  let sMo = load_texture(STIGMERGYMONOMER, p);\n  let sPo = load_texture(STIGMERGYPOLYMER, p);\n  let sMe = load_texture(STIGMERGYMEMBRANE, p);\n\n  // sample lifetime\n  let lifetime = load_texture(LIFETIME, p);\n\n  let coordMo = vec2i(1000.0 * vec2f(sMo * lifetime, sMo* 0.333));\n  let coordPo = vec2i(1000.0 * vec2f(sPo, 0.333 + sPo* 0.333));\n  let coordMe = vec2i(1000.0 * vec2f(sMe, 0.666 + sMe* 0.333));\n\n  // now determine where to sample based on sMo, sPo, sMe\n  let sampleMonomer = textureLoad(artisticTexture, coordMo, 0).rgba;\n  let samplePolymer = textureLoad(artisticTexture, coordPo, 0).rgba;\n  let sampleMembrane = textureLoad(artisticTexture, coordMe, 0).rgba;\n\n  var color = vec4(0.95, 0.95, 0.93, 1.0);\n  if (sMo > 0.000) {\n    color = mix(color, sampleMonomer, sMo * 0.9);  // Use mix instead of addition\n  }\n  if (sPo > 0.3) {\n    color = mix(color, samplePolymer, sPo * 0.5);\n  }\n\n  if (sMe > 0.000001) {\n    color = mix(color, sampleMembrane, sMe * 0.4);\n  }\n\n  // // write color to the rendering texture\n  // store_texture_rendering(R, p, load_texture_rendering(R, p) + (1.0-RENDERSMOOTHNESS)*color.r);\n  // store_texture_rendering(G, p, load_texture_rendering(G, p) + (1.0-RENDERSMOOTHNESS)*color.g);\n  // store_texture_rendering(B, p, load_texture_rendering(B, p) + (1.0-RENDERSMOOTHNESS)*color.b);\n}\n";

/***/ }),

/***/ "./src/utils.ts":
/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   configureCanvas: () => (/* binding */ configureCanvas),
/* harmony export */   createPerformanceQueries: () => (/* binding */ createPerformanceQueries),
/* harmony export */   createShader: () => (/* binding */ createShader),
/* harmony export */   requestDevice: () => (/* binding */ requestDevice),
/* harmony export */   setupInteractions: () => (/* binding */ setupInteractions)
/* harmony export */ });
function throwDetectionError(error) {
    document.querySelector(".webgpu-not-supported").style.visibility = "visible";
    throw new Error("Could not initialize WebGPU: " + error);
}
async function requestDevice(options = {
    powerPreference: "high-performance",
}, requiredFeatures = [], requiredLimits = {
    maxStorageTexturesPerShaderStage: 8,
}) {
    if (!navigator.gpu)
        throwDetectionError("WebGPU NOT Supported");
    const adapter = await navigator.gpu.requestAdapter(options);
    if (!adapter)
        throwDetectionError("No GPU adapter found");
    const canTimestamp = adapter.features.has("timestamp-query");
    const features = [...requiredFeatures];
    if (canTimestamp) {
        features.push("timestamp-query");
    }
    return adapter.requestDevice({
        requiredFeatures: features,
        requiredLimits: requiredLimits,
        ...(canTimestamp ? ["timestamp-query"] : []),
    });
}
function configureCanvas(device, size = { width: window.innerWidth, height: window.innerHeight }) {
    // make sure the canvas is square for now
    // TODO: square for now. support assymetric canvases later
    const minSize = Math.min(size.width, size.height);
    size.width = minSize;
    size.height = minSize;
    const canvas = Object.assign(document.createElement("canvas"), size);
    document.body.appendChild(canvas);
    const context = canvas.getContext("webgpu");
    if (!context)
        throwDetectionError("Canvas does not support WebGPU");
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        alphaMode: "premultiplied",
    });
    return { canvas: canvas, context: context, format: format, size: size };
}
async function createShader(device, code) {
    const module = device.createShaderModule({ code });
    const info = await module.getCompilationInfo();
    if (info.messages.length > 0) {
        for (let message of info.messages) {
            console.warn(`${message.message} 
  at line ${message.lineNum}`);
        }
        throw new Error(`Could not compile shader`);
    }
    return module;
}
async function createPerformanceQueries(device) {
    const canTimestamp = device.features.has("timestamp-query");
    // if (!canTimestamp) {
    //   console.warn("Timestamp queries are not supported by this device.");
    //   return {};
    // }
    const querySet = device.createQuerySet({
        type: "timestamp",
        count: 2,
    });
    const resolveBuffer = device.createBuffer({
        size: querySet.count * 8,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
    });
    const resultBuffer = device.createBuffer({
        size: resolveBuffer.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    return { querySet, resolveBuffer, resultBuffer };
}
function setupInteractions(device, canvas, texture, size = 10) {
    let data = new Float32Array(4);
    var sign = 1;
    let position = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };
    data.set([position.x, position.y]);
    if (canvas instanceof HTMLCanvasElement) {
        // disable context menu
        canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
        // move events
        ["mousemove", "touchmove"].forEach((type) => {
            canvas.addEventListener(type, (event) => {
                switch (true) {
                    case event instanceof MouseEvent:
                        position.x = event.offsetX;
                        position.y = event.offsetY;
                        break;
                    case event instanceof TouchEvent:
                        position.x = event.touches[0].clientX;
                        position.y = event.touches[0].clientY;
                        break;
                }
                let x = Math.floor((position.x / canvas.width) * texture.width);
                let y = Math.floor((position.y / canvas.height) * texture.height);
                data.set([x, y]);
            }, { passive: true });
        });
        // zoom events TODO(@gszep) add pinch and scroll for touch devices
        ["wheel"].forEach((type) => {
            canvas.addEventListener(type, (event) => {
                switch (true) {
                    case event instanceof WheelEvent:
                        velocity.x = event.deltaY;
                        velocity.y = event.deltaY;
                        break;
                }
                size += velocity.y;
                data.set([size], 2);
            }, { passive: true });
        });
        // click events TODO(@gszep) implement right click equivalent for touch devices
        ["mousedown", "touchstart"].forEach((type) => {
            canvas.addEventListener(type, (event) => {
                switch (true) {
                    case event instanceof MouseEvent:
                        sign = 1 - event.button;
                        break;
                    case event instanceof TouchEvent:
                        sign = event.touches.length > 1 ? -1 : 1;
                }
                data.set([sign * size], 2);
            }, { passive: true });
        });
        ["mouseup", "touchend"].forEach((type) => {
            canvas.addEventListener(type, (event) => {
                data.set([NaN], 2);
            }, { passive: true });
        });
    }
    const uniformBuffer = device.createBuffer({
        label: "Interaction Buffer",
        size: data.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    return {
        buffer: uniformBuffer,
        data: data,
        type: "uniform",
    };
}


/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.ts"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBOztBQUVBO0FBQ0Esa0NBQWtDLHdCQUF3Qjs7QUFFMUQ7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLFlBQVksUUFBUTtBQUNwQixjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVksVUFBVTtBQUN0QixjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLFlBQVksVUFBVTtBQUN0QixjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFlBQVksU0FBUztBQUNyQixjQUFjO0FBQ2Q7QUFDQTtBQUNBLGdDQUFnQztBQUNoQywrQ0FBK0M7QUFDL0M7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFlBQVksU0FBUztBQUNyQixjQUFjO0FBQ2Q7QUFDQTtBQUNBLGlDQUFpQztBQUNqQyxpREFBaUQ7QUFDakQ7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxZQUFZLFNBQVM7QUFDckIsY0FBYztBQUNkO0FBQ0E7QUFDQSw4QkFBOEI7QUFDOUIsMkNBQTJDO0FBQzNDO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxvQkFBb0I7QUFDM0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSxjQUFjO0FBQzFCLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsWUFBWSxRQUFRO0FBQ3BCLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsWUFBWSxRQUFRO0FBQ3BCLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLFFBQVE7QUFDcEIsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLFFBQVE7QUFDcEIsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxZQUFZLFNBQVM7QUFDckIsY0FBYztBQUNkO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsWUFBWSxLQUFLO0FBQ2pCLGNBQWM7QUFDZDtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFJOztBQUVKOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBLDhDQUE4QyxFQUFFOztBQUVoRDs7QUFFQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTs7QUFFQSxHQUFHOztBQUVIOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxFQUFFO0FBQ0Y7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBLEVBQUU7QUFDRixnQkFBZ0IsU0FBUzs7QUFFekI7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTs7QUFFSjtBQUNBO0FBQ0EsSUFBSTs7QUFFSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTs7QUFFSjtBQUNBO0FBQ0E7QUFDQSxJQUFJOztBQUVKO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTs7QUFFSjs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBLElBQUk7O0FBRUo7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJOztBQUVKO0FBQ0EsdURBQXVELElBQUksZ0JBQWdCOztBQUUzRTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE1BQU07O0FBRU47O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxvREFBb0QsaUJBQWlCO0FBQ3JFO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLEtBQUs7O0FBRUw7QUFDQTs7QUFFQTs7QUFFQSx3REFBd0QsaUJBQWlCO0FBQ3pFOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQSxNQUFNOztBQUVOO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSxLQUFLOztBQUVMO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0EsK0RBQStELGlCQUFpQjtBQUNoRixxREFBcUQsaUJBQWlCOztBQUV0RTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDLEtBQUs7QUFDbEQ7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBLFFBQVEsaUJBQWlCOztBQUV6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFJOztBQUVKO0FBQ0E7QUFDQSxJQUFJOztBQUVKO0FBQ0E7QUFDQSxJQUFJOztBQUVKO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7O0FBRUo7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7O0FBRUo7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJOztBQUVKO0FBQ0E7QUFDQSxJQUFJOztBQUVKOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUNBQXVDLGNBQWM7QUFDckQsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFH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RUFBRSxJQUFJLEVBQUUsQ0FDbEIsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNELE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7UUFDeEMsS0FBSyxFQUFFLG9CQUFvQjtRQUMzQixJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVU7UUFDckIsS0FBSyxFQUFFLGNBQWMsQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDLFFBQVE7S0FDeEQsQ0FBQyxDQUFDO0lBRUgsT0FBTztRQUNMLE1BQU0sRUFBRSxhQUFhO1FBQ3JCLElBQUksRUFBRSxJQUFJO1FBQ1YsSUFBSSxFQUFFLFNBQVM7S0FDaEIsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly93ZWJncHVfY29sbGFiX3N0cmluZ2VkX2VudGl0aWVzLy4vbm9kZV9tb2R1bGVzL2xpbC1ndWkvZGlzdC9saWwtZ3VpLmVzbS5qcyIsIndlYnBhY2s6Ly93ZWJncHVfY29sbGFiX3N0cmluZ2VkX2VudGl0aWVzLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL3dlYmdwdV9jb2xsYWJfc3RyaW5nZWRfZW50aXRpZXMvLi9zcmMvdXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBsaWwtZ3VpXG4gKiBodHRwczovL2xpbC1ndWkuZ2VvcmdlYWx3YXlzLmNvbVxuICogQHZlcnNpb24gMC4yMC4wXG4gKiBAYXV0aG9yIEdlb3JnZSBNaWNoYWVsIEJyb3dlclxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBhbGwgY29udHJvbGxlcnMuXG4gKi9cbmNsYXNzIENvbnRyb2xsZXIge1xuXG5cdGNvbnN0cnVjdG9yKCBwYXJlbnQsIG9iamVjdCwgcHJvcGVydHksIGNsYXNzTmFtZSwgZWxlbWVudFR5cGUgPSAnZGl2JyApIHtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBHVUkgdGhhdCBjb250YWlucyB0aGlzIGNvbnRyb2xsZXIuXG5cdFx0ICogQHR5cGUge0dVSX1cblx0XHQgKi9cblx0XHR0aGlzLnBhcmVudCA9IHBhcmVudDtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBvYmplY3QgdGhpcyBjb250cm9sbGVyIHdpbGwgbW9kaWZ5LlxuXHRcdCAqIEB0eXBlIHtvYmplY3R9XG5cdFx0ICovXG5cdFx0dGhpcy5vYmplY3QgPSBvYmplY3Q7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gY29udHJvbC5cblx0XHQgKiBAdHlwZSB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdHRoaXMucHJvcGVydHkgPSBwcm9wZXJ0eTtcblxuXHRcdC8qKlxuXHRcdCAqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZSBjb250cm9sbGVyIGlzIGRpc2FibGVkLlxuXHRcdCAqIFVzZSBgY29udHJvbGxlci5kaXNhYmxlKCB0cnVlfGZhbHNlIClgIHRvIG1vZGlmeSB0aGlzIHZhbHVlLlxuXHRcdCAqIEB0eXBlIHtib29sZWFufVxuXHRcdCAqL1xuXHRcdHRoaXMuX2Rpc2FibGVkID0gZmFsc2U7XG5cblx0XHQvKipcblx0XHQgKiBVc2VkIHRvIGRldGVybWluZSBpZiB0aGUgQ29udHJvbGxlciBpcyBoaWRkZW4uXG5cdFx0ICogVXNlIGBjb250cm9sbGVyLnNob3coKWAgb3IgYGNvbnRyb2xsZXIuaGlkZSgpYCB0byBjaGFuZ2UgdGhpcy5cblx0XHQgKiBAdHlwZSB7Ym9vbGVhbn1cblx0XHQgKi9cblx0XHR0aGlzLl9oaWRkZW4gPSBmYWxzZTtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSB2YWx1ZSBvZiBgb2JqZWN0WyBwcm9wZXJ0eSBdYCB3aGVuIHRoZSBjb250cm9sbGVyIHdhcyBjcmVhdGVkLlxuXHRcdCAqIEB0eXBlIHthbnl9XG5cdFx0ICovXG5cdFx0dGhpcy5pbml0aWFsVmFsdWUgPSB0aGlzLmdldFZhbHVlKCk7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgb3V0ZXJtb3N0IGNvbnRhaW5lciBET00gZWxlbWVudCBmb3IgdGhpcyBjb250cm9sbGVyLlxuXHRcdCAqIEB0eXBlIHtIVE1MRWxlbWVudH1cblx0XHQgKi9cblx0XHR0aGlzLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCBlbGVtZW50VHlwZSApO1xuXHRcdHRoaXMuZG9tRWxlbWVudC5jbGFzc0xpc3QuYWRkKCAnY29udHJvbGxlcicgKTtcblx0XHR0aGlzLmRvbUVsZW1lbnQuY2xhc3NMaXN0LmFkZCggY2xhc3NOYW1lICk7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgRE9NIGVsZW1lbnQgdGhhdCBjb250YWlucyB0aGUgY29udHJvbGxlcidzIG5hbWUuXG5cdFx0ICogQHR5cGUge0hUTUxFbGVtZW50fVxuXHRcdCAqL1xuXHRcdHRoaXMuJG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRcdHRoaXMuJG5hbWUuY2xhc3NMaXN0LmFkZCggJ25hbWUnICk7XG5cblx0XHRDb250cm9sbGVyLm5leHROYW1lSUQgPSBDb250cm9sbGVyLm5leHROYW1lSUQgfHwgMDtcblx0XHR0aGlzLiRuYW1lLmlkID0gYGxpbC1ndWktbmFtZS0keysrQ29udHJvbGxlci5uZXh0TmFtZUlEfWA7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgRE9NIGVsZW1lbnQgdGhhdCBjb250YWlucyB0aGUgY29udHJvbGxlcidzIFwid2lkZ2V0XCIgKHdoaWNoIGRpZmZlcnMgYnkgY29udHJvbGxlciB0eXBlKS5cblx0XHQgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG5cdFx0ICovXG5cdFx0dGhpcy4kd2lkZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHR0aGlzLiR3aWRnZXQuY2xhc3NMaXN0LmFkZCggJ3dpZGdldCcgKTtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBET00gZWxlbWVudCB0aGF0IHJlY2VpdmVzIHRoZSBkaXNhYmxlZCBhdHRyaWJ1dGUgd2hlbiB1c2luZyBkaXNhYmxlKCkuXG5cdFx0ICogQHR5cGUge0hUTUxFbGVtZW50fVxuXHRcdCAqL1xuXHRcdHRoaXMuJGRpc2FibGUgPSB0aGlzLiR3aWRnZXQ7XG5cblx0XHR0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoIHRoaXMuJG5hbWUgKTtcblx0XHR0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoIHRoaXMuJHdpZGdldCApO1xuXG5cdFx0Ly8gRG9uJ3QgZmlyZSBnbG9iYWwga2V5IGV2ZW50cyB3aGlsZSB0eXBpbmcgaW4gYSBjb250cm9sbGVyXG5cdFx0dGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdrZXlkb3duJywgZSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpICk7XG5cdFx0dGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdrZXl1cCcsIGUgPT4gZS5zdG9wUHJvcGFnYXRpb24oKSApO1xuXG5cdFx0dGhpcy5wYXJlbnQuY2hpbGRyZW4ucHVzaCggdGhpcyApO1xuXHRcdHRoaXMucGFyZW50LmNvbnRyb2xsZXJzLnB1c2goIHRoaXMgKTtcblxuXHRcdHRoaXMucGFyZW50LiRjaGlsZHJlbi5hcHBlbmRDaGlsZCggdGhpcy5kb21FbGVtZW50ICk7XG5cblx0XHR0aGlzLl9saXN0ZW5DYWxsYmFjayA9IHRoaXMuX2xpc3RlbkNhbGxiYWNrLmJpbmQoIHRoaXMgKTtcblxuXHRcdHRoaXMubmFtZSggcHJvcGVydHkgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIG5hbWUgb2YgdGhlIGNvbnRyb2xsZXIgYW5kIGl0cyBsYWJlbCBpbiB0aGUgR1VJLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuXHQgKiBAcmV0dXJucyB7dGhpc31cblx0ICovXG5cdG5hbWUoIG5hbWUgKSB7XG5cdFx0LyoqXG5cdFx0ICogVGhlIGNvbnRyb2xsZXIncyBuYW1lLiBVc2UgYGNvbnRyb2xsZXIubmFtZSggJ05hbWUnIClgIHRvIG1vZGlmeSB0aGlzIHZhbHVlLlxuXHRcdCAqIEB0eXBlIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0dGhpcy5fbmFtZSA9IG5hbWU7XG5cdFx0dGhpcy4kbmFtZS50ZXh0Q29udGVudCA9IG5hbWU7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogUGFzcyBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuZXZlciB0aGUgdmFsdWUgaXMgbW9kaWZpZWQgYnkgdGhpcyBjb250cm9sbGVyLlxuXHQgKiBUaGUgZnVuY3Rpb24gcmVjZWl2ZXMgdGhlIG5ldyB2YWx1ZSBhcyBpdHMgZmlyc3QgcGFyYW1ldGVyLiBUaGUgdmFsdWUgb2YgYHRoaXNgIHdpbGwgYmUgdGhlXG5cdCAqIGNvbnRyb2xsZXIuXG5cdCAqXG5cdCAqIEZvciBmdW5jdGlvbiBjb250cm9sbGVycywgdGhlIGBvbkNoYW5nZWAgY2FsbGJhY2sgd2lsbCBiZSBmaXJlZCBvbiBjbGljaywgYWZ0ZXIgdGhlIGZ1bmN0aW9uXG5cdCAqIGV4ZWN1dGVzLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuXHQgKiBAcmV0dXJucyB7dGhpc31cblx0ICogQGV4YW1wbGVcblx0ICogY29uc3QgY29udHJvbGxlciA9IGd1aS5hZGQoIG9iamVjdCwgJ3Byb3BlcnR5JyApO1xuXHQgKlxuXHQgKiBjb250cm9sbGVyLm9uQ2hhbmdlKCBmdW5jdGlvbiggdiApIHtcblx0ICogXHRjb25zb2xlLmxvZyggJ1RoZSB2YWx1ZSBpcyBub3cgJyArIHYgKTtcblx0ICogXHRjb25zb2xlLmFzc2VydCggdGhpcyA9PT0gY29udHJvbGxlciApO1xuXHQgKiB9ICk7XG5cdCAqL1xuXHRvbkNoYW5nZSggY2FsbGJhY2sgKSB7XG5cdFx0LyoqXG5cdFx0ICogVXNlZCB0byBhY2Nlc3MgdGhlIGZ1bmN0aW9uIGJvdW5kIHRvIGBvbkNoYW5nZWAgZXZlbnRzLiBEb24ndCBtb2RpZnkgdGhpcyB2YWx1ZSBkaXJlY3RseS5cblx0XHQgKiBVc2UgdGhlIGBjb250cm9sbGVyLm9uQ2hhbmdlKCBjYWxsYmFjayApYCBtZXRob2QgaW5zdGVhZC5cblx0XHQgKiBAdHlwZSB7RnVuY3Rpb259XG5cdFx0ICovXG5cdFx0dGhpcy5fb25DaGFuZ2UgPSBjYWxsYmFjaztcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxscyB0aGUgb25DaGFuZ2UgbWV0aG9kcyBvZiB0aGlzIGNvbnRyb2xsZXIgYW5kIGl0cyBwYXJlbnQgR1VJLlxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqL1xuXHRfY2FsbE9uQ2hhbmdlKCkge1xuXG5cdFx0dGhpcy5wYXJlbnQuX2NhbGxPbkNoYW5nZSggdGhpcyApO1xuXG5cdFx0aWYgKCB0aGlzLl9vbkNoYW5nZSAhPT0gdW5kZWZpbmVkICkge1xuXHRcdFx0dGhpcy5fb25DaGFuZ2UuY2FsbCggdGhpcywgdGhpcy5nZXRWYWx1ZSgpICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fY2hhbmdlZCA9IHRydWU7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBQYXNzIGEgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGFmdGVyIHRoaXMgY29udHJvbGxlciBoYXMgYmVlbiBtb2RpZmllZCBhbmQgbG9zZXMgZm9jdXMuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG5cdCAqIEByZXR1cm5zIHt0aGlzfVxuXHQgKiBAZXhhbXBsZVxuXHQgKiBjb25zdCBjb250cm9sbGVyID0gZ3VpLmFkZCggb2JqZWN0LCAncHJvcGVydHknICk7XG5cdCAqXG5cdCAqIGNvbnRyb2xsZXIub25GaW5pc2hDaGFuZ2UoIGZ1bmN0aW9uKCB2ICkge1xuXHQgKiBcdGNvbnNvbGUubG9nKCAnQ2hhbmdlcyBjb21wbGV0ZTogJyArIHYgKTtcblx0ICogXHRjb25zb2xlLmFzc2VydCggdGhpcyA9PT0gY29udHJvbGxlciApO1xuXHQgKiB9ICk7XG5cdCAqL1xuXHRvbkZpbmlzaENoYW5nZSggY2FsbGJhY2sgKSB7XG5cdFx0LyoqXG5cdFx0ICogVXNlZCB0byBhY2Nlc3MgdGhlIGZ1bmN0aW9uIGJvdW5kIHRvIGBvbkZpbmlzaENoYW5nZWAgZXZlbnRzLiBEb24ndCBtb2RpZnkgdGhpcyB2YWx1ZVxuXHRcdCAqIGRpcmVjdGx5LiBVc2UgdGhlIGBjb250cm9sbGVyLm9uRmluaXNoQ2hhbmdlKCBjYWxsYmFjayApYCBtZXRob2QgaW5zdGVhZC5cblx0XHQgKiBAdHlwZSB7RnVuY3Rpb259XG5cdFx0ICovXG5cdFx0dGhpcy5fb25GaW5pc2hDaGFuZ2UgPSBjYWxsYmFjaztcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiBTaG91bGQgYmUgY2FsbGVkIGJ5IENvbnRyb2xsZXIgd2hlbiBpdHMgd2lkZ2V0cyBsb3NlIGZvY3VzLlxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqL1xuXHRfY2FsbE9uRmluaXNoQ2hhbmdlKCkge1xuXG5cdFx0aWYgKCB0aGlzLl9jaGFuZ2VkICkge1xuXG5cdFx0XHR0aGlzLnBhcmVudC5fY2FsbE9uRmluaXNoQ2hhbmdlKCB0aGlzICk7XG5cblx0XHRcdGlmICggdGhpcy5fb25GaW5pc2hDaGFuZ2UgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0dGhpcy5fb25GaW5pc2hDaGFuZ2UuY2FsbCggdGhpcywgdGhpcy5nZXRWYWx1ZSgpICk7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHR0aGlzLl9jaGFuZ2VkID0gZmFsc2U7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSBjb250cm9sbGVyIGJhY2sgdG8gaXRzIGluaXRpYWwgdmFsdWUuXG5cdCAqIEByZXR1cm5zIHt0aGlzfVxuXHQgKi9cblx0cmVzZXQoKSB7XG5cdFx0dGhpcy5zZXRWYWx1ZSggdGhpcy5pbml0aWFsVmFsdWUgKTtcblx0XHR0aGlzLl9jYWxsT25GaW5pc2hDaGFuZ2UoKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiBFbmFibGVzIHRoaXMgY29udHJvbGxlci5cblx0ICogQHBhcmFtIHtib29sZWFufSBlbmFibGVkXG5cdCAqIEByZXR1cm5zIHt0aGlzfVxuXHQgKiBAZXhhbXBsZVxuXHQgKiBjb250cm9sbGVyLmVuYWJsZSgpO1xuXHQgKiBjb250cm9sbGVyLmVuYWJsZSggZmFsc2UgKTsgLy8gZGlzYWJsZVxuXHQgKiBjb250cm9sbGVyLmVuYWJsZSggY29udHJvbGxlci5fZGlzYWJsZWQgKTsgLy8gdG9nZ2xlXG5cdCAqL1xuXHRlbmFibGUoIGVuYWJsZWQgPSB0cnVlICkge1xuXHRcdHJldHVybiB0aGlzLmRpc2FibGUoICFlbmFibGVkICk7XG5cdH1cblxuXHQvKipcblx0ICogRGlzYWJsZXMgdGhpcyBjb250cm9sbGVyLlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGRpc2FibGVkXG5cdCAqIEByZXR1cm5zIHt0aGlzfVxuXHQgKiBAZXhhbXBsZVxuXHQgKiBjb250cm9sbGVyLmRpc2FibGUoKTtcblx0ICogY29udHJvbGxlci5kaXNhYmxlKCBmYWxzZSApOyAvLyBlbmFibGVcblx0ICogY29udHJvbGxlci5kaXNhYmxlKCAhY29udHJvbGxlci5fZGlzYWJsZWQgKTsgLy8gdG9nZ2xlXG5cdCAqL1xuXHRkaXNhYmxlKCBkaXNhYmxlZCA9IHRydWUgKSB7XG5cblx0XHRpZiAoIGRpc2FibGVkID09PSB0aGlzLl9kaXNhYmxlZCApIHJldHVybiB0aGlzO1xuXG5cdFx0dGhpcy5fZGlzYWJsZWQgPSBkaXNhYmxlZDtcblxuXHRcdHRoaXMuZG9tRWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCAnZGlzYWJsZWQnLCBkaXNhYmxlZCApO1xuXHRcdHRoaXMuJGRpc2FibGUudG9nZ2xlQXR0cmlidXRlKCAnZGlzYWJsZWQnLCBkaXNhYmxlZCApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTaG93cyB0aGUgQ29udHJvbGxlciBhZnRlciBpdCdzIGJlZW4gaGlkZGVuLlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IHNob3dcblx0ICogQHJldHVybnMge3RoaXN9XG5cdCAqIEBleGFtcGxlXG5cdCAqIGNvbnRyb2xsZXIuc2hvdygpO1xuXHQgKiBjb250cm9sbGVyLnNob3coIGZhbHNlICk7IC8vIGhpZGVcblx0ICogY29udHJvbGxlci5zaG93KCBjb250cm9sbGVyLl9oaWRkZW4gKTsgLy8gdG9nZ2xlXG5cdCAqL1xuXHRzaG93KCBzaG93ID0gdHJ1ZSApIHtcblxuXHRcdHRoaXMuX2hpZGRlbiA9ICFzaG93O1xuXG5cdFx0dGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSB0aGlzLl9oaWRkZW4gPyAnbm9uZScgOiAnJztcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH1cblxuXHQvKipcblx0ICogSGlkZXMgdGhlIENvbnRyb2xsZXIuXG5cdCAqIEByZXR1cm5zIHt0aGlzfVxuXHQgKi9cblx0aGlkZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5zaG93KCBmYWxzZSApO1xuXHR9XG5cblx0LyoqXG5cdCAqIENoYW5nZXMgdGhpcyBjb250cm9sbGVyIGludG8gYSBkcm9wZG93biBvZiBvcHRpb25zLlxuXHQgKlxuXHQgKiBDYWxsaW5nIHRoaXMgbWV0aG9kIG9uIGFuIG9wdGlvbiBjb250cm9sbGVyIHdpbGwgc2ltcGx5IHVwZGF0ZSB0aGUgb3B0aW9ucy4gSG93ZXZlciwgaWYgdGhpc1xuXHQgKiBjb250cm9sbGVyIHdhcyBub3QgYWxyZWFkeSBhbiBvcHRpb24gY29udHJvbGxlciwgb2xkIHJlZmVyZW5jZXMgdG8gdGhpcyBjb250cm9sbGVyIGFyZVxuXHQgKiBkZXN0cm95ZWQsIGFuZCBhIG5ldyBjb250cm9sbGVyIGlzIGFkZGVkIHRvIHRoZSBlbmQgb2YgdGhlIEdVSS5cblx0ICogQGV4YW1wbGVcblx0ICogLy8gc2FmZSB1c2FnZVxuXHQgKlxuXHQgKiBndWkuYWRkKCBvYmosICdwcm9wMScgKS5vcHRpb25zKCBbICdhJywgJ2InLCAnYycgXSApO1xuXHQgKiBndWkuYWRkKCBvYmosICdwcm9wMicgKS5vcHRpb25zKCB7IEJpZzogMTAsIFNtYWxsOiAxIH0gKTtcblx0ICogZ3VpLmFkZCggb2JqLCAncHJvcDMnICk7XG5cdCAqXG5cdCAqIC8vIGRhbmdlclxuXHQgKlxuXHQgKiBjb25zdCBjdHJsMSA9IGd1aS5hZGQoIG9iaiwgJ3Byb3AxJyApO1xuXHQgKiBndWkuYWRkKCBvYmosICdwcm9wMicgKTtcblx0ICpcblx0ICogLy8gY2FsbGluZyBvcHRpb25zIG91dCBvZiBvcmRlciBhZGRzIGEgbmV3IGNvbnRyb2xsZXIgdG8gdGhlIGVuZC4uLlxuXHQgKiBjb25zdCBjdHJsMiA9IGN0cmwxLm9wdGlvbnMoIFsgJ2EnLCAnYicsICdjJyBdICk7XG5cdCAqXG5cdCAqIC8vIC4uLmFuZCBjdHJsMSBub3cgcmVmZXJlbmNlcyBhIGNvbnRyb2xsZXIgdGhhdCBkb2Vzbid0IGV4aXN0XG5cdCAqIGFzc2VydCggY3RybDIgIT09IGN0cmwxIClcblx0ICogQHBhcmFtIHtvYmplY3R8QXJyYXl9IG9wdGlvbnNcblx0ICogQHJldHVybnMge0NvbnRyb2xsZXJ9XG5cdCAqL1xuXHRvcHRpb25zKCBvcHRpb25zICkge1xuXHRcdGNvbnN0IGNvbnRyb2xsZXIgPSB0aGlzLnBhcmVudC5hZGQoIHRoaXMub2JqZWN0LCB0aGlzLnByb3BlcnR5LCBvcHRpb25zICk7XG5cdFx0Y29udHJvbGxlci5uYW1lKCB0aGlzLl9uYW1lICk7XG5cdFx0dGhpcy5kZXN0cm95KCk7XG5cdFx0cmV0dXJuIGNvbnRyb2xsZXI7XG5cdH1cblxuXHQvKipcblx0ICogU2V0cyB0aGUgbWluaW11bSB2YWx1ZS4gT25seSB3b3JrcyBvbiBudW1iZXIgY29udHJvbGxlcnMuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBtaW5cblx0ICogQHJldHVybnMge3RoaXN9XG5cdCAqL1xuXHRtaW4oIG1pbiApIHtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSBtYXhpbXVtIHZhbHVlLiBPbmx5IHdvcmtzIG9uIG51bWJlciBjb250cm9sbGVycy5cblx0ICogQHBhcmFtIHtudW1iZXJ9IG1heFxuXHQgKiBAcmV0dXJucyB7dGhpc31cblx0ICovXG5cdG1heCggbWF4ICkge1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFZhbHVlcyBzZXQgYnkgdGhpcyBjb250cm9sbGVyIHdpbGwgYmUgcm91bmRlZCB0byBtdWx0aXBsZXMgb2YgYHN0ZXBgLiBPbmx5IHdvcmtzIG9uIG51bWJlclxuXHQgKiBjb250cm9sbGVycy5cblx0ICogQHBhcmFtIHtudW1iZXJ9IHN0ZXBcblx0ICogQHJldHVybnMge3RoaXN9XG5cdCAqL1xuXHRzdGVwKCBzdGVwICkge1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJvdW5kcyB0aGUgZGlzcGxheWVkIHZhbHVlIHRvIGEgZml4ZWQgbnVtYmVyIG9mIGRlY2ltYWxzLCB3aXRob3V0IGFmZmVjdGluZyB0aGUgYWN0dWFsIHZhbHVlXG5cdCAqIGxpa2UgYHN0ZXAoKWAuIE9ubHkgd29ya3Mgb24gbnVtYmVyIGNvbnRyb2xsZXJzLlxuXHQgKiBAZXhhbXBsZVxuXHQgKiBndWkuYWRkKCBvYmplY3QsICdwcm9wZXJ0eScgKS5saXN0ZW4oKS5kZWNpbWFscyggNCApO1xuXHQgKiBAcGFyYW0ge251bWJlcn0gZGVjaW1hbHNcblx0ICogQHJldHVybnMge3RoaXN9XG5cdCAqL1xuXHRkZWNpbWFscyggZGVjaW1hbHMgKSB7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogQ2FsbHMgYHVwZGF0ZURpc3BsYXkoKWAgZXZlcnkgYW5pbWF0aW9uIGZyYW1lLiBQYXNzIGBmYWxzZWAgdG8gc3RvcCBsaXN0ZW5pbmcuXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gbGlzdGVuXG5cdCAqIEByZXR1cm5zIHt0aGlzfVxuXHQgKi9cblx0bGlzdGVuKCBsaXN0ZW4gPSB0cnVlICkge1xuXG5cdFx0LyoqXG5cdFx0ICogVXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlIGNvbnRyb2xsZXIgaXMgY3VycmVudGx5IGxpc3RlbmluZy4gRG9uJ3QgbW9kaWZ5IHRoaXMgdmFsdWVcblx0XHQgKiBkaXJlY3RseS4gVXNlIHRoZSBgY29udHJvbGxlci5saXN0ZW4oIHRydWV8ZmFsc2UgKWAgbWV0aG9kIGluc3RlYWQuXG5cdFx0ICogQHR5cGUge2Jvb2xlYW59XG5cdFx0ICovXG5cdFx0dGhpcy5fbGlzdGVuaW5nID0gbGlzdGVuO1xuXG5cdFx0aWYgKCB0aGlzLl9saXN0ZW5DYWxsYmFja0lEICE9PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRjYW5jZWxBbmltYXRpb25GcmFtZSggdGhpcy5fbGlzdGVuQ2FsbGJhY2tJRCApO1xuXHRcdFx0dGhpcy5fbGlzdGVuQ2FsbGJhY2tJRCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMuX2xpc3RlbmluZyApIHtcblx0XHRcdHRoaXMuX2xpc3RlbkNhbGxiYWNrKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fVxuXG5cdF9saXN0ZW5DYWxsYmFjaygpIHtcblxuXHRcdHRoaXMuX2xpc3RlbkNhbGxiYWNrSUQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIHRoaXMuX2xpc3RlbkNhbGxiYWNrICk7XG5cblx0XHQvLyBUbyBwcmV2ZW50IGZyYW1lcmF0ZSBsb3NzLCBtYWtlIHN1cmUgdGhlIHZhbHVlIGhhcyBjaGFuZ2VkIGJlZm9yZSB1cGRhdGluZyB0aGUgZGlzcGxheS5cblx0XHQvLyBOb3RlOiBzYXZlKCkgaXMgdXNlZCBoZXJlIGluc3RlYWQgb2YgZ2V0VmFsdWUoKSBvbmx5IGJlY2F1c2Ugb2YgQ29sb3JDb250cm9sbGVyLiBUaGUgIT09IG9wZXJhdG9yXG5cdFx0Ly8gd29uJ3Qgd29yayBmb3IgY29sb3Igb2JqZWN0cyBvciBhcnJheXMsIGJ1dCBDb2xvckNvbnRyb2xsZXIuc2F2ZSgpIGFsd2F5cyByZXR1cm5zIGEgc3RyaW5nLlxuXG5cdFx0Y29uc3QgY3VyVmFsdWUgPSB0aGlzLnNhdmUoKTtcblxuXHRcdGlmICggY3VyVmFsdWUgIT09IHRoaXMuX2xpc3RlblByZXZWYWx1ZSApIHtcblx0XHRcdHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXHRcdH1cblxuXHRcdHRoaXMuX2xpc3RlblByZXZWYWx1ZSA9IGN1clZhbHVlO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyBgb2JqZWN0WyBwcm9wZXJ0eSBdYC5cblx0ICogQHJldHVybnMge2FueX1cblx0ICovXG5cdGdldFZhbHVlKCkge1xuXHRcdHJldHVybiB0aGlzLm9iamVjdFsgdGhpcy5wcm9wZXJ0eSBdO1xuXHR9XG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIHZhbHVlIG9mIGBvYmplY3RbIHByb3BlcnR5IF1gLCBpbnZva2VzIGFueSBgb25DaGFuZ2VgIGhhbmRsZXJzIGFuZCB1cGRhdGVzIHRoZSBkaXNwbGF5LlxuXHQgKiBAcGFyYW0ge2FueX0gdmFsdWVcblx0ICogQHJldHVybnMge3RoaXN9XG5cdCAqL1xuXHRzZXRWYWx1ZSggdmFsdWUgKSB7XG5cblx0XHRpZiAoIHRoaXMuZ2V0VmFsdWUoKSAhPT0gdmFsdWUgKSB7XG5cblx0XHRcdHRoaXMub2JqZWN0WyB0aGlzLnByb3BlcnR5IF0gPSB2YWx1ZTtcblx0XHRcdHRoaXMuX2NhbGxPbkNoYW5nZSgpO1xuXHRcdFx0dGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIGRpc3BsYXkgdG8ga2VlcCBpdCBpbiBzeW5jIHdpdGggdGhlIGN1cnJlbnQgdmFsdWUuIFVzZWZ1bCBmb3IgdXBkYXRpbmcgeW91clxuXHQgKiBjb250cm9sbGVycyB3aGVuIHRoZWlyIHZhbHVlcyBoYXZlIGJlZW4gbW9kaWZpZWQgb3V0c2lkZSBvZiB0aGUgR1VJLlxuXHQgKiBAcmV0dXJucyB7dGhpc31cblx0ICovXG5cdHVwZGF0ZURpc3BsYXkoKSB7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRsb2FkKCB2YWx1ZSApIHtcblx0XHR0aGlzLnNldFZhbHVlKCB2YWx1ZSApO1xuXHRcdHRoaXMuX2NhbGxPbkZpbmlzaENoYW5nZSgpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0c2F2ZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRWYWx1ZSgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIERlc3Ryb3lzIHRoaXMgY29udHJvbGxlciBhbmQgcmVtb3ZlcyBpdCBmcm9tIHRoZSBwYXJlbnQgR1VJLlxuXHQgKi9cblx0ZGVzdHJveSgpIHtcblx0XHR0aGlzLmxpc3RlbiggZmFsc2UgKTtcblx0XHR0aGlzLnBhcmVudC5jaGlsZHJlbi5zcGxpY2UoIHRoaXMucGFyZW50LmNoaWxkcmVuLmluZGV4T2YoIHRoaXMgKSwgMSApO1xuXHRcdHRoaXMucGFyZW50LmNvbnRyb2xsZXJzLnNwbGljZSggdGhpcy5wYXJlbnQuY29udHJvbGxlcnMuaW5kZXhPZiggdGhpcyApLCAxICk7XG5cdFx0dGhpcy5wYXJlbnQuJGNoaWxkcmVuLnJlbW92ZUNoaWxkKCB0aGlzLmRvbUVsZW1lbnQgKTtcblx0fVxuXG59XG5cbmNsYXNzIEJvb2xlYW5Db250cm9sbGVyIGV4dGVuZHMgQ29udHJvbGxlciB7XG5cblx0Y29uc3RydWN0b3IoIHBhcmVudCwgb2JqZWN0LCBwcm9wZXJ0eSApIHtcblxuXHRcdHN1cGVyKCBwYXJlbnQsIG9iamVjdCwgcHJvcGVydHksICdib29sZWFuJywgJ2xhYmVsJyApO1xuXG5cdFx0dGhpcy4kaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW5wdXQnICk7XG5cdFx0dGhpcy4kaW5wdXQuc2V0QXR0cmlidXRlKCAndHlwZScsICdjaGVja2JveCcgKTtcblx0XHR0aGlzLiRpbnB1dC5zZXRBdHRyaWJ1dGUoICdhcmlhLWxhYmVsbGVkYnknLCB0aGlzLiRuYW1lLmlkICk7XG5cblx0XHR0aGlzLiR3aWRnZXQuYXBwZW5kQ2hpbGQoIHRoaXMuJGlucHV0ICk7XG5cblx0XHR0aGlzLiRpbnB1dC5hZGRFdmVudExpc3RlbmVyKCAnY2hhbmdlJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5zZXRWYWx1ZSggdGhpcy4kaW5wdXQuY2hlY2tlZCApO1xuXHRcdFx0dGhpcy5fY2FsbE9uRmluaXNoQ2hhbmdlKCk7XG5cdFx0fSApO1xuXG5cdFx0dGhpcy4kZGlzYWJsZSA9IHRoaXMuJGlucHV0O1xuXG5cdFx0dGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cblx0fVxuXG5cdHVwZGF0ZURpc3BsYXkoKSB7XG5cdFx0dGhpcy4kaW5wdXQuY2hlY2tlZCA9IHRoaXMuZ2V0VmFsdWUoKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvbG9yU3RyaW5nKCBzdHJpbmcgKSB7XG5cblx0bGV0IG1hdGNoLCByZXN1bHQ7XG5cblx0aWYgKCBtYXRjaCA9IHN0cmluZy5tYXRjaCggLygjfDB4KT8oW2EtZjAtOV17Nn0pL2kgKSApIHtcblxuXHRcdHJlc3VsdCA9IG1hdGNoWyAyIF07XG5cblx0fSBlbHNlIGlmICggbWF0Y2ggPSBzdHJpbmcubWF0Y2goIC9yZ2JcXChcXHMqKFxcZCopXFxzKixcXHMqKFxcZCopXFxzKixcXHMqKFxcZCopXFxzKlxcKS8gKSApIHtcblxuXHRcdHJlc3VsdCA9IHBhcnNlSW50KCBtYXRjaFsgMSBdICkudG9TdHJpbmcoIDE2ICkucGFkU3RhcnQoIDIsIDAgKVxuXHRcdFx0KyBwYXJzZUludCggbWF0Y2hbIDIgXSApLnRvU3RyaW5nKCAxNiApLnBhZFN0YXJ0KCAyLCAwIClcblx0XHRcdCsgcGFyc2VJbnQoIG1hdGNoWyAzIF0gKS50b1N0cmluZyggMTYgKS5wYWRTdGFydCggMiwgMCApO1xuXG5cdH0gZWxzZSBpZiAoIG1hdGNoID0gc3RyaW5nLm1hdGNoKCAvXiM/KFthLWYwLTldKShbYS1mMC05XSkoW2EtZjAtOV0pJC9pICkgKSB7XG5cblx0XHRyZXN1bHQgPSBtYXRjaFsgMSBdICsgbWF0Y2hbIDEgXSArIG1hdGNoWyAyIF0gKyBtYXRjaFsgMiBdICsgbWF0Y2hbIDMgXSArIG1hdGNoWyAzIF07XG5cblx0fVxuXG5cdGlmICggcmVzdWx0ICkge1xuXHRcdHJldHVybiAnIycgKyByZXN1bHQ7XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG5cbn1cblxuY29uc3QgU1RSSU5HID0ge1xuXHRpc1ByaW1pdGl2ZTogdHJ1ZSxcblx0bWF0Y2g6IHYgPT4gdHlwZW9mIHYgPT09ICdzdHJpbmcnLFxuXHRmcm9tSGV4U3RyaW5nOiBub3JtYWxpemVDb2xvclN0cmluZyxcblx0dG9IZXhTdHJpbmc6IG5vcm1hbGl6ZUNvbG9yU3RyaW5nXG59O1xuXG5jb25zdCBJTlQgPSB7XG5cdGlzUHJpbWl0aXZlOiB0cnVlLFxuXHRtYXRjaDogdiA9PiB0eXBlb2YgdiA9PT0gJ251bWJlcicsXG5cdGZyb21IZXhTdHJpbmc6IHN0cmluZyA9PiBwYXJzZUludCggc3RyaW5nLnN1YnN0cmluZyggMSApLCAxNiApLFxuXHR0b0hleFN0cmluZzogdmFsdWUgPT4gJyMnICsgdmFsdWUudG9TdHJpbmcoIDE2ICkucGFkU3RhcnQoIDYsIDAgKVxufTtcblxuY29uc3QgQVJSQVkgPSB7XG5cdGlzUHJpbWl0aXZlOiBmYWxzZSxcblxuXHQvLyBUaGUgYXJyb3cgZnVuY3Rpb24gaXMgaGVyZSB0byBhcHBlYXNlIHRyZWUgc2hha2VycyBsaWtlIGVzYnVpbGQgb3Igd2VicGFjay5cblx0Ly8gU2VlIGh0dHBzOi8vZXNidWlsZC5naXRodWIuaW8vYXBpLyN0cmVlLXNoYWtpbmdcblx0bWF0Y2g6IHYgPT4gQXJyYXkuaXNBcnJheSggdiApLFxuXG5cdGZyb21IZXhTdHJpbmcoIHN0cmluZywgdGFyZ2V0LCByZ2JTY2FsZSA9IDEgKSB7XG5cblx0XHRjb25zdCBpbnQgPSBJTlQuZnJvbUhleFN0cmluZyggc3RyaW5nICk7XG5cblx0XHR0YXJnZXRbIDAgXSA9ICggaW50ID4+IDE2ICYgMjU1ICkgLyAyNTUgKiByZ2JTY2FsZTtcblx0XHR0YXJnZXRbIDEgXSA9ICggaW50ID4+IDggJiAyNTUgKSAvIDI1NSAqIHJnYlNjYWxlO1xuXHRcdHRhcmdldFsgMiBdID0gKCBpbnQgJiAyNTUgKSAvIDI1NSAqIHJnYlNjYWxlO1xuXG5cdH0sXG5cdHRvSGV4U3RyaW5nKCBbIHIsIGcsIGIgXSwgcmdiU2NhbGUgPSAxICkge1xuXG5cdFx0cmdiU2NhbGUgPSAyNTUgLyByZ2JTY2FsZTtcblxuXHRcdGNvbnN0IGludCA9ICggciAqIHJnYlNjYWxlICkgPDwgMTYgXlxuXHRcdFx0KCBnICogcmdiU2NhbGUgKSA8PCA4IF5cblx0XHRcdCggYiAqIHJnYlNjYWxlICkgPDwgMDtcblxuXHRcdHJldHVybiBJTlQudG9IZXhTdHJpbmcoIGludCApO1xuXG5cdH1cbn07XG5cbmNvbnN0IE9CSkVDVCA9IHtcblx0aXNQcmltaXRpdmU6IGZhbHNlLFxuXHRtYXRjaDogdiA9PiBPYmplY3QoIHYgKSA9PT0gdixcblx0ZnJvbUhleFN0cmluZyggc3RyaW5nLCB0YXJnZXQsIHJnYlNjYWxlID0gMSApIHtcblxuXHRcdGNvbnN0IGludCA9IElOVC5mcm9tSGV4U3RyaW5nKCBzdHJpbmcgKTtcblxuXHRcdHRhcmdldC5yID0gKCBpbnQgPj4gMTYgJiAyNTUgKSAvIDI1NSAqIHJnYlNjYWxlO1xuXHRcdHRhcmdldC5nID0gKCBpbnQgPj4gOCAmIDI1NSApIC8gMjU1ICogcmdiU2NhbGU7XG5cdFx0dGFyZ2V0LmIgPSAoIGludCAmIDI1NSApIC8gMjU1ICogcmdiU2NhbGU7XG5cblx0fSxcblx0dG9IZXhTdHJpbmcoIHsgciwgZywgYiB9LCByZ2JTY2FsZSA9IDEgKSB7XG5cblx0XHRyZ2JTY2FsZSA9IDI1NSAvIHJnYlNjYWxlO1xuXG5cdFx0Y29uc3QgaW50ID0gKCByICogcmdiU2NhbGUgKSA8PCAxNiBeXG5cdFx0XHQoIGcgKiByZ2JTY2FsZSApIDw8IDggXlxuXHRcdFx0KCBiICogcmdiU2NhbGUgKSA8PCAwO1xuXG5cdFx0cmV0dXJuIElOVC50b0hleFN0cmluZyggaW50ICk7XG5cblx0fVxufTtcblxuY29uc3QgRk9STUFUUyA9IFsgU1RSSU5HLCBJTlQsIEFSUkFZLCBPQkpFQ1QgXTtcblxuZnVuY3Rpb24gZ2V0Q29sb3JGb3JtYXQoIHZhbHVlICkge1xuXHRyZXR1cm4gRk9STUFUUy5maW5kKCBmb3JtYXQgPT4gZm9ybWF0Lm1hdGNoKCB2YWx1ZSApICk7XG59XG5cbmNsYXNzIENvbG9yQ29udHJvbGxlciBleHRlbmRzIENvbnRyb2xsZXIge1xuXG5cdGNvbnN0cnVjdG9yKCBwYXJlbnQsIG9iamVjdCwgcHJvcGVydHksIHJnYlNjYWxlICkge1xuXG5cdFx0c3VwZXIoIHBhcmVudCwgb2JqZWN0LCBwcm9wZXJ0eSwgJ2NvbG9yJyApO1xuXG5cdFx0dGhpcy4kaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW5wdXQnICk7XG5cdFx0dGhpcy4kaW5wdXQuc2V0QXR0cmlidXRlKCAndHlwZScsICdjb2xvcicgKTtcblx0XHR0aGlzLiRpbnB1dC5zZXRBdHRyaWJ1dGUoICd0YWJpbmRleCcsIC0xICk7XG5cdFx0dGhpcy4kaW5wdXQuc2V0QXR0cmlidXRlKCAnYXJpYS1sYWJlbGxlZGJ5JywgdGhpcy4kbmFtZS5pZCApO1xuXG5cdFx0dGhpcy4kdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdpbnB1dCcgKTtcblx0XHR0aGlzLiR0ZXh0LnNldEF0dHJpYnV0ZSggJ3R5cGUnLCAndGV4dCcgKTtcblx0XHR0aGlzLiR0ZXh0LnNldEF0dHJpYnV0ZSggJ3NwZWxsY2hlY2snLCAnZmFsc2UnICk7XG5cdFx0dGhpcy4kdGV4dC5zZXRBdHRyaWJ1dGUoICdhcmlhLWxhYmVsbGVkYnknLCB0aGlzLiRuYW1lLmlkICk7XG5cblx0XHR0aGlzLiRkaXNwbGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHR0aGlzLiRkaXNwbGF5LmNsYXNzTGlzdC5hZGQoICdkaXNwbGF5JyApO1xuXG5cdFx0dGhpcy4kZGlzcGxheS5hcHBlbmRDaGlsZCggdGhpcy4kaW5wdXQgKTtcblx0XHR0aGlzLiR3aWRnZXQuYXBwZW5kQ2hpbGQoIHRoaXMuJGRpc3BsYXkgKTtcblx0XHR0aGlzLiR3aWRnZXQuYXBwZW5kQ2hpbGQoIHRoaXMuJHRleHQgKTtcblxuXHRcdHRoaXMuX2Zvcm1hdCA9IGdldENvbG9yRm9ybWF0KCB0aGlzLmluaXRpYWxWYWx1ZSApO1xuXHRcdHRoaXMuX3JnYlNjYWxlID0gcmdiU2NhbGU7XG5cblx0XHR0aGlzLl9pbml0aWFsVmFsdWVIZXhTdHJpbmcgPSB0aGlzLnNhdmUoKTtcblx0XHR0aGlzLl90ZXh0Rm9jdXNlZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy4kaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciggJ2lucHV0JywgKCkgPT4ge1xuXHRcdFx0dGhpcy5fc2V0VmFsdWVGcm9tSGV4U3RyaW5nKCB0aGlzLiRpbnB1dC52YWx1ZSApO1xuXHRcdH0gKTtcblxuXHRcdHRoaXMuJGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoICdibHVyJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5fY2FsbE9uRmluaXNoQ2hhbmdlKCk7XG5cdFx0fSApO1xuXG5cdFx0dGhpcy4kdGV4dC5hZGRFdmVudExpc3RlbmVyKCAnaW5wdXQnLCAoKSA9PiB7XG5cdFx0XHRjb25zdCB0cnlQYXJzZSA9IG5vcm1hbGl6ZUNvbG9yU3RyaW5nKCB0aGlzLiR0ZXh0LnZhbHVlICk7XG5cdFx0XHRpZiAoIHRyeVBhcnNlICkge1xuXHRcdFx0XHR0aGlzLl9zZXRWYWx1ZUZyb21IZXhTdHJpbmcoIHRyeVBhcnNlICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0dGhpcy4kdGV4dC5hZGRFdmVudExpc3RlbmVyKCAnZm9jdXMnLCAoKSA9PiB7XG5cdFx0XHR0aGlzLl90ZXh0Rm9jdXNlZCA9IHRydWU7XG5cdFx0XHR0aGlzLiR0ZXh0LnNlbGVjdCgpO1xuXHRcdH0gKTtcblxuXHRcdHRoaXMuJHRleHQuYWRkRXZlbnRMaXN0ZW5lciggJ2JsdXInLCAoKSA9PiB7XG5cdFx0XHR0aGlzLl90ZXh0Rm9jdXNlZCA9IGZhbHNlO1xuXHRcdFx0dGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cdFx0XHR0aGlzLl9jYWxsT25GaW5pc2hDaGFuZ2UoKTtcblx0XHR9ICk7XG5cblx0XHR0aGlzLiRkaXNhYmxlID0gdGhpcy4kdGV4dDtcblxuXHRcdHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG5cdH1cblxuXHRyZXNldCgpIHtcblx0XHR0aGlzLl9zZXRWYWx1ZUZyb21IZXhTdHJpbmcoIHRoaXMuX2luaXRpYWxWYWx1ZUhleFN0cmluZyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0X3NldFZhbHVlRnJvbUhleFN0cmluZyggdmFsdWUgKSB7XG5cblx0XHRpZiAoIHRoaXMuX2Zvcm1hdC5pc1ByaW1pdGl2ZSApIHtcblxuXHRcdFx0Y29uc3QgbmV3VmFsdWUgPSB0aGlzLl9mb3JtYXQuZnJvbUhleFN0cmluZyggdmFsdWUgKTtcblx0XHRcdHRoaXMuc2V0VmFsdWUoIG5ld1ZhbHVlICk7XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHR0aGlzLl9mb3JtYXQuZnJvbUhleFN0cmluZyggdmFsdWUsIHRoaXMuZ2V0VmFsdWUoKSwgdGhpcy5fcmdiU2NhbGUgKTtcblx0XHRcdHRoaXMuX2NhbGxPbkNoYW5nZSgpO1xuXHRcdFx0dGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cblx0XHR9XG5cblx0fVxuXG5cdHNhdmUoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2Zvcm1hdC50b0hleFN0cmluZyggdGhpcy5nZXRWYWx1ZSgpLCB0aGlzLl9yZ2JTY2FsZSApO1xuXHR9XG5cblx0bG9hZCggdmFsdWUgKSB7XG5cdFx0dGhpcy5fc2V0VmFsdWVGcm9tSGV4U3RyaW5nKCB2YWx1ZSApO1xuXHRcdHRoaXMuX2NhbGxPbkZpbmlzaENoYW5nZSgpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0dXBkYXRlRGlzcGxheSgpIHtcblx0XHR0aGlzLiRpbnB1dC52YWx1ZSA9IHRoaXMuX2Zvcm1hdC50b0hleFN0cmluZyggdGhpcy5nZXRWYWx1ZSgpLCB0aGlzLl9yZ2JTY2FsZSApO1xuXHRcdGlmICggIXRoaXMuX3RleHRGb2N1c2VkICkge1xuXHRcdFx0dGhpcy4kdGV4dC52YWx1ZSA9IHRoaXMuJGlucHV0LnZhbHVlLnN1YnN0cmluZyggMSApO1xuXHRcdH1cblx0XHR0aGlzLiRkaXNwbGF5LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMuJGlucHV0LnZhbHVlO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn1cblxuY2xhc3MgRnVuY3Rpb25Db250cm9sbGVyIGV4dGVuZHMgQ29udHJvbGxlciB7XG5cblx0Y29uc3RydWN0b3IoIHBhcmVudCwgb2JqZWN0LCBwcm9wZXJ0eSApIHtcblxuXHRcdHN1cGVyKCBwYXJlbnQsIG9iamVjdCwgcHJvcGVydHksICdmdW5jdGlvbicgKTtcblxuXHRcdC8vIEJ1dHRvbnMgYXJlIHRoZSBvbmx5IGNhc2Ugd2hlcmUgd2lkZ2V0IGNvbnRhaW5zIG5hbWVcblx0XHR0aGlzLiRidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnYnV0dG9uJyApO1xuXHRcdHRoaXMuJGJ1dHRvbi5hcHBlbmRDaGlsZCggdGhpcy4kbmFtZSApO1xuXHRcdHRoaXMuJHdpZGdldC5hcHBlbmRDaGlsZCggdGhpcy4kYnV0dG9uICk7XG5cblx0XHR0aGlzLiRidXR0b24uYWRkRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgZSA9PiB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLmdldFZhbHVlKCkuY2FsbCggdGhpcy5vYmplY3QgKTtcblx0XHRcdHRoaXMuX2NhbGxPbkNoYW5nZSgpO1xuXHRcdH0gKTtcblxuXHRcdC8vIGVuYWJsZXMgOmFjdGl2ZSBwc2V1ZG8gY2xhc3Mgb24gbW9iaWxlXG5cdFx0dGhpcy4kYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaHN0YXJ0JywgKCkgPT4ge30sIHsgcGFzc2l2ZTogdHJ1ZSB9ICk7XG5cblx0XHR0aGlzLiRkaXNhYmxlID0gdGhpcy4kYnV0dG9uO1xuXG5cdH1cblxufVxuXG5jbGFzcyBOdW1iZXJDb250cm9sbGVyIGV4dGVuZHMgQ29udHJvbGxlciB7XG5cblx0Y29uc3RydWN0b3IoIHBhcmVudCwgb2JqZWN0LCBwcm9wZXJ0eSwgbWluLCBtYXgsIHN0ZXAgKSB7XG5cblx0XHRzdXBlciggcGFyZW50LCBvYmplY3QsIHByb3BlcnR5LCAnbnVtYmVyJyApO1xuXG5cdFx0dGhpcy5faW5pdElucHV0KCk7XG5cblx0XHR0aGlzLm1pbiggbWluICk7XG5cdFx0dGhpcy5tYXgoIG1heCApO1xuXG5cdFx0Y29uc3Qgc3RlcEV4cGxpY2l0ID0gc3RlcCAhPT0gdW5kZWZpbmVkO1xuXHRcdHRoaXMuc3RlcCggc3RlcEV4cGxpY2l0ID8gc3RlcCA6IHRoaXMuX2dldEltcGxpY2l0U3RlcCgpLCBzdGVwRXhwbGljaXQgKTtcblxuXHRcdHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG5cdH1cblxuXHRkZWNpbWFscyggZGVjaW1hbHMgKSB7XG5cdFx0dGhpcy5fZGVjaW1hbHMgPSBkZWNpbWFscztcblx0XHR0aGlzLnVwZGF0ZURpc3BsYXkoKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdG1pbiggbWluICkge1xuXHRcdHRoaXMuX21pbiA9IG1pbjtcblx0XHR0aGlzLl9vblVwZGF0ZU1pbk1heCgpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0bWF4KCBtYXggKSB7XG5cdFx0dGhpcy5fbWF4ID0gbWF4O1xuXHRcdHRoaXMuX29uVXBkYXRlTWluTWF4KCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRzdGVwKCBzdGVwLCBleHBsaWNpdCA9IHRydWUgKSB7XG5cdFx0dGhpcy5fc3RlcCA9IHN0ZXA7XG5cdFx0dGhpcy5fc3RlcEV4cGxpY2l0ID0gZXhwbGljaXQ7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHR1cGRhdGVEaXNwbGF5KCkge1xuXG5cdFx0Y29uc3QgdmFsdWUgPSB0aGlzLmdldFZhbHVlKCk7XG5cblx0XHRpZiAoIHRoaXMuX2hhc1NsaWRlciApIHtcblxuXHRcdFx0bGV0IHBlcmNlbnQgPSAoIHZhbHVlIC0gdGhpcy5fbWluICkgLyAoIHRoaXMuX21heCAtIHRoaXMuX21pbiApO1xuXHRcdFx0cGVyY2VudCA9IE1hdGgubWF4KCAwLCBNYXRoLm1pbiggcGVyY2VudCwgMSApICk7XG5cblx0XHRcdHRoaXMuJGZpbGwuc3R5bGUud2lkdGggPSBwZXJjZW50ICogMTAwICsgJyUnO1xuXG5cdFx0fVxuXG5cdFx0aWYgKCAhdGhpcy5faW5wdXRGb2N1c2VkICkge1xuXHRcdFx0dGhpcy4kaW5wdXQudmFsdWUgPSB0aGlzLl9kZWNpbWFscyA9PT0gdW5kZWZpbmVkID8gdmFsdWUgOiB2YWx1ZS50b0ZpeGVkKCB0aGlzLl9kZWNpbWFscyApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH1cblxuXHRfaW5pdElucHV0KCkge1xuXG5cdFx0dGhpcy4kaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW5wdXQnICk7XG5cdFx0dGhpcy4kaW5wdXQuc2V0QXR0cmlidXRlKCAndHlwZScsICd0ZXh0JyApO1xuXHRcdHRoaXMuJGlucHV0LnNldEF0dHJpYnV0ZSggJ2FyaWEtbGFiZWxsZWRieScsIHRoaXMuJG5hbWUuaWQgKTtcblxuXHRcdC8vIE9uIHRvdWNoIGRldmljZXMgb25seSwgdXNlIGlucHV0W3R5cGU9bnVtYmVyXSB0byBmb3JjZSBhIG51bWVyaWMga2V5Ym9hcmQuXG5cdFx0Ly8gSWRlYWxseSB3ZSBjb3VsZCB1c2Ugb25lIGlucHV0IHR5cGUgZXZlcnl3aGVyZSwgYnV0IFt0eXBlPW51bWJlcl0gaGFzIHF1aXJrc1xuXHRcdC8vIG9uIGRlc2t0b3AsIGFuZCBbaW5wdXRtb2RlPWRlY2ltYWxdIGhhcyBxdWlya3Mgb24gaU9TLlxuXHRcdC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZ2VvcmdlYWx3YXlzL2xpbC1ndWkvcHVsbC8xNlxuXG5cdFx0Y29uc3QgaXNUb3VjaCA9IHdpbmRvdy5tYXRjaE1lZGlhKCAnKHBvaW50ZXI6IGNvYXJzZSknICkubWF0Y2hlcztcblxuXHRcdGlmICggaXNUb3VjaCApIHtcblx0XHRcdHRoaXMuJGlucHV0LnNldEF0dHJpYnV0ZSggJ3R5cGUnLCAnbnVtYmVyJyApO1xuXHRcdFx0dGhpcy4kaW5wdXQuc2V0QXR0cmlidXRlKCAnc3RlcCcsICdhbnknICk7XG5cdFx0fVxuXG5cdFx0dGhpcy4kd2lkZ2V0LmFwcGVuZENoaWxkKCB0aGlzLiRpbnB1dCApO1xuXG5cdFx0dGhpcy4kZGlzYWJsZSA9IHRoaXMuJGlucHV0O1xuXG5cdFx0Y29uc3Qgb25JbnB1dCA9ICgpID0+IHtcblxuXHRcdFx0bGV0IHZhbHVlID0gcGFyc2VGbG9hdCggdGhpcy4kaW5wdXQudmFsdWUgKTtcblxuXHRcdFx0aWYgKCBpc05hTiggdmFsdWUgKSApIHJldHVybjtcblxuXHRcdFx0aWYgKCB0aGlzLl9zdGVwRXhwbGljaXQgKSB7XG5cdFx0XHRcdHZhbHVlID0gdGhpcy5fc25hcCggdmFsdWUgKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zZXRWYWx1ZSggdGhpcy5fY2xhbXAoIHZhbHVlICkgKTtcblxuXHRcdH07XG5cblx0XHQvLyBLZXlzICYgbW91c2Ugd2hlZWxcblx0XHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRcdGNvbnN0IGluY3JlbWVudCA9IGRlbHRhID0+IHtcblxuXHRcdFx0Y29uc3QgdmFsdWUgPSBwYXJzZUZsb2F0KCB0aGlzLiRpbnB1dC52YWx1ZSApO1xuXG5cdFx0XHRpZiAoIGlzTmFOKCB2YWx1ZSApICkgcmV0dXJuO1xuXG5cdFx0XHR0aGlzLl9zbmFwQ2xhbXBTZXRWYWx1ZSggdmFsdWUgKyBkZWx0YSApO1xuXG5cdFx0XHQvLyBGb3JjZSB0aGUgaW5wdXQgdG8gdXBkYXRlRGlzcGxheSB3aGVuIGl0J3MgZm9jdXNlZFxuXHRcdFx0dGhpcy4kaW5wdXQudmFsdWUgPSB0aGlzLmdldFZhbHVlKCk7XG5cblx0XHR9O1xuXG5cdFx0Y29uc3Qgb25LZXlEb3duID0gZSA9PiB7XG5cdFx0XHQvLyBVc2luZyBgZS5rZXlgIGluc3RlYWQgb2YgYGUuY29kZWAgYWxzbyBjYXRjaGVzIE51bXBhZEVudGVyXG5cdFx0XHRpZiAoIGUua2V5ID09PSAnRW50ZXInICkge1xuXHRcdFx0XHR0aGlzLiRpbnB1dC5ibHVyKCk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIGUuY29kZSA9PT0gJ0Fycm93VXAnICkge1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdGluY3JlbWVudCggdGhpcy5fc3RlcCAqIHRoaXMuX2Fycm93S2V5TXVsdGlwbGllciggZSApICk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIGUuY29kZSA9PT0gJ0Fycm93RG93bicgKSB7XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0aW5jcmVtZW50KCB0aGlzLl9zdGVwICogdGhpcy5fYXJyb3dLZXlNdWx0aXBsaWVyKCBlICkgKiAtMSApO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCBvbldoZWVsID0gZSA9PiB7XG5cdFx0XHRpZiAoIHRoaXMuX2lucHV0Rm9jdXNlZCApIHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRpbmNyZW1lbnQoIHRoaXMuX3N0ZXAgKiB0aGlzLl9ub3JtYWxpemVNb3VzZVdoZWVsKCBlICkgKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gVmVydGljYWwgZHJhZ1xuXHRcdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdFx0bGV0IHRlc3RpbmdGb3JWZXJ0aWNhbERyYWcgPSBmYWxzZSxcblx0XHRcdGluaXRDbGllbnRYLFxuXHRcdFx0aW5pdENsaWVudFksXG5cdFx0XHRwcmV2Q2xpZW50WSxcblx0XHRcdGluaXRWYWx1ZSxcblx0XHRcdGRyYWdEZWx0YTtcblxuXHRcdC8vIE9uY2UgdGhlIG1vdXNlIGlzIGRyYWdnZWQgbW9yZSB0aGFuIERSQUdfVEhSRVNIIHB4IG9uIGFueSBheGlzLCB3ZSBkZWNpZGVcblx0XHQvLyBvbiB0aGUgdXNlcidzIGludGVudDogaG9yaXpvbnRhbCBtZWFucyBoaWdobGlnaHQsIHZlcnRpY2FsIG1lYW5zIGRyYWcuXG5cdFx0Y29uc3QgRFJBR19USFJFU0ggPSA1O1xuXG5cdFx0Y29uc3Qgb25Nb3VzZURvd24gPSBlID0+IHtcblxuXHRcdFx0aW5pdENsaWVudFggPSBlLmNsaWVudFg7XG5cdFx0XHRpbml0Q2xpZW50WSA9IHByZXZDbGllbnRZID0gZS5jbGllbnRZO1xuXHRcdFx0dGVzdGluZ0ZvclZlcnRpY2FsRHJhZyA9IHRydWU7XG5cblx0XHRcdGluaXRWYWx1ZSA9IHRoaXMuZ2V0VmFsdWUoKTtcblx0XHRcdGRyYWdEZWx0YSA9IDA7XG5cblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUgKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnbW91c2V1cCcsIG9uTW91c2VVcCApO1xuXG5cdFx0fTtcblxuXHRcdGNvbnN0IG9uTW91c2VNb3ZlID0gZSA9PiB7XG5cblx0XHRcdGlmICggdGVzdGluZ0ZvclZlcnRpY2FsRHJhZyApIHtcblxuXHRcdFx0XHRjb25zdCBkeCA9IGUuY2xpZW50WCAtIGluaXRDbGllbnRYO1xuXHRcdFx0XHRjb25zdCBkeSA9IGUuY2xpZW50WSAtIGluaXRDbGllbnRZO1xuXG5cdFx0XHRcdGlmICggTWF0aC5hYnMoIGR5ICkgPiBEUkFHX1RIUkVTSCApIHtcblxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR0aGlzLiRpbnB1dC5ibHVyKCk7XG5cdFx0XHRcdFx0dGVzdGluZ0ZvclZlcnRpY2FsRHJhZyA9IGZhbHNlO1xuXHRcdFx0XHRcdHRoaXMuX3NldERyYWdnaW5nU3R5bGUoIHRydWUsICd2ZXJ0aWNhbCcgKTtcblxuXHRcdFx0XHR9IGVsc2UgaWYgKCBNYXRoLmFicyggZHggKSA+IERSQUdfVEhSRVNIICkge1xuXG5cdFx0XHRcdFx0b25Nb3VzZVVwKCk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdC8vIFRoaXMgaXNuJ3QgYW4gZWxzZSBzbyB0aGF0IHRoZSBmaXJzdCBtb3ZlIGNvdW50cyB0b3dhcmRzIGRyYWdEZWx0YVxuXHRcdFx0aWYgKCAhdGVzdGluZ0ZvclZlcnRpY2FsRHJhZyApIHtcblxuXHRcdFx0XHRjb25zdCBkeSA9IGUuY2xpZW50WSAtIHByZXZDbGllbnRZO1xuXG5cdFx0XHRcdGRyYWdEZWx0YSAtPSBkeSAqIHRoaXMuX3N0ZXAgKiB0aGlzLl9hcnJvd0tleU11bHRpcGxpZXIoIGUgKTtcblxuXHRcdFx0XHQvLyBDbGFtcCBkcmFnRGVsdGEgc28gd2UgZG9uJ3QgaGF2ZSAnZGVhZCBzcGFjZScgYWZ0ZXIgZHJhZ2dpbmcgcGFzdCBib3VuZHMuXG5cdFx0XHRcdC8vIFdlJ3JlIG9rYXkgd2l0aCB0aGUgZmFjdCB0aGF0IGJvdW5kcyBjYW4gYmUgdW5kZWZpbmVkIGhlcmUuXG5cdFx0XHRcdGlmICggaW5pdFZhbHVlICsgZHJhZ0RlbHRhID4gdGhpcy5fbWF4ICkge1xuXHRcdFx0XHRcdGRyYWdEZWx0YSA9IHRoaXMuX21heCAtIGluaXRWYWx1ZTtcblx0XHRcdFx0fSBlbHNlIGlmICggaW5pdFZhbHVlICsgZHJhZ0RlbHRhIDwgdGhpcy5fbWluICkge1xuXHRcdFx0XHRcdGRyYWdEZWx0YSA9IHRoaXMuX21pbiAtIGluaXRWYWx1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuX3NuYXBDbGFtcFNldFZhbHVlKCBpbml0VmFsdWUgKyBkcmFnRGVsdGEgKTtcblxuXHRcdFx0fVxuXG5cdFx0XHRwcmV2Q2xpZW50WSA9IGUuY2xpZW50WTtcblxuXHRcdH07XG5cblx0XHRjb25zdCBvbk1vdXNlVXAgPSAoKSA9PiB7XG5cdFx0XHR0aGlzLl9zZXREcmFnZ2luZ1N0eWxlKCBmYWxzZSwgJ3ZlcnRpY2FsJyApO1xuXHRcdFx0dGhpcy5fY2FsbE9uRmluaXNoQ2hhbmdlKCk7XG5cdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlICk7XG5cdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ21vdXNldXAnLCBvbk1vdXNlVXAgKTtcblx0XHR9O1xuXG5cdFx0Ly8gRm9jdXMgc3RhdGUgJiBvbkZpbmlzaENoYW5nZVxuXHRcdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdFx0Y29uc3Qgb25Gb2N1cyA9ICgpID0+IHtcblx0XHRcdHRoaXMuX2lucHV0Rm9jdXNlZCA9IHRydWU7XG5cdFx0fTtcblxuXHRcdGNvbnN0IG9uQmx1ciA9ICgpID0+IHtcblx0XHRcdHRoaXMuX2lucHV0Rm9jdXNlZCA9IGZhbHNlO1xuXHRcdFx0dGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cdFx0XHR0aGlzLl9jYWxsT25GaW5pc2hDaGFuZ2UoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy4kaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciggJ2lucHV0Jywgb25JbnB1dCApO1xuXHRcdHRoaXMuJGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoICdrZXlkb3duJywgb25LZXlEb3duICk7XG5cdFx0dGhpcy4kaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciggJ3doZWVsJywgb25XaGVlbCwgeyBwYXNzaXZlOiBmYWxzZSB9ICk7XG5cdFx0dGhpcy4kaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciggJ21vdXNlZG93bicsIG9uTW91c2VEb3duICk7XG5cdFx0dGhpcy4kaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciggJ2ZvY3VzJywgb25Gb2N1cyApO1xuXHRcdHRoaXMuJGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoICdibHVyJywgb25CbHVyICk7XG5cblx0fVxuXG5cdF9pbml0U2xpZGVyKCkge1xuXG5cdFx0dGhpcy5faGFzU2xpZGVyID0gdHJ1ZTtcblxuXHRcdC8vIEJ1aWxkIERPTVxuXHRcdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdFx0dGhpcy4kc2xpZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHR0aGlzLiRzbGlkZXIuY2xhc3NMaXN0LmFkZCggJ3NsaWRlcicgKTtcblxuXHRcdHRoaXMuJGZpbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRcdHRoaXMuJGZpbGwuY2xhc3NMaXN0LmFkZCggJ2ZpbGwnICk7XG5cblx0XHR0aGlzLiRzbGlkZXIuYXBwZW5kQ2hpbGQoIHRoaXMuJGZpbGwgKTtcblx0XHR0aGlzLiR3aWRnZXQuaW5zZXJ0QmVmb3JlKCB0aGlzLiRzbGlkZXIsIHRoaXMuJGlucHV0ICk7XG5cblx0XHR0aGlzLmRvbUVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ2hhc1NsaWRlcicgKTtcblxuXHRcdC8vIE1hcCBjbGllbnRYIHRvIHZhbHVlXG5cdFx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0XHRjb25zdCBtYXAgPSAoIHYsIGEsIGIsIGMsIGQgKSA9PiB7XG5cdFx0XHRyZXR1cm4gKCB2IC0gYSApIC8gKCBiIC0gYSApICogKCBkIC0gYyApICsgYztcblx0XHR9O1xuXG5cdFx0Y29uc3Qgc2V0VmFsdWVGcm9tWCA9IGNsaWVudFggPT4ge1xuXHRcdFx0Y29uc3QgcmVjdCA9IHRoaXMuJHNsaWRlci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdGxldCB2YWx1ZSA9IG1hcCggY2xpZW50WCwgcmVjdC5sZWZ0LCByZWN0LnJpZ2h0LCB0aGlzLl9taW4sIHRoaXMuX21heCApO1xuXHRcdFx0dGhpcy5fc25hcENsYW1wU2V0VmFsdWUoIHZhbHVlICk7XG5cdFx0fTtcblxuXHRcdC8vIE1vdXNlIGRyYWdcblx0XHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRcdGNvbnN0IG1vdXNlRG93biA9IGUgPT4ge1xuXHRcdFx0dGhpcy5fc2V0RHJhZ2dpbmdTdHlsZSggdHJ1ZSApO1xuXHRcdFx0c2V0VmFsdWVGcm9tWCggZS5jbGllbnRYICk7XG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ21vdXNlbW92ZScsIG1vdXNlTW92ZSApO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZXVwJywgbW91c2VVcCApO1xuXHRcdH07XG5cblx0XHRjb25zdCBtb3VzZU1vdmUgPSBlID0+IHtcblx0XHRcdHNldFZhbHVlRnJvbVgoIGUuY2xpZW50WCApO1xuXHRcdH07XG5cblx0XHRjb25zdCBtb3VzZVVwID0gKCkgPT4ge1xuXHRcdFx0dGhpcy5fY2FsbE9uRmluaXNoQ2hhbmdlKCk7XG5cdFx0XHR0aGlzLl9zZXREcmFnZ2luZ1N0eWxlKCBmYWxzZSApO1xuXHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdtb3VzZW1vdmUnLCBtb3VzZU1vdmUgKTtcblx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCAnbW91c2V1cCcsIG1vdXNlVXAgKTtcblx0XHR9O1xuXG5cdFx0Ly8gVG91Y2ggZHJhZ1xuXHRcdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdFx0bGV0IHRlc3RpbmdGb3JTY3JvbGwgPSBmYWxzZSwgcHJldkNsaWVudFgsIHByZXZDbGllbnRZO1xuXG5cdFx0Y29uc3QgYmVnaW5Ub3VjaERyYWcgPSBlID0+IHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHRoaXMuX3NldERyYWdnaW5nU3R5bGUoIHRydWUgKTtcblx0XHRcdHNldFZhbHVlRnJvbVgoIGUudG91Y2hlc1sgMCBdLmNsaWVudFggKTtcblx0XHRcdHRlc3RpbmdGb3JTY3JvbGwgPSBmYWxzZTtcblx0XHR9O1xuXG5cdFx0Y29uc3Qgb25Ub3VjaFN0YXJ0ID0gZSA9PiB7XG5cblx0XHRcdGlmICggZS50b3VjaGVzLmxlbmd0aCA+IDEgKSByZXR1cm47XG5cblx0XHRcdC8vIElmIHdlJ3JlIGluIGEgc2Nyb2xsYWJsZSBjb250YWluZXIsIHdlIHNob3VsZCB3YWl0IGZvciB0aGUgZmlyc3Rcblx0XHRcdC8vIHRvdWNobW92ZSB0byBzZWUgaWYgdGhlIHVzZXIgaXMgdHJ5aW5nIHRvIHNsaWRlIG9yIHNjcm9sbC5cblx0XHRcdGlmICggdGhpcy5faGFzU2Nyb2xsQmFyICkge1xuXG5cdFx0XHRcdHByZXZDbGllbnRYID0gZS50b3VjaGVzWyAwIF0uY2xpZW50WDtcblx0XHRcdFx0cHJldkNsaWVudFkgPSBlLnRvdWNoZXNbIDAgXS5jbGllbnRZO1xuXHRcdFx0XHR0ZXN0aW5nRm9yU2Nyb2xsID0gdHJ1ZTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBPdGhlcndpc2UsIHdlIGNhbiBzZXQgdGhlIHZhbHVlIHN0cmFpZ2h0IGF3YXkgb24gdG91Y2hzdGFydC5cblx0XHRcdFx0YmVnaW5Ub3VjaERyYWcoIGUgKTtcblxuXHRcdFx0fVxuXG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCB7IHBhc3NpdmU6IGZhbHNlIH0gKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAndG91Y2hlbmQnLCBvblRvdWNoRW5kICk7XG5cblx0XHR9O1xuXG5cdFx0Y29uc3Qgb25Ub3VjaE1vdmUgPSBlID0+IHtcblxuXHRcdFx0aWYgKCB0ZXN0aW5nRm9yU2Nyb2xsICkge1xuXG5cdFx0XHRcdGNvbnN0IGR4ID0gZS50b3VjaGVzWyAwIF0uY2xpZW50WCAtIHByZXZDbGllbnRYO1xuXHRcdFx0XHRjb25zdCBkeSA9IGUudG91Y2hlc1sgMCBdLmNsaWVudFkgLSBwcmV2Q2xpZW50WTtcblxuXHRcdFx0XHRpZiAoIE1hdGguYWJzKCBkeCApID4gTWF0aC5hYnMoIGR5ICkgKSB7XG5cblx0XHRcdFx0XHQvLyBXZSBtb3ZlZCBob3Jpem9udGFsbHksIHNldCB0aGUgdmFsdWUgYW5kIHN0b3AgY2hlY2tpbmcuXG5cdFx0XHRcdFx0YmVnaW5Ub3VjaERyYWcoIGUgKTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdFx0Ly8gVGhpcyB3YXMsIGluIGZhY3QsIGFuIGF0dGVtcHQgdG8gc2Nyb2xsLiBBYm9ydC5cblx0XHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlICk7XG5cdFx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICd0b3VjaGVuZCcsIG9uVG91Y2hFbmQgKTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRzZXRWYWx1ZUZyb21YKCBlLnRvdWNoZXNbIDAgXS5jbGllbnRYICk7XG5cblx0XHRcdH1cblxuXHRcdH07XG5cblx0XHRjb25zdCBvblRvdWNoRW5kID0gKCkgPT4ge1xuXHRcdFx0dGhpcy5fY2FsbE9uRmluaXNoQ2hhbmdlKCk7XG5cdFx0XHR0aGlzLl9zZXREcmFnZ2luZ1N0eWxlKCBmYWxzZSApO1xuXHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSApO1xuXHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICd0b3VjaGVuZCcsIG9uVG91Y2hFbmQgKTtcblx0XHR9O1xuXG5cdFx0Ly8gTW91c2Ugd2hlZWxcblx0XHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRcdC8vIFdlIGhhdmUgdG8gdXNlIGEgZGVib3VuY2VkIGZ1bmN0aW9uIHRvIGNhbGwgb25GaW5pc2hDaGFuZ2UgYmVjYXVzZVxuXHRcdC8vIHRoZXJlJ3Mgbm8gd2F5IHRvIHRlbGwgd2hlbiB0aGUgdXNlciBpcyBcImRvbmVcIiBtb3VzZS13aGVlbGluZy5cblx0XHRjb25zdCBjYWxsT25GaW5pc2hDaGFuZ2UgPSB0aGlzLl9jYWxsT25GaW5pc2hDaGFuZ2UuYmluZCggdGhpcyApO1xuXHRcdGNvbnN0IFdIRUVMX0RFQk9VTkNFX1RJTUUgPSA0MDA7XG5cdFx0bGV0IHdoZWVsRmluaXNoQ2hhbmdlVGltZW91dDtcblxuXHRcdGNvbnN0IG9uV2hlZWwgPSBlID0+IHtcblxuXHRcdFx0Ly8gaWdub3JlIHZlcnRpY2FsIHdoZWVscyBpZiB0aGVyZSdzIGEgc2Nyb2xsYmFyXG5cdFx0XHRjb25zdCBpc1ZlcnRpY2FsID0gTWF0aC5hYnMoIGUuZGVsdGFYICkgPCBNYXRoLmFicyggZS5kZWx0YVkgKTtcblx0XHRcdGlmICggaXNWZXJ0aWNhbCAmJiB0aGlzLl9oYXNTY3JvbGxCYXIgKSByZXR1cm47XG5cblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0Ly8gc2V0IHZhbHVlXG5cdFx0XHRjb25zdCBkZWx0YSA9IHRoaXMuX25vcm1hbGl6ZU1vdXNlV2hlZWwoIGUgKSAqIHRoaXMuX3N0ZXA7XG5cdFx0XHR0aGlzLl9zbmFwQ2xhbXBTZXRWYWx1ZSggdGhpcy5nZXRWYWx1ZSgpICsgZGVsdGEgKTtcblxuXHRcdFx0Ly8gZm9yY2UgdGhlIGlucHV0IHRvIHVwZGF0ZURpc3BsYXkgd2hlbiBpdCdzIGZvY3VzZWRcblx0XHRcdHRoaXMuJGlucHV0LnZhbHVlID0gdGhpcy5nZXRWYWx1ZSgpO1xuXG5cdFx0XHQvLyBkZWJvdW5jZSBvbkZpbmlzaENoYW5nZVxuXHRcdFx0Y2xlYXJUaW1lb3V0KCB3aGVlbEZpbmlzaENoYW5nZVRpbWVvdXQgKTtcblx0XHRcdHdoZWVsRmluaXNoQ2hhbmdlVGltZW91dCA9IHNldFRpbWVvdXQoIGNhbGxPbkZpbmlzaENoYW5nZSwgV0hFRUxfREVCT1VOQ0VfVElNRSApO1xuXG5cdFx0fTtcblxuXHRcdHRoaXMuJHNsaWRlci5hZGRFdmVudExpc3RlbmVyKCAnbW91c2Vkb3duJywgbW91c2VEb3duICk7XG5cdFx0dGhpcy4kc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0LCB7IHBhc3NpdmU6IGZhbHNlIH0gKTtcblx0XHR0aGlzLiRzbGlkZXIuYWRkRXZlbnRMaXN0ZW5lciggJ3doZWVsJywgb25XaGVlbCwgeyBwYXNzaXZlOiBmYWxzZSB9ICk7XG5cblx0fVxuXG5cdF9zZXREcmFnZ2luZ1N0eWxlKCBhY3RpdmUsIGF4aXMgPSAnaG9yaXpvbnRhbCcgKSB7XG5cdFx0aWYgKCB0aGlzLiRzbGlkZXIgKSB7XG5cdFx0XHR0aGlzLiRzbGlkZXIuY2xhc3NMaXN0LnRvZ2dsZSggJ2FjdGl2ZScsIGFjdGl2ZSApO1xuXHRcdH1cblx0XHRkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoICdsaWwtZ3VpLWRyYWdnaW5nJywgYWN0aXZlICk7XG5cdFx0ZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QudG9nZ2xlKCBgbGlsLWd1aS0ke2F4aXN9YCwgYWN0aXZlICk7XG5cdH1cblxuXHRfZ2V0SW1wbGljaXRTdGVwKCkge1xuXG5cdFx0aWYgKCB0aGlzLl9oYXNNaW4gJiYgdGhpcy5faGFzTWF4ICkge1xuXHRcdFx0cmV0dXJuICggdGhpcy5fbWF4IC0gdGhpcy5fbWluICkgLyAxMDAwO1xuXHRcdH1cblxuXHRcdHJldHVybiAwLjE7XG5cblx0fVxuXG5cdF9vblVwZGF0ZU1pbk1heCgpIHtcblxuXHRcdGlmICggIXRoaXMuX2hhc1NsaWRlciAmJiB0aGlzLl9oYXNNaW4gJiYgdGhpcy5faGFzTWF4ICkge1xuXG5cdFx0XHQvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHdlJ3JlIGhlYXJpbmcgYWJvdXQgbWluIGFuZCBtYXhcblx0XHRcdC8vIGFuZCB3ZSBoYXZlbid0IGV4cGxpY2l0bHkgc3RhdGVkIHdoYXQgb3VyIHN0ZXAgaXMsIGxldCdzXG5cdFx0XHQvLyB1cGRhdGUgdGhhdCB0b28uXG5cdFx0XHRpZiAoICF0aGlzLl9zdGVwRXhwbGljaXQgKSB7XG5cdFx0XHRcdHRoaXMuc3RlcCggdGhpcy5fZ2V0SW1wbGljaXRTdGVwKCksIGZhbHNlICk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX2luaXRTbGlkZXIoKTtcblx0XHRcdHRoaXMudXBkYXRlRGlzcGxheSgpO1xuXG5cdFx0fVxuXG5cdH1cblxuXHRfbm9ybWFsaXplTW91c2VXaGVlbCggZSApIHtcblxuXHRcdGxldCB7IGRlbHRhWCwgZGVsdGFZIH0gPSBlO1xuXG5cdFx0Ly8gU2FmYXJpIGFuZCBDaHJvbWUgcmVwb3J0IHdlaXJkIG5vbi1pbnRlZ3JhbCB2YWx1ZXMgZm9yIGEgbm90Y2hlZCB3aGVlbCxcblx0XHQvLyBidXQgc3RpbGwgZXhwb3NlIGFjdHVhbCBsaW5lcyBzY3JvbGxlZCB2aWEgd2hlZWxEZWx0YS4gTm90Y2hlZCB3aGVlbHNcblx0XHQvLyBzaG91bGQgYmVoYXZlIHRoZSBzYW1lIHdheSBhcyBhcnJvdyBrZXlzLlxuXHRcdGlmICggTWF0aC5mbG9vciggZS5kZWx0YVkgKSAhPT0gZS5kZWx0YVkgJiYgZS53aGVlbERlbHRhICkge1xuXHRcdFx0ZGVsdGFYID0gMDtcblx0XHRcdGRlbHRhWSA9IC1lLndoZWVsRGVsdGEgLyAxMjA7XG5cdFx0XHRkZWx0YVkgKj0gdGhpcy5fc3RlcEV4cGxpY2l0ID8gMSA6IDEwO1xuXHRcdH1cblxuXHRcdGNvbnN0IHdoZWVsID0gZGVsdGFYICsgLWRlbHRhWTtcblxuXHRcdHJldHVybiB3aGVlbDtcblxuXHR9XG5cblx0X2Fycm93S2V5TXVsdGlwbGllciggZSApIHtcblxuXHRcdGxldCBtdWx0ID0gdGhpcy5fc3RlcEV4cGxpY2l0ID8gMSA6IDEwO1xuXG5cdFx0aWYgKCBlLnNoaWZ0S2V5ICkge1xuXHRcdFx0bXVsdCAqPSAxMDtcblx0XHR9IGVsc2UgaWYgKCBlLmFsdEtleSApIHtcblx0XHRcdG11bHQgLz0gMTA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG11bHQ7XG5cblx0fVxuXG5cdF9zbmFwKCB2YWx1ZSApIHtcblxuXHRcdC8vIE1ha2UgdGhlIHN0ZXBzIFwic3RhcnRcIiBhdCBtaW4gb3IgbWF4LlxuXHRcdGxldCBvZmZzZXQgPSAwO1xuXHRcdGlmICggdGhpcy5faGFzTWluICkge1xuXHRcdFx0b2Zmc2V0ID0gdGhpcy5fbWluO1xuXHRcdH0gZWxzZSBpZiAoIHRoaXMuX2hhc01heCApIHtcblx0XHRcdG9mZnNldCA9IHRoaXMuX21heDtcblx0XHR9XG5cblx0XHR2YWx1ZSAtPSBvZmZzZXQ7XG5cblx0XHR2YWx1ZSA9IE1hdGgucm91bmQoIHZhbHVlIC8gdGhpcy5fc3RlcCApICogdGhpcy5fc3RlcDtcblxuXHRcdHZhbHVlICs9IG9mZnNldDtcblxuXHRcdC8vIFVzZWQgdG8gcHJldmVudCBcImZseWF3YXlcIiBkZWNpbWFscyBsaWtlIDEuMDAwMDAwMDAwMDAwMDFcblx0XHR2YWx1ZSA9IHBhcnNlRmxvYXQoIHZhbHVlLnRvUHJlY2lzaW9uKCAxNSApICk7XG5cblx0XHRyZXR1cm4gdmFsdWU7XG5cblx0fVxuXG5cdF9jbGFtcCggdmFsdWUgKSB7XG5cdFx0Ly8gZWl0aGVyIGNvbmRpdGlvbiBpcyBmYWxzZSBpZiBtaW4gb3IgbWF4IGlzIHVuZGVmaW5lZFxuXHRcdGlmICggdmFsdWUgPCB0aGlzLl9taW4gKSB2YWx1ZSA9IHRoaXMuX21pbjtcblx0XHRpZiAoIHZhbHVlID4gdGhpcy5fbWF4ICkgdmFsdWUgPSB0aGlzLl9tYXg7XG5cdFx0cmV0dXJuIHZhbHVlO1xuXHR9XG5cblx0X3NuYXBDbGFtcFNldFZhbHVlKCB2YWx1ZSApIHtcblx0XHR0aGlzLnNldFZhbHVlKCB0aGlzLl9jbGFtcCggdGhpcy5fc25hcCggdmFsdWUgKSApICk7XG5cdH1cblxuXHRnZXQgX2hhc1Njcm9sbEJhcigpIHtcblx0XHRjb25zdCByb290ID0gdGhpcy5wYXJlbnQucm9vdC4kY2hpbGRyZW47XG5cdFx0cmV0dXJuIHJvb3Quc2Nyb2xsSGVpZ2h0ID4gcm9vdC5jbGllbnRIZWlnaHQ7XG5cdH1cblxuXHRnZXQgX2hhc01pbigpIHtcblx0XHRyZXR1cm4gdGhpcy5fbWluICE9PSB1bmRlZmluZWQ7XG5cdH1cblxuXHRnZXQgX2hhc01heCgpIHtcblx0XHRyZXR1cm4gdGhpcy5fbWF4ICE9PSB1bmRlZmluZWQ7XG5cdH1cblxufVxuXG5jbGFzcyBPcHRpb25Db250cm9sbGVyIGV4dGVuZHMgQ29udHJvbGxlciB7XG5cblx0Y29uc3RydWN0b3IoIHBhcmVudCwgb2JqZWN0LCBwcm9wZXJ0eSwgb3B0aW9ucyApIHtcblxuXHRcdHN1cGVyKCBwYXJlbnQsIG9iamVjdCwgcHJvcGVydHksICdvcHRpb24nICk7XG5cblx0XHR0aGlzLiRzZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc2VsZWN0JyApO1xuXHRcdHRoaXMuJHNlbGVjdC5zZXRBdHRyaWJ1dGUoICdhcmlhLWxhYmVsbGVkYnknLCB0aGlzLiRuYW1lLmlkICk7XG5cblx0XHR0aGlzLiRkaXNwbGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHR0aGlzLiRkaXNwbGF5LmNsYXNzTGlzdC5hZGQoICdkaXNwbGF5JyApO1xuXG5cdFx0dGhpcy4kc2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoICdjaGFuZ2UnLCAoKSA9PiB7XG5cdFx0XHR0aGlzLnNldFZhbHVlKCB0aGlzLl92YWx1ZXNbIHRoaXMuJHNlbGVjdC5zZWxlY3RlZEluZGV4IF0gKTtcblx0XHRcdHRoaXMuX2NhbGxPbkZpbmlzaENoYW5nZSgpO1xuXHRcdH0gKTtcblxuXHRcdHRoaXMuJHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCAnZm9jdXMnLCAoKSA9PiB7XG5cdFx0XHR0aGlzLiRkaXNwbGF5LmNsYXNzTGlzdC5hZGQoICdmb2N1cycgKTtcblx0XHR9ICk7XG5cblx0XHR0aGlzLiRzZWxlY3QuYWRkRXZlbnRMaXN0ZW5lciggJ2JsdXInLCAoKSA9PiB7XG5cdFx0XHR0aGlzLiRkaXNwbGF5LmNsYXNzTGlzdC5yZW1vdmUoICdmb2N1cycgKTtcblx0XHR9ICk7XG5cblx0XHR0aGlzLiR3aWRnZXQuYXBwZW5kQ2hpbGQoIHRoaXMuJHNlbGVjdCApO1xuXHRcdHRoaXMuJHdpZGdldC5hcHBlbmRDaGlsZCggdGhpcy4kZGlzcGxheSApO1xuXG5cdFx0dGhpcy4kZGlzYWJsZSA9IHRoaXMuJHNlbGVjdDtcblxuXHRcdHRoaXMub3B0aW9ucyggb3B0aW9ucyApO1xuXG5cdH1cblxuXHRvcHRpb25zKCBvcHRpb25zICkge1xuXG5cdFx0dGhpcy5fdmFsdWVzID0gQXJyYXkuaXNBcnJheSggb3B0aW9ucyApID8gb3B0aW9ucyA6IE9iamVjdC52YWx1ZXMoIG9wdGlvbnMgKTtcblx0XHR0aGlzLl9uYW1lcyA9IEFycmF5LmlzQXJyYXkoIG9wdGlvbnMgKSA/IG9wdGlvbnMgOiBPYmplY3Qua2V5cyggb3B0aW9ucyApO1xuXG5cdFx0dGhpcy4kc2VsZWN0LnJlcGxhY2VDaGlsZHJlbigpO1xuXG5cdFx0dGhpcy5fbmFtZXMuZm9yRWFjaCggbmFtZSA9PiB7XG5cdFx0XHRjb25zdCAkb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ29wdGlvbicgKTtcblx0XHRcdCRvcHRpb24udGV4dENvbnRlbnQgPSBuYW1lO1xuXHRcdFx0dGhpcy4kc2VsZWN0LmFwcGVuZENoaWxkKCAkb3B0aW9uICk7XG5cdFx0fSApO1xuXG5cdFx0dGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9XG5cblx0dXBkYXRlRGlzcGxheSgpIHtcblx0XHRjb25zdCB2YWx1ZSA9IHRoaXMuZ2V0VmFsdWUoKTtcblx0XHRjb25zdCBpbmRleCA9IHRoaXMuX3ZhbHVlcy5pbmRleE9mKCB2YWx1ZSApO1xuXHRcdHRoaXMuJHNlbGVjdC5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG5cdFx0dGhpcy4kZGlzcGxheS50ZXh0Q29udGVudCA9IGluZGV4ID09PSAtMSA/IHZhbHVlIDogdGhpcy5fbmFtZXNbIGluZGV4IF07XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufVxuXG5jbGFzcyBTdHJpbmdDb250cm9sbGVyIGV4dGVuZHMgQ29udHJvbGxlciB7XG5cblx0Y29uc3RydWN0b3IoIHBhcmVudCwgb2JqZWN0LCBwcm9wZXJ0eSApIHtcblxuXHRcdHN1cGVyKCBwYXJlbnQsIG9iamVjdCwgcHJvcGVydHksICdzdHJpbmcnICk7XG5cblx0XHR0aGlzLiRpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdpbnB1dCcgKTtcblx0XHR0aGlzLiRpbnB1dC5zZXRBdHRyaWJ1dGUoICd0eXBlJywgJ3RleHQnICk7XG5cdFx0dGhpcy4kaW5wdXQuc2V0QXR0cmlidXRlKCAnc3BlbGxjaGVjaycsICdmYWxzZScgKTtcblx0XHR0aGlzLiRpbnB1dC5zZXRBdHRyaWJ1dGUoICdhcmlhLWxhYmVsbGVkYnknLCB0aGlzLiRuYW1lLmlkICk7XG5cblx0XHR0aGlzLiRpbnB1dC5hZGRFdmVudExpc3RlbmVyKCAnaW5wdXQnLCAoKSA9PiB7XG5cdFx0XHR0aGlzLnNldFZhbHVlKCB0aGlzLiRpbnB1dC52YWx1ZSApO1xuXHRcdH0gKTtcblxuXHRcdHRoaXMuJGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoICdrZXlkb3duJywgZSA9PiB7XG5cdFx0XHRpZiAoIGUuY29kZSA9PT0gJ0VudGVyJyApIHtcblx0XHRcdFx0dGhpcy4kaW5wdXQuYmx1cigpO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHRcdHRoaXMuJGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoICdibHVyJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5fY2FsbE9uRmluaXNoQ2hhbmdlKCk7XG5cdFx0fSApO1xuXG5cdFx0dGhpcy4kd2lkZ2V0LmFwcGVuZENoaWxkKCB0aGlzLiRpbnB1dCApO1xuXG5cdFx0dGhpcy4kZGlzYWJsZSA9IHRoaXMuJGlucHV0O1xuXG5cdFx0dGhpcy51cGRhdGVEaXNwbGF5KCk7XG5cblx0fVxuXG5cdHVwZGF0ZURpc3BsYXkoKSB7XG5cdFx0dGhpcy4kaW5wdXQudmFsdWUgPSB0aGlzLmdldFZhbHVlKCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufVxuXG52YXIgc3R5bGVzaGVldCA9IGAubGlsLWd1aSB7XG4gIGZvbnQtZmFtaWx5OiB2YXIoLS1mb250LWZhbWlseSk7XG4gIGZvbnQtc2l6ZTogdmFyKC0tZm9udC1zaXplKTtcbiAgbGluZS1oZWlnaHQ6IDE7XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc3R5bGU6IG5vcm1hbDtcbiAgdGV4dC1hbGlnbjogbGVmdDtcbiAgY29sb3I6IHZhcigtLXRleHQtY29sb3IpO1xuICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgLXdlYmtpdC11c2VyLXNlbGVjdDogbm9uZTtcbiAgdG91Y2gtYWN0aW9uOiBtYW5pcHVsYXRpb247XG4gIC0tYmFja2dyb3VuZC1jb2xvcjogIzFmMWYxZjtcbiAgLS10ZXh0LWNvbG9yOiAjZWJlYmViO1xuICAtLXRpdGxlLWJhY2tncm91bmQtY29sb3I6ICMxMTExMTE7XG4gIC0tdGl0bGUtdGV4dC1jb2xvcjogI2ViZWJlYjtcbiAgLS13aWRnZXQtY29sb3I6ICM0MjQyNDI7XG4gIC0taG92ZXItY29sb3I6ICM0ZjRmNGY7XG4gIC0tZm9jdXMtY29sb3I6ICM1OTU5NTk7XG4gIC0tbnVtYmVyLWNvbG9yOiAjMmNjOWZmO1xuICAtLXN0cmluZy1jb2xvcjogI2EyZGIzYztcbiAgLS1mb250LXNpemU6IDExcHg7XG4gIC0taW5wdXQtZm9udC1zaXplOiAxMXB4O1xuICAtLWZvbnQtZmFtaWx5OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsIFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBBcmlhbCwgc2Fucy1zZXJpZjtcbiAgLS1mb250LWZhbWlseS1tb25vOiBNZW5sbywgTW9uYWNvLCBDb25zb2xhcywgXCJEcm9pZCBTYW5zIE1vbm9cIiwgbW9ub3NwYWNlO1xuICAtLXBhZGRpbmc6IDRweDtcbiAgLS1zcGFjaW5nOiA0cHg7XG4gIC0td2lkZ2V0LWhlaWdodDogMjBweDtcbiAgLS10aXRsZS1oZWlnaHQ6IGNhbGModmFyKC0td2lkZ2V0LWhlaWdodCkgKyB2YXIoLS1zcGFjaW5nKSAqIDEuMjUpO1xuICAtLW5hbWUtd2lkdGg6IDQ1JTtcbiAgLS1zbGlkZXIta25vYi13aWR0aDogMnB4O1xuICAtLXNsaWRlci1pbnB1dC13aWR0aDogMjclO1xuICAtLWNvbG9yLWlucHV0LXdpZHRoOiAyNyU7XG4gIC0tc2xpZGVyLWlucHV0LW1pbi13aWR0aDogNDVweDtcbiAgLS1jb2xvci1pbnB1dC1taW4td2lkdGg6IDQ1cHg7XG4gIC0tZm9sZGVyLWluZGVudDogN3B4O1xuICAtLXdpZGdldC1wYWRkaW5nOiAwIDAgMCAzcHg7XG4gIC0td2lkZ2V0LWJvcmRlci1yYWRpdXM6IDJweDtcbiAgLS1jaGVja2JveC1zaXplOiBjYWxjKDAuNzUgKiB2YXIoLS13aWRnZXQtaGVpZ2h0KSk7XG4gIC0tc2Nyb2xsYmFyLXdpZHRoOiA1cHg7XG59XG4ubGlsLWd1aSwgLmxpbC1ndWkgKiB7XG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZzogMDtcbn1cbi5saWwtZ3VpLnJvb3Qge1xuICB3aWR0aDogdmFyKC0td2lkdGgsIDI0NXB4KTtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1jb2xvcik7XG59XG4ubGlsLWd1aS5yb290ID4gLnRpdGxlIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tdGl0bGUtYmFja2dyb3VuZC1jb2xvcik7XG4gIGNvbG9yOiB2YXIoLS10aXRsZS10ZXh0LWNvbG9yKTtcbn1cbi5saWwtZ3VpLnJvb3QgPiAuY2hpbGRyZW4ge1xuICBvdmVyZmxvdy14OiBoaWRkZW47XG4gIG92ZXJmbG93LXk6IGF1dG87XG59XG4ubGlsLWd1aS5yb290ID4gLmNoaWxkcmVuOjotd2Via2l0LXNjcm9sbGJhciB7XG4gIHdpZHRoOiB2YXIoLS1zY3JvbGxiYXItd2lkdGgpO1xuICBoZWlnaHQ6IHZhcigtLXNjcm9sbGJhci13aWR0aCk7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtY29sb3IpO1xufVxuLmxpbC1ndWkucm9vdCA+IC5jaGlsZHJlbjo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIge1xuICBib3JkZXItcmFkaXVzOiB2YXIoLS1zY3JvbGxiYXItd2lkdGgpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1mb2N1cy1jb2xvcik7XG59XG5AbWVkaWEgKHBvaW50ZXI6IGNvYXJzZSkge1xuICAubGlsLWd1aS5hbGxvdy10b3VjaC1zdHlsZXMsIC5saWwtZ3VpLmFsbG93LXRvdWNoLXN0eWxlcyAubGlsLWd1aSB7XG4gICAgLS13aWRnZXQtaGVpZ2h0OiAyOHB4O1xuICAgIC0tcGFkZGluZzogNnB4O1xuICAgIC0tc3BhY2luZzogNnB4O1xuICAgIC0tZm9udC1zaXplOiAxM3B4O1xuICAgIC0taW5wdXQtZm9udC1zaXplOiAxNnB4O1xuICAgIC0tZm9sZGVyLWluZGVudDogMTBweDtcbiAgICAtLXNjcm9sbGJhci13aWR0aDogN3B4O1xuICAgIC0tc2xpZGVyLWlucHV0LW1pbi13aWR0aDogNTBweDtcbiAgICAtLWNvbG9yLWlucHV0LW1pbi13aWR0aDogNjVweDtcbiAgfVxufVxuLmxpbC1ndWkuZm9yY2UtdG91Y2gtc3R5bGVzLCAubGlsLWd1aS5mb3JjZS10b3VjaC1zdHlsZXMgLmxpbC1ndWkge1xuICAtLXdpZGdldC1oZWlnaHQ6IDI4cHg7XG4gIC0tcGFkZGluZzogNnB4O1xuICAtLXNwYWNpbmc6IDZweDtcbiAgLS1mb250LXNpemU6IDEzcHg7XG4gIC0taW5wdXQtZm9udC1zaXplOiAxNnB4O1xuICAtLWZvbGRlci1pbmRlbnQ6IDEwcHg7XG4gIC0tc2Nyb2xsYmFyLXdpZHRoOiA3cHg7XG4gIC0tc2xpZGVyLWlucHV0LW1pbi13aWR0aDogNTBweDtcbiAgLS1jb2xvci1pbnB1dC1taW4td2lkdGg6IDY1cHg7XG59XG4ubGlsLWd1aS5hdXRvUGxhY2Uge1xuICBtYXgtaGVpZ2h0OiAxMDAlO1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIHRvcDogMDtcbiAgcmlnaHQ6IDE1cHg7XG4gIHotaW5kZXg6IDEwMDE7XG59XG5cbi5saWwtZ3VpIC5jb250cm9sbGVyIHtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgcGFkZGluZzogMCB2YXIoLS1wYWRkaW5nKTtcbiAgbWFyZ2luOiB2YXIoLS1zcGFjaW5nKSAwO1xufVxuLmxpbC1ndWkgLmNvbnRyb2xsZXIuZGlzYWJsZWQge1xuICBvcGFjaXR5OiAwLjU7XG59XG4ubGlsLWd1aSAuY29udHJvbGxlci5kaXNhYmxlZCwgLmxpbC1ndWkgLmNvbnRyb2xsZXIuZGlzYWJsZWQgKiB7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lICFpbXBvcnRhbnQ7XG59XG4ubGlsLWd1aSAuY29udHJvbGxlciA+IC5uYW1lIHtcbiAgbWluLXdpZHRoOiB2YXIoLS1uYW1lLXdpZHRoKTtcbiAgZmxleC1zaHJpbms6IDA7XG4gIHdoaXRlLXNwYWNlOiBwcmU7XG4gIHBhZGRpbmctcmlnaHQ6IHZhcigtLXNwYWNpbmcpO1xuICBsaW5lLWhlaWdodDogdmFyKC0td2lkZ2V0LWhlaWdodCk7XG59XG4ubGlsLWd1aSAuY29udHJvbGxlciAud2lkZ2V0IHtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICB3aWR0aDogMTAwJTtcbiAgbWluLWhlaWdodDogdmFyKC0td2lkZ2V0LWhlaWdodCk7XG59XG4ubGlsLWd1aSAuY29udHJvbGxlci5zdHJpbmcgaW5wdXQge1xuICBjb2xvcjogdmFyKC0tc3RyaW5nLWNvbG9yKTtcbn1cbi5saWwtZ3VpIC5jb250cm9sbGVyLmJvb2xlYW4ge1xuICBjdXJzb3I6IHBvaW50ZXI7XG59XG4ubGlsLWd1aSAuY29udHJvbGxlci5jb2xvciAuZGlzcGxheSB7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IHZhcigtLXdpZGdldC1oZWlnaHQpO1xuICBib3JkZXItcmFkaXVzOiB2YXIoLS13aWRnZXQtYm9yZGVyLXJhZGl1cyk7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cbkBtZWRpYSAoaG92ZXI6IGhvdmVyKSB7XG4gIC5saWwtZ3VpIC5jb250cm9sbGVyLmNvbG9yIC5kaXNwbGF5OmhvdmVyOmJlZm9yZSB7XG4gICAgY29udGVudDogXCIgXCI7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLXdpZGdldC1ib3JkZXItcmFkaXVzKTtcbiAgICBib3JkZXI6IDFweCBzb2xpZCAjZmZmOTtcbiAgICB0b3A6IDA7XG4gICAgcmlnaHQ6IDA7XG4gICAgYm90dG9tOiAwO1xuICAgIGxlZnQ6IDA7XG4gIH1cbn1cbi5saWwtZ3VpIC5jb250cm9sbGVyLmNvbG9yIGlucHV0W3R5cGU9Y29sb3JdIHtcbiAgb3BhY2l0eTogMDtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuLmxpbC1ndWkgLmNvbnRyb2xsZXIuY29sb3IgaW5wdXRbdHlwZT10ZXh0XSB7XG4gIG1hcmdpbi1sZWZ0OiB2YXIoLS1zcGFjaW5nKTtcbiAgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtZmFtaWx5LW1vbm8pO1xuICBtaW4td2lkdGg6IHZhcigtLWNvbG9yLWlucHV0LW1pbi13aWR0aCk7XG4gIHdpZHRoOiB2YXIoLS1jb2xvci1pbnB1dC13aWR0aCk7XG4gIGZsZXgtc2hyaW5rOiAwO1xufVxuLmxpbC1ndWkgLmNvbnRyb2xsZXIub3B0aW9uIHNlbGVjdCB7XG4gIG9wYWNpdHk6IDA7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgd2lkdGg6IDEwMCU7XG4gIG1heC13aWR0aDogMTAwJTtcbn1cbi5saWwtZ3VpIC5jb250cm9sbGVyLm9wdGlvbiAuZGlzcGxheSB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gIGJvcmRlci1yYWRpdXM6IHZhcigtLXdpZGdldC1ib3JkZXItcmFkaXVzKTtcbiAgaGVpZ2h0OiB2YXIoLS13aWRnZXQtaGVpZ2h0KTtcbiAgbGluZS1oZWlnaHQ6IHZhcigtLXdpZGdldC1oZWlnaHQpO1xuICBtYXgtd2lkdGg6IDEwMCU7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIHdvcmQtYnJlYWs6IGJyZWFrLWFsbDtcbiAgcGFkZGluZy1sZWZ0OiAwLjU1ZW07XG4gIHBhZGRpbmctcmlnaHQ6IDEuNzVlbTtcbiAgYmFja2dyb3VuZDogdmFyKC0td2lkZ2V0LWNvbG9yKTtcbn1cbkBtZWRpYSAoaG92ZXI6IGhvdmVyKSB7XG4gIC5saWwtZ3VpIC5jb250cm9sbGVyLm9wdGlvbiAuZGlzcGxheS5mb2N1cyB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tZm9jdXMtY29sb3IpO1xuICB9XG59XG4ubGlsLWd1aSAuY29udHJvbGxlci5vcHRpb24gLmRpc3BsYXkuYWN0aXZlIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tZm9jdXMtY29sb3IpO1xufVxuLmxpbC1ndWkgLmNvbnRyb2xsZXIub3B0aW9uIC5kaXNwbGF5OmFmdGVyIHtcbiAgZm9udC1mYW1pbHk6IFwibGlsLWd1aVwiO1xuICBjb250ZW50OiBcIuKGlVwiO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogMDtcbiAgcmlnaHQ6IDA7XG4gIGJvdHRvbTogMDtcbiAgcGFkZGluZy1yaWdodDogMC4zNzVlbTtcbn1cbi5saWwtZ3VpIC5jb250cm9sbGVyLm9wdGlvbiAud2lkZ2V0LFxuLmxpbC1ndWkgLmNvbnRyb2xsZXIub3B0aW9uIHNlbGVjdCB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbn1cbkBtZWRpYSAoaG92ZXI6IGhvdmVyKSB7XG4gIC5saWwtZ3VpIC5jb250cm9sbGVyLm9wdGlvbiAud2lkZ2V0OmhvdmVyIC5kaXNwbGF5IHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1ob3Zlci1jb2xvcik7XG4gIH1cbn1cbi5saWwtZ3VpIC5jb250cm9sbGVyLm51bWJlciBpbnB1dCB7XG4gIGNvbG9yOiB2YXIoLS1udW1iZXItY29sb3IpO1xufVxuLmxpbC1ndWkgLmNvbnRyb2xsZXIubnVtYmVyLmhhc1NsaWRlciBpbnB1dCB7XG4gIG1hcmdpbi1sZWZ0OiB2YXIoLS1zcGFjaW5nKTtcbiAgd2lkdGg6IHZhcigtLXNsaWRlci1pbnB1dC13aWR0aCk7XG4gIG1pbi13aWR0aDogdmFyKC0tc2xpZGVyLWlucHV0LW1pbi13aWR0aCk7XG4gIGZsZXgtc2hyaW5rOiAwO1xufVxuLmxpbC1ndWkgLmNvbnRyb2xsZXIubnVtYmVyIC5zbGlkZXIge1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiB2YXIoLS13aWRnZXQtaGVpZ2h0KTtcbiAgYmFja2dyb3VuZDogdmFyKC0td2lkZ2V0LWNvbG9yKTtcbiAgYm9yZGVyLXJhZGl1czogdmFyKC0td2lkZ2V0LWJvcmRlci1yYWRpdXMpO1xuICBwYWRkaW5nLXJpZ2h0OiB2YXIoLS1zbGlkZXIta25vYi13aWR0aCk7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIGN1cnNvcjogZXctcmVzaXplO1xuICB0b3VjaC1hY3Rpb246IHBhbi15O1xufVxuQG1lZGlhIChob3ZlcjogaG92ZXIpIHtcbiAgLmxpbC1ndWkgLmNvbnRyb2xsZXIubnVtYmVyIC5zbGlkZXI6aG92ZXIge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLWhvdmVyLWNvbG9yKTtcbiAgfVxufVxuLmxpbC1ndWkgLmNvbnRyb2xsZXIubnVtYmVyIC5zbGlkZXIuYWN0aXZlIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tZm9jdXMtY29sb3IpO1xufVxuLmxpbC1ndWkgLmNvbnRyb2xsZXIubnVtYmVyIC5zbGlkZXIuYWN0aXZlIC5maWxsIHtcbiAgb3BhY2l0eTogMC45NTtcbn1cbi5saWwtZ3VpIC5jb250cm9sbGVyLm51bWJlciAuZmlsbCB7XG4gIGhlaWdodDogMTAwJTtcbiAgYm9yZGVyLXJpZ2h0OiB2YXIoLS1zbGlkZXIta25vYi13aWR0aCkgc29saWQgdmFyKC0tbnVtYmVyLWNvbG9yKTtcbiAgYm94LXNpemluZzogY29udGVudC1ib3g7XG59XG5cbi5saWwtZ3VpLWRyYWdnaW5nIC5saWwtZ3VpIHtcbiAgLS1ob3Zlci1jb2xvcjogdmFyKC0td2lkZ2V0LWNvbG9yKTtcbn1cbi5saWwtZ3VpLWRyYWdnaW5nICoge1xuICBjdXJzb3I6IGV3LXJlc2l6ZSAhaW1wb3J0YW50O1xufVxuXG4ubGlsLWd1aS1kcmFnZ2luZy5saWwtZ3VpLXZlcnRpY2FsICoge1xuICBjdXJzb3I6IG5zLXJlc2l6ZSAhaW1wb3J0YW50O1xufVxuXG4ubGlsLWd1aSAudGl0bGUge1xuICBoZWlnaHQ6IHZhcigtLXRpdGxlLWhlaWdodCk7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIHBhZGRpbmc6IDAgdmFyKC0tcGFkZGluZyk7XG4gIHdpZHRoOiAxMDAlO1xuICB0ZXh0LWFsaWduOiBsZWZ0O1xuICBiYWNrZ3JvdW5kOiBub25lO1xuICB0ZXh0LWRlY29yYXRpb24tc2tpcDogb2JqZWN0cztcbn1cbi5saWwtZ3VpIC50aXRsZTpiZWZvcmUge1xuICBmb250LWZhbWlseTogXCJsaWwtZ3VpXCI7XG4gIGNvbnRlbnQ6IFwi4pa+XCI7XG4gIHBhZGRpbmctcmlnaHQ6IDJweDtcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xufVxuLmxpbC1ndWkgLnRpdGxlOmFjdGl2ZSB7XG4gIGJhY2tncm91bmQ6IHZhcigtLXRpdGxlLWJhY2tncm91bmQtY29sb3IpO1xuICBvcGFjaXR5OiAwLjc1O1xufVxuQG1lZGlhIChob3ZlcjogaG92ZXIpIHtcbiAgYm9keTpub3QoLmxpbC1ndWktZHJhZ2dpbmcpIC5saWwtZ3VpIC50aXRsZTpob3ZlciB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tdGl0bGUtYmFja2dyb3VuZC1jb2xvcik7XG4gICAgb3BhY2l0eTogMC44NTtcbiAgfVxuICAubGlsLWd1aSAudGl0bGU6Zm9jdXMge1xuICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lIHZhcigtLWZvY3VzLWNvbG9yKTtcbiAgfVxufVxuLmxpbC1ndWkucm9vdCA+IC50aXRsZTpmb2N1cyB7XG4gIHRleHQtZGVjb3JhdGlvbjogbm9uZSAhaW1wb3J0YW50O1xufVxuLmxpbC1ndWkuY2xvc2VkID4gLnRpdGxlOmJlZm9yZSB7XG4gIGNvbnRlbnQ6IFwi4pa4XCI7XG59XG4ubGlsLWd1aS5jbG9zZWQgPiAuY2hpbGRyZW4ge1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTdweCk7XG4gIG9wYWNpdHk6IDA7XG59XG4ubGlsLWd1aS5jbG9zZWQ6bm90KC50cmFuc2l0aW9uKSA+IC5jaGlsZHJlbiB7XG4gIGRpc3BsYXk6IG5vbmU7XG59XG4ubGlsLWd1aS50cmFuc2l0aW9uID4gLmNoaWxkcmVuIHtcbiAgdHJhbnNpdGlvbi1kdXJhdGlvbjogMzAwbXM7XG4gIHRyYW5zaXRpb24tcHJvcGVydHk6IGhlaWdodCwgb3BhY2l0eSwgdHJhbnNmb3JtO1xuICB0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbjogY3ViaWMtYmV6aWVyKDAuMiwgMC42LCAwLjM1LCAxKTtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG59XG4ubGlsLWd1aSAuY2hpbGRyZW46ZW1wdHk6YmVmb3JlIHtcbiAgY29udGVudDogXCJFbXB0eVwiO1xuICBwYWRkaW5nOiAwIHZhcigtLXBhZGRpbmcpO1xuICBtYXJnaW46IHZhcigtLXNwYWNpbmcpIDA7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBoZWlnaHQ6IHZhcigtLXdpZGdldC1oZWlnaHQpO1xuICBmb250LXN0eWxlOiBpdGFsaWM7XG4gIGxpbmUtaGVpZ2h0OiB2YXIoLS13aWRnZXQtaGVpZ2h0KTtcbiAgb3BhY2l0eTogMC41O1xufVxuLmxpbC1ndWkucm9vdCA+IC5jaGlsZHJlbiA+IC5saWwtZ3VpID4gLnRpdGxlIHtcbiAgYm9yZGVyOiAwIHNvbGlkIHZhcigtLXdpZGdldC1jb2xvcik7XG4gIGJvcmRlci13aWR0aDogMXB4IDA7XG4gIHRyYW5zaXRpb246IGJvcmRlci1jb2xvciAzMDBtcztcbn1cbi5saWwtZ3VpLnJvb3QgPiAuY2hpbGRyZW4gPiAubGlsLWd1aS5jbG9zZWQgPiAudGl0bGUge1xuICBib3JkZXItYm90dG9tLWNvbG9yOiB0cmFuc3BhcmVudDtcbn1cbi5saWwtZ3VpICsgLmNvbnRyb2xsZXIge1xuICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0td2lkZ2V0LWNvbG9yKTtcbiAgbWFyZ2luLXRvcDogMDtcbiAgcGFkZGluZy10b3A6IHZhcigtLXNwYWNpbmcpO1xufVxuLmxpbC1ndWkgLmxpbC1ndWkgLmxpbC1ndWkgPiAudGl0bGUge1xuICBib3JkZXI6IG5vbmU7XG59XG4ubGlsLWd1aSAubGlsLWd1aSAubGlsLWd1aSA+IC5jaGlsZHJlbiB7XG4gIGJvcmRlcjogbm9uZTtcbiAgbWFyZ2luLWxlZnQ6IHZhcigtLWZvbGRlci1pbmRlbnQpO1xuICBib3JkZXItbGVmdDogMnB4IHNvbGlkIHZhcigtLXdpZGdldC1jb2xvcik7XG59XG4ubGlsLWd1aSAubGlsLWd1aSAuY29udHJvbGxlciB7XG4gIGJvcmRlcjogbm9uZTtcbn1cblxuLmxpbC1ndWkgbGFiZWwsIC5saWwtZ3VpIGlucHV0LCAubGlsLWd1aSBidXR0b24ge1xuICAtd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3I6IHRyYW5zcGFyZW50O1xufVxuLmxpbC1ndWkgaW5wdXQge1xuICBib3JkZXI6IDA7XG4gIG91dGxpbmU6IG5vbmU7XG4gIGZvbnQtZmFtaWx5OiB2YXIoLS1mb250LWZhbWlseSk7XG4gIGZvbnQtc2l6ZTogdmFyKC0taW5wdXQtZm9udC1zaXplKTtcbiAgYm9yZGVyLXJhZGl1czogdmFyKC0td2lkZ2V0LWJvcmRlci1yYWRpdXMpO1xuICBoZWlnaHQ6IHZhcigtLXdpZGdldC1oZWlnaHQpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS13aWRnZXQtY29sb3IpO1xuICBjb2xvcjogdmFyKC0tdGV4dC1jb2xvcik7XG4gIHdpZHRoOiAxMDAlO1xufVxuQG1lZGlhIChob3ZlcjogaG92ZXIpIHtcbiAgLmxpbC1ndWkgaW5wdXQ6aG92ZXIge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLWhvdmVyLWNvbG9yKTtcbiAgfVxuICAubGlsLWd1aSBpbnB1dDphY3RpdmUge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLWZvY3VzLWNvbG9yKTtcbiAgfVxufVxuLmxpbC1ndWkgaW5wdXQ6ZGlzYWJsZWQge1xuICBvcGFjaXR5OiAxO1xufVxuLmxpbC1ndWkgaW5wdXRbdHlwZT10ZXh0XSxcbi5saWwtZ3VpIGlucHV0W3R5cGU9bnVtYmVyXSB7XG4gIHBhZGRpbmc6IHZhcigtLXdpZGdldC1wYWRkaW5nKTtcbiAgLW1vei1hcHBlYXJhbmNlOiB0ZXh0ZmllbGQ7XG59XG4ubGlsLWd1aSBpbnB1dFt0eXBlPXRleHRdOmZvY3VzLFxuLmxpbC1ndWkgaW5wdXRbdHlwZT1udW1iZXJdOmZvY3VzIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tZm9jdXMtY29sb3IpO1xufVxuLmxpbC1ndWkgaW5wdXRbdHlwZT1jaGVja2JveF0ge1xuICBhcHBlYXJhbmNlOiBub25lO1xuICB3aWR0aDogdmFyKC0tY2hlY2tib3gtc2l6ZSk7XG4gIGhlaWdodDogdmFyKC0tY2hlY2tib3gtc2l6ZSk7XG4gIGJvcmRlci1yYWRpdXM6IHZhcigtLXdpZGdldC1ib3JkZXItcmFkaXVzKTtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xuICBjdXJzb3I6IHBvaW50ZXI7XG59XG4ubGlsLWd1aSBpbnB1dFt0eXBlPWNoZWNrYm94XTpjaGVja2VkOmJlZm9yZSB7XG4gIGZvbnQtZmFtaWx5OiBcImxpbC1ndWlcIjtcbiAgY29udGVudDogXCLinJNcIjtcbiAgZm9udC1zaXplOiB2YXIoLS1jaGVja2JveC1zaXplKTtcbiAgbGluZS1oZWlnaHQ6IHZhcigtLWNoZWNrYm94LXNpemUpO1xufVxuQG1lZGlhIChob3ZlcjogaG92ZXIpIHtcbiAgLmxpbC1ndWkgaW5wdXRbdHlwZT1jaGVja2JveF06Zm9jdXMge1xuICAgIGJveC1zaGFkb3c6IGluc2V0IDAgMCAwIDFweCB2YXIoLS1mb2N1cy1jb2xvcik7XG4gIH1cbn1cbi5saWwtZ3VpIGJ1dHRvbiB7XG4gIG91dGxpbmU6IG5vbmU7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtZmFtaWx5KTtcbiAgZm9udC1zaXplOiB2YXIoLS1mb250LXNpemUpO1xuICBjb2xvcjogdmFyKC0tdGV4dC1jb2xvcik7XG4gIHdpZHRoOiAxMDAlO1xuICBib3JkZXI6IG5vbmU7XG59XG4ubGlsLWd1aSAuY29udHJvbGxlciBidXR0b24ge1xuICBoZWlnaHQ6IHZhcigtLXdpZGdldC1oZWlnaHQpO1xuICB0ZXh0LXRyYW5zZm9ybTogbm9uZTtcbiAgYmFja2dyb3VuZDogdmFyKC0td2lkZ2V0LWNvbG9yKTtcbiAgYm9yZGVyLXJhZGl1czogdmFyKC0td2lkZ2V0LWJvcmRlci1yYWRpdXMpO1xufVxuQG1lZGlhIChob3ZlcjogaG92ZXIpIHtcbiAgLmxpbC1ndWkgLmNvbnRyb2xsZXIgYnV0dG9uOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1ob3Zlci1jb2xvcik7XG4gIH1cbiAgLmxpbC1ndWkgLmNvbnRyb2xsZXIgYnV0dG9uOmZvY3VzIHtcbiAgICBib3gtc2hhZG93OiBpbnNldCAwIDAgMCAxcHggdmFyKC0tZm9jdXMtY29sb3IpO1xuICB9XG59XG4ubGlsLWd1aSAuY29udHJvbGxlciBidXR0b246YWN0aXZlIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tZm9jdXMtY29sb3IpO1xufVxuXG5AZm9udC1mYWNlIHtcbiAgZm9udC1mYW1pbHk6IFwibGlsLWd1aVwiO1xuICBzcmM6IHVybChcImRhdGE6YXBwbGljYXRpb24vZm9udC13b2ZmO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LGQwOUdSZ0FCQUFBQUFBVXNBQXNBQUFBQUNKd0FBUUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFCSFUxVkNBQUFCQ0FBQUFINEFBQURBSW13bVlFOVRMeklBQUFHSUFBQUFQd0FBQUdCS3FINVNZMjFoY0FBQUFjZ0FBQUQwQUFBQ3J1a3l5SkJuYkhsbUFBQUN2QUFBQUY4QUFBQ0VJWnBXSDJobFlXUUFBQU1jQUFBQUp3QUFBRFpmY2oyemFHaGxZUUFBQTBRQUFBQVlBQUFBSkFDNUFIaG9iWFI0QUFBRFhBQUFBQkFBQUFCTUFaQUFBR3h2WTJFQUFBTnNBQUFBRkFBQUFDZ0NFZ0l5YldGNGNBQUFBNEFBQUFBZUFBQUFJQUVmQUJKdVlXMWxBQUFEb0FBQUFTSUFBQUlLOVNVVS9YQnZjM1FBQUFURUFBQUFaZ0FBQUpDVGNNYzJlSnhWamJFT2dqQVVSVStoRlJCSzFkR1JMK0FMbkFpVG95TUxFekZwblB6L2VBc2h3U2E5NzUxN2MvTXd3Sm1lQjlrd1BsKzBjZjUrdUdQWlhzcVB1NG52WmFiY1NabGRaNmtmeVdub21GWS9lU2NLcVpOV3VwS0pPNmtYTjNLOXVDVm9MN2lJblByMVg1YmFYczN0anVNcUN0ekV1YWdtL0FBbHpRZ1BBQUI0bkdOZ1lSQmxuTURBeXNEQVlNL2dCaVQ1b0xRQkF3dURKQU1ERXdNck13TldFSkRtbXNKd2dDRmVYWmdoQmNqbFpNZ0ZDek9pS09JRkFCNzFCYjhBZUp5MWtqRnV3a0FRUlorRHdSQXdCdE5RUlVHS1E4T2RLQ0FXVWhBZ0tMaEl1QXNWU3BXejVCYmtqM2RFZ1lpVUlzenFXZHBaZStaNy93QjFvQ1ltSW9ib2l3aUxUMldqS2wvanNjckhmR2cvcEtkTWt5a2xDNVpzMkxFZkhZcGpjUm9Qem1lOU1XV21rM2RXYks5T2JrV2tpa09ldEo1NTRmV3lvRXNtZFNsdCt1UjBwQ0pSMzRiNnQvVFZnMVNZM3NZdmRmOHZ1aUtycHlhRFhESVNpZWdwMTdwNzU3OUdwM3ArK3k3SFBBaVk5cG1UaWJsanJyODVxU2lkdGxnNCtsMjVHTENhUzhlNnJSeE5CbXNuRVJ1bktiYU9PYlJ6N043Mmp1NXZkQWpZcEJYSGdKeWxPQVZzTXNlREFQRVA4TFlvVUhpY1kyQmlBQUVmaGlBR0pnWldCZ1o3Um5GUmRuVkpFTENRbEJTUmxBVEpNb0xWMkRLNGdsU1lzNnVicTV2YktySkxTYkdyZ0Vtb3ZEdURKVmhlM1Z6Y1hGd05MQ09JTEIvQzRJdVExeFRuNUZQaWxCVGo1RlBtQkFCNFd3b3FBSGljWTJCa1lHQUE0c2sxc1IvaitXMitNbkF6cERCZ0F5RU1RVUNTZzRFSnhBRUF3VWdGSGdCNG5HTmdaR0JnU0dGZ2dKTWhESXdNcUVBWUFCeUhBVEo0bkdOZ0FJSVVORXdtQUFCbDNBR1JlSnhqWUFBQ0lRWWxCaU1HSjN3UUFFY1FCRVY0bkdOZ1pHQmdFR1pnWTJCaUFBRVF5UVdFREF6L3dYd0dBQXNQQVRJQUFIaWNYZEJOU3NOQUhBWHdsMzVpQTBVUVhZbk1TaGZTOUdQWkE3VDdMZ0l1MDNTU3Brd3pZVEl0MUJONEFrL2dLVHlBZUN4ZnczOWpaa2p5bXpjdkF3bUFXL3dnd0hVRUdEYjM2K2pRUTNHWEdvdDc5TDI0anhDUDRnSHpGL0VJcjRqRUllN3d4aE9DM2cyVE1ZeTRRNytMdS9TSHVFZC9pdnQ0d0pkNHdQeGJQRUtNWDNHSTUrREpGR2FTbjRxTnprOG1jYktTUjZ4ZFhkaFN6YU9aSkd0ZGFwZDR2VlBiaTZyUCtjTDdUR1hPSHRYS2xsNGJZMVhsN0VHblB0cDdYeTJuMDB6eUtMVkhma0hCYTRJY0oyb0QzY2dnZ1d2dC9WL0ZiRHJVbEVVSmhUbi8wYXpWV2JOVE5yMEVuczhkZTF0Y2VLOXhabWZCMUNQak9tUEg0a2l0bXZPdWJjTnBtVlROM29GSnlqekN2bm1yd2hKVHpxelZqOWppU1g5MTFGamVBQUI0bkczSE1SS0NNQkJBMGYwZ2lpS2k0RFU4azBWMkdXYklaRE9oNFBvV1d2cTZKNVY4SWY5TlZOUWNhRGh5b3VYTWhZNHJQVGNHN2p3WW1YaEtxOFd6K3A3NjJhTmFlWVhvbTJuM20yZExUVmdzckNnRko3T1RtSWtZYndJYkM2dklCN1dtRmZBQUFBPT1cIikgZm9ybWF0KFwid29mZlwiKTtcbn1gO1xuXG5mdW5jdGlvbiBfaW5qZWN0U3R5bGVzKCBjc3NDb250ZW50ICkge1xuXHRjb25zdCBpbmplY3RlZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzdHlsZScgKTtcblx0aW5qZWN0ZWQuaW5uZXJIVE1MID0gY3NzQ29udGVudDtcblx0Y29uc3QgYmVmb3JlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvciggJ2hlYWQgbGlua1tyZWw9c3R5bGVzaGVldF0sIGhlYWQgc3R5bGUnICk7XG5cdGlmICggYmVmb3JlICkge1xuXHRcdGRvY3VtZW50LmhlYWQuaW5zZXJ0QmVmb3JlKCBpbmplY3RlZCwgYmVmb3JlICk7XG5cdH0gZWxzZSB7XG5cdFx0ZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZCggaW5qZWN0ZWQgKTtcblx0fVxufVxuXG5cbmxldCBzdHlsZXNJbmplY3RlZCA9IGZhbHNlO1xuXG5jbGFzcyBHVUkge1xuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgcGFuZWwgdGhhdCBob2xkcyBjb250cm9sbGVycy5cblx0ICogQGV4YW1wbGVcblx0ICogbmV3IEdVSSgpO1xuXHQgKiBuZXcgR1VJKCB7IGNvbnRhaW5lcjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoICdjdXN0b20nICkgfSApO1xuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuYXV0b1BsYWNlPXRydWVdXG5cdCAqIEFkZHMgdGhlIEdVSSB0byBgZG9jdW1lbnQuYm9keWAgYW5kIGZpeGVzIGl0IHRvIHRoZSB0b3AgcmlnaHQgb2YgdGhlIHBhZ2UuXG5cdCAqXG5cdCAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtvcHRpb25zLmNvbnRhaW5lcl1cblx0ICogQWRkcyB0aGUgR1VJIHRvIHRoaXMgRE9NIGVsZW1lbnQuIE92ZXJyaWRlcyBgYXV0b1BsYWNlYC5cblx0ICpcblx0ICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLndpZHRoPTI0NV1cblx0ICogV2lkdGggb2YgdGhlIEdVSSBpbiBwaXhlbHMsIHVzdWFsbHkgc2V0IHdoZW4gbmFtZSBsYWJlbHMgYmVjb21lIHRvbyBsb25nLiBOb3RlIHRoYXQgeW91IGNhbiBtYWtlXG5cdCAqIG5hbWUgbGFiZWxzIHdpZGVyIGluIENTUyB3aXRoIGAubGls4oCRZ3VpIHsg4oCR4oCRbmFtZeKAkXdpZHRoOiA1NSUgfWAuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50aXRsZT1Db250cm9sc11cblx0ICogTmFtZSB0byBkaXNwbGF5IGluIHRoZSB0aXRsZSBiYXIuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuY2xvc2VGb2xkZXJzPWZhbHNlXVxuXHQgKiBQYXNzIGB0cnVlYCB0byBjbG9zZSBhbGwgZm9sZGVycyBpbiB0aGlzIEdVSSBieSBkZWZhdWx0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmluamVjdFN0eWxlcz10cnVlXVxuXHQgKiBJbmplY3RzIHRoZSBkZWZhdWx0IHN0eWxlc2hlZXQgaW50byB0aGUgcGFnZSBpZiB0aGlzIGlzIHRoZSBmaXJzdCBHVUkuXG5cdCAqIFBhc3MgYGZhbHNlYCB0byB1c2UgeW91ciBvd24gc3R5bGVzaGVldC5cblx0ICpcblx0ICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnRvdWNoU3R5bGVzPXRydWVdXG5cdCAqIE1ha2VzIGNvbnRyb2xsZXJzIGxhcmdlciBvbiB0b3VjaCBkZXZpY2VzLiBQYXNzIGBmYWxzZWAgdG8gZGlzYWJsZSB0b3VjaCBzdHlsZXMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7R1VJfSBbb3B0aW9ucy5wYXJlbnRdXG5cdCAqIEFkZHMgdGhpcyBHVUkgYXMgYSBjaGlsZCBpbiBhbm90aGVyIEdVSS4gVXN1YWxseSB0aGlzIGlzIGRvbmUgZm9yIHlvdSBieSBgYWRkRm9sZGVyKClgLlxuXHQgKi9cblx0Y29uc3RydWN0b3IoIHtcblx0XHRwYXJlbnQsXG5cdFx0YXV0b1BsYWNlID0gcGFyZW50ID09PSB1bmRlZmluZWQsXG5cdFx0Y29udGFpbmVyLFxuXHRcdHdpZHRoLFxuXHRcdHRpdGxlID0gJ0NvbnRyb2xzJyxcblx0XHRjbG9zZUZvbGRlcnMgPSBmYWxzZSxcblx0XHRpbmplY3RTdHlsZXMgPSB0cnVlLFxuXHRcdHRvdWNoU3R5bGVzID0gdHJ1ZVxuXHR9ID0ge30gKSB7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgR1VJIGNvbnRhaW5pbmcgdGhpcyBmb2xkZXIsIG9yIGB1bmRlZmluZWRgIGlmIHRoaXMgaXMgdGhlIHJvb3QgR1VJLlxuXHRcdCAqIEB0eXBlIHtHVUl9XG5cdFx0ICovXG5cdFx0dGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgdG9wIGxldmVsIEdVSSBjb250YWluaW5nIHRoaXMgZm9sZGVyLCBvciBgdGhpc2AgaWYgdGhpcyBpcyB0aGUgcm9vdCBHVUkuXG5cdFx0ICogQHR5cGUge0dVSX1cblx0XHQgKi9cblx0XHR0aGlzLnJvb3QgPSBwYXJlbnQgPyBwYXJlbnQucm9vdCA6IHRoaXM7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgbGlzdCBvZiBjb250cm9sbGVycyBhbmQgZm9sZGVycyBjb250YWluZWQgYnkgdGhpcyBHVUkuXG5cdFx0ICogQHR5cGUge0FycmF5PEdVSXxDb250cm9sbGVyPn1cblx0XHQgKi9cblx0XHR0aGlzLmNoaWxkcmVuID0gW107XG5cblx0XHQvKipcblx0XHQgKiBUaGUgbGlzdCBvZiBjb250cm9sbGVycyBjb250YWluZWQgYnkgdGhpcyBHVUkuXG5cdFx0ICogQHR5cGUge0FycmF5PENvbnRyb2xsZXI+fVxuXHRcdCAqL1xuXHRcdHRoaXMuY29udHJvbGxlcnMgPSBbXTtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBsaXN0IG9mIGZvbGRlcnMgY29udGFpbmVkIGJ5IHRoaXMgR1VJLlxuXHRcdCAqIEB0eXBlIHtBcnJheTxHVUk+fVxuXHRcdCAqL1xuXHRcdHRoaXMuZm9sZGVycyA9IFtdO1xuXG5cdFx0LyoqXG5cdFx0ICogVXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlIEdVSSBpcyBjbG9zZWQuIFVzZSBgZ3VpLm9wZW4oKWAgb3IgYGd1aS5jbG9zZSgpYCB0byBjaGFuZ2UgdGhpcy5cblx0XHQgKiBAdHlwZSB7Ym9vbGVhbn1cblx0XHQgKi9cblx0XHR0aGlzLl9jbG9zZWQgPSBmYWxzZTtcblxuXHRcdC8qKlxuXHRcdCAqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZSBHVUkgaXMgaGlkZGVuLiBVc2UgYGd1aS5zaG93KClgIG9yIGBndWkuaGlkZSgpYCB0byBjaGFuZ2UgdGhpcy5cblx0XHQgKiBAdHlwZSB7Ym9vbGVhbn1cblx0XHQgKi9cblx0XHR0aGlzLl9oaWRkZW4gPSBmYWxzZTtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBvdXRlcm1vc3QgY29udGFpbmVyIGVsZW1lbnQuXG5cdFx0ICogQHR5cGUge0hUTUxFbGVtZW50fVxuXHRcdCAqL1xuXHRcdHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdFx0dGhpcy5kb21FbGVtZW50LmNsYXNzTGlzdC5hZGQoICdsaWwtZ3VpJyApO1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIERPTSBlbGVtZW50IHRoYXQgY29udGFpbnMgdGhlIHRpdGxlLlxuXHRcdCAqIEB0eXBlIHtIVE1MRWxlbWVudH1cblx0XHQgKi9cblx0XHR0aGlzLiR0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdidXR0b24nICk7XG5cdFx0dGhpcy4kdGl0bGUuY2xhc3NMaXN0LmFkZCggJ3RpdGxlJyApO1xuXHRcdHRoaXMuJHRpdGxlLnNldEF0dHJpYnV0ZSggJ2FyaWEtZXhwYW5kZWQnLCB0cnVlICk7XG5cblx0XHR0aGlzLiR0aXRsZS5hZGRFdmVudExpc3RlbmVyKCAnY2xpY2snLCAoKSA9PiB0aGlzLm9wZW5BbmltYXRlZCggdGhpcy5fY2xvc2VkICkgKTtcblxuXHRcdC8vIGVuYWJsZXMgOmFjdGl2ZSBwc2V1ZG8gY2xhc3Mgb24gbW9iaWxlXG5cdFx0dGhpcy4kdGl0bGUuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNoc3RhcnQnLCAoKSA9PiB7fSwgeyBwYXNzaXZlOiB0cnVlIH0gKTtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBET00gZWxlbWVudCB0aGF0IGNvbnRhaW5zIGNoaWxkcmVuLlxuXHRcdCAqIEB0eXBlIHtIVE1MRWxlbWVudH1cblx0XHQgKi9cblx0XHR0aGlzLiRjaGlsZHJlbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdFx0dGhpcy4kY2hpbGRyZW4uY2xhc3NMaXN0LmFkZCggJ2NoaWxkcmVuJyApO1xuXG5cdFx0dGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKCB0aGlzLiR0aXRsZSApO1xuXHRcdHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCggdGhpcy4kY2hpbGRyZW4gKTtcblxuXHRcdHRoaXMudGl0bGUoIHRpdGxlICk7XG5cblx0XHRpZiAoIHRoaXMucGFyZW50ICkge1xuXG5cdFx0XHR0aGlzLnBhcmVudC5jaGlsZHJlbi5wdXNoKCB0aGlzICk7XG5cdFx0XHR0aGlzLnBhcmVudC5mb2xkZXJzLnB1c2goIHRoaXMgKTtcblxuXHRcdFx0dGhpcy5wYXJlbnQuJGNoaWxkcmVuLmFwcGVuZENoaWxkKCB0aGlzLmRvbUVsZW1lbnQgKTtcblxuXHRcdFx0Ly8gU3RvcCB0aGUgY29uc3RydWN0b3IgZWFybHksIGV2ZXJ5dGhpbmcgb253YXJkIG9ubHkgYXBwbGllcyB0byByb290IEdVSSdzXG5cdFx0XHRyZXR1cm47XG5cblx0XHR9XG5cblx0XHR0aGlzLmRvbUVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ3Jvb3QnICk7XG5cblx0XHRpZiAoIHRvdWNoU3R5bGVzICkge1xuXHRcdFx0dGhpcy5kb21FbGVtZW50LmNsYXNzTGlzdC5hZGQoICdhbGxvdy10b3VjaC1zdHlsZXMnICk7XG5cdFx0fVxuXG5cdFx0Ly8gSW5qZWN0IHN0eWxlc2hlZXQgaWYgd2UgaGF2ZW4ndCBkb25lIHRoYXQgeWV0XG5cdFx0aWYgKCAhc3R5bGVzSW5qZWN0ZWQgJiYgaW5qZWN0U3R5bGVzICkge1xuXHRcdFx0X2luamVjdFN0eWxlcyggc3R5bGVzaGVldCApO1xuXHRcdFx0c3R5bGVzSW5qZWN0ZWQgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICggY29udGFpbmVyICkge1xuXG5cdFx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQoIHRoaXMuZG9tRWxlbWVudCApO1xuXG5cdFx0fSBlbHNlIGlmICggYXV0b1BsYWNlICkge1xuXG5cdFx0XHR0aGlzLmRvbUVsZW1lbnQuY2xhc3NMaXN0LmFkZCggJ2F1dG9QbGFjZScgKTtcblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIHRoaXMuZG9tRWxlbWVudCApO1xuXG5cdFx0fVxuXG5cdFx0aWYgKCB3aWR0aCApIHtcblx0XHRcdHRoaXMuZG9tRWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSggJy0td2lkdGgnLCB3aWR0aCArICdweCcgKTtcblx0XHR9XG5cblx0XHR0aGlzLl9jbG9zZUZvbGRlcnMgPSBjbG9zZUZvbGRlcnM7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBBZGRzIGEgY29udHJvbGxlciB0byB0aGUgR1VJLCBpbmZlcnJpbmcgY29udHJvbGxlciB0eXBlIHVzaW5nIHRoZSBgdHlwZW9mYCBvcGVyYXRvci5cblx0ICogQGV4YW1wbGVcblx0ICogZ3VpLmFkZCggb2JqZWN0LCAncHJvcGVydHknICk7XG5cdCAqIGd1aS5hZGQoIG9iamVjdCwgJ251bWJlcicsIDAsIDEwMCwgMSApO1xuXHQgKiBndWkuYWRkKCBvYmplY3QsICdvcHRpb25zJywgWyAxLCAyLCAzIF0gKTtcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRoZSBjb250cm9sbGVyIHdpbGwgbW9kaWZ5LlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgTmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gY29udHJvbC5cblx0ICogQHBhcmFtIHtudW1iZXJ8b2JqZWN0fEFycmF5fSBbJDFdIE1pbmltdW0gdmFsdWUgZm9yIG51bWJlciBjb250cm9sbGVycywgb3IgdGhlIHNldCBvZlxuXHQgKiBzZWxlY3RhYmxlIHZhbHVlcyBmb3IgYSBkcm9wZG93bi5cblx0ICogQHBhcmFtIHtudW1iZXJ9IFttYXhdIE1heGltdW0gdmFsdWUgZm9yIG51bWJlciBjb250cm9sbGVycy5cblx0ICogQHBhcmFtIHtudW1iZXJ9IFtzdGVwXSBTdGVwIHZhbHVlIGZvciBudW1iZXIgY29udHJvbGxlcnMuXG5cdCAqIEByZXR1cm5zIHtDb250cm9sbGVyfVxuXHQgKi9cblx0YWRkKCBvYmplY3QsIHByb3BlcnR5LCAkMSwgbWF4LCBzdGVwICkge1xuXG5cdFx0aWYgKCBPYmplY3QoICQxICkgPT09ICQxICkge1xuXG5cdFx0XHRyZXR1cm4gbmV3IE9wdGlvbkNvbnRyb2xsZXIoIHRoaXMsIG9iamVjdCwgcHJvcGVydHksICQxICk7XG5cblx0XHR9XG5cblx0XHRjb25zdCBpbml0aWFsVmFsdWUgPSBvYmplY3RbIHByb3BlcnR5IF07XG5cblx0XHRzd2l0Y2ggKCB0eXBlb2YgaW5pdGlhbFZhbHVlICkge1xuXG5cdFx0XHRjYXNlICdudW1iZXInOlxuXG5cdFx0XHRcdHJldHVybiBuZXcgTnVtYmVyQ29udHJvbGxlciggdGhpcywgb2JqZWN0LCBwcm9wZXJ0eSwgJDEsIG1heCwgc3RlcCApO1xuXG5cdFx0XHRjYXNlICdib29sZWFuJzpcblxuXHRcdFx0XHRyZXR1cm4gbmV3IEJvb2xlYW5Db250cm9sbGVyKCB0aGlzLCBvYmplY3QsIHByb3BlcnR5ICk7XG5cblx0XHRcdGNhc2UgJ3N0cmluZyc6XG5cblx0XHRcdFx0cmV0dXJuIG5ldyBTdHJpbmdDb250cm9sbGVyKCB0aGlzLCBvYmplY3QsIHByb3BlcnR5ICk7XG5cblx0XHRcdGNhc2UgJ2Z1bmN0aW9uJzpcblxuXHRcdFx0XHRyZXR1cm4gbmV3IEZ1bmN0aW9uQ29udHJvbGxlciggdGhpcywgb2JqZWN0LCBwcm9wZXJ0eSApO1xuXG5cdFx0fVxuXG5cdFx0Y29uc29sZS5lcnJvciggYGd1aS5hZGQgZmFpbGVkXG5cdHByb3BlcnR5OmAsIHByb3BlcnR5LCBgXG5cdG9iamVjdDpgLCBvYmplY3QsIGBcblx0dmFsdWU6YCwgaW5pdGlhbFZhbHVlICk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBBZGRzIGEgY29sb3IgY29udHJvbGxlciB0byB0aGUgR1VJLlxuXHQgKiBAZXhhbXBsZVxuXHQgKiBwYXJhbXMgPSB7XG5cdCAqIFx0Y3NzQ29sb3I6ICcjZmYwMGZmJyxcblx0ICogXHRyZ2JDb2xvcjogeyByOiAwLCBnOiAwLjIsIGI6IDAuNCB9LFxuXHQgKiBcdGN1c3RvbVJhbmdlOiBbIDAsIDEyNywgMjU1IF0sXG5cdCAqIH07XG5cdCAqXG5cdCAqIGd1aS5hZGRDb2xvciggcGFyYW1zLCAnY3NzQ29sb3InICk7XG5cdCAqIGd1aS5hZGRDb2xvciggcGFyYW1zLCAncmdiQ29sb3InICk7XG5cdCAqIGd1aS5hZGRDb2xvciggcGFyYW1zLCAnY3VzdG9tUmFuZ2UnLCAyNTUgKTtcblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRoZSBjb250cm9sbGVyIHdpbGwgbW9kaWZ5LlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgTmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gY29udHJvbC5cblx0ICogQHBhcmFtIHtudW1iZXJ9IHJnYlNjYWxlIE1heGltdW0gdmFsdWUgZm9yIGEgY29sb3IgY2hhbm5lbCB3aGVuIHVzaW5nIGFuIFJHQiBjb2xvci4gWW91IG1heVxuXHQgKiBuZWVkIHRvIHNldCB0aGlzIHRvIDI1NSBpZiB5b3VyIGNvbG9ycyBhcmUgdG9vIGJyaWdodC5cblx0ICogQHJldHVybnMge0NvbnRyb2xsZXJ9XG5cdCAqL1xuXHRhZGRDb2xvciggb2JqZWN0LCBwcm9wZXJ0eSwgcmdiU2NhbGUgPSAxICkge1xuXHRcdHJldHVybiBuZXcgQ29sb3JDb250cm9sbGVyKCB0aGlzLCBvYmplY3QsIHByb3BlcnR5LCByZ2JTY2FsZSApO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFkZHMgYSBmb2xkZXIgdG8gdGhlIEdVSSwgd2hpY2ggaXMganVzdCBhbm90aGVyIEdVSS4gVGhpcyBtZXRob2QgcmV0dXJuc1xuXHQgKiB0aGUgbmVzdGVkIEdVSSBzbyB5b3UgY2FuIGFkZCBjb250cm9sbGVycyB0byBpdC5cblx0ICogQGV4YW1wbGVcblx0ICogY29uc3QgZm9sZGVyID0gZ3VpLmFkZEZvbGRlciggJ1Bvc2l0aW9uJyApO1xuXHQgKiBmb2xkZXIuYWRkKCBwb3NpdGlvbiwgJ3gnICk7XG5cdCAqIGZvbGRlci5hZGQoIHBvc2l0aW9uLCAneScgKTtcblx0ICogZm9sZGVyLmFkZCggcG9zaXRpb24sICd6JyApO1xuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGl0bGUgTmFtZSB0byBkaXNwbGF5IGluIHRoZSBmb2xkZXIncyB0aXRsZSBiYXIuXG5cdCAqIEByZXR1cm5zIHtHVUl9XG5cdCAqL1xuXHRhZGRGb2xkZXIoIHRpdGxlICkge1xuXHRcdGNvbnN0IGZvbGRlciA9IG5ldyBHVUkoIHsgcGFyZW50OiB0aGlzLCB0aXRsZSB9ICk7XG5cdFx0aWYgKCB0aGlzLnJvb3QuX2Nsb3NlRm9sZGVycyApIGZvbGRlci5jbG9zZSgpO1xuXHRcdHJldHVybiBmb2xkZXI7XG5cdH1cblxuXHQvKipcblx0ICogUmVjYWxscyB2YWx1ZXMgdGhhdCB3ZXJlIHNhdmVkIHdpdGggYGd1aS5zYXZlKClgLlxuXHQgKiBAcGFyYW0ge29iamVjdH0gb2JqXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gcmVjdXJzaXZlIFBhc3MgZmFsc2UgdG8gZXhjbHVkZSBmb2xkZXJzIGRlc2NlbmRpbmcgZnJvbSB0aGlzIEdVSS5cblx0ICogQHJldHVybnMge3RoaXN9XG5cdCAqL1xuXHRsb2FkKCBvYmosIHJlY3Vyc2l2ZSA9IHRydWUgKSB7XG5cblx0XHRpZiAoIG9iai5jb250cm9sbGVycyApIHtcblxuXHRcdFx0dGhpcy5jb250cm9sbGVycy5mb3JFYWNoKCBjID0+IHtcblxuXHRcdFx0XHRpZiAoIGMgaW5zdGFuY2VvZiBGdW5jdGlvbkNvbnRyb2xsZXIgKSByZXR1cm47XG5cblx0XHRcdFx0aWYgKCBjLl9uYW1lIGluIG9iai5jb250cm9sbGVycyApIHtcblx0XHRcdFx0XHRjLmxvYWQoIG9iai5jb250cm9sbGVyc1sgYy5fbmFtZSBdICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSApO1xuXG5cdFx0fVxuXG5cdFx0aWYgKCByZWN1cnNpdmUgJiYgb2JqLmZvbGRlcnMgKSB7XG5cblx0XHRcdHRoaXMuZm9sZGVycy5mb3JFYWNoKCBmID0+IHtcblxuXHRcdFx0XHRpZiAoIGYuX3RpdGxlIGluIG9iai5mb2xkZXJzICkge1xuXHRcdFx0XHRcdGYubG9hZCggb2JqLmZvbGRlcnNbIGYuX3RpdGxlIF0gKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9ICk7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgYW4gb2JqZWN0IG1hcHBpbmcgY29udHJvbGxlciBuYW1lcyB0byB2YWx1ZXMuIFRoZSBvYmplY3QgY2FuIGJlIHBhc3NlZCB0byBgZ3VpLmxvYWQoKWAgdG9cblx0ICogcmVjYWxsIHRoZXNlIHZhbHVlcy5cblx0ICogQGV4YW1wbGVcblx0ICoge1xuXHQgKiBcdGNvbnRyb2xsZXJzOiB7XG5cdCAqIFx0XHRwcm9wMTogMSxcblx0ICogXHRcdHByb3AyOiAndmFsdWUnLFxuXHQgKiBcdFx0Li4uXG5cdCAqIFx0fSxcblx0ICogXHRmb2xkZXJzOiB7XG5cdCAqIFx0XHRmb2xkZXJOYW1lMTogeyBjb250cm9sbGVycywgZm9sZGVycyB9LFxuXHQgKiBcdFx0Zm9sZGVyTmFtZTI6IHsgY29udHJvbGxlcnMsIGZvbGRlcnMgfVxuXHQgKiBcdFx0Li4uXG5cdCAqIFx0fVxuXHQgKiB9XG5cdCAqXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gcmVjdXJzaXZlIFBhc3MgZmFsc2UgdG8gZXhjbHVkZSBmb2xkZXJzIGRlc2NlbmRpbmcgZnJvbSB0aGlzIEdVSS5cblx0ICogQHJldHVybnMge29iamVjdH1cblx0ICovXG5cdHNhdmUoIHJlY3Vyc2l2ZSA9IHRydWUgKSB7XG5cblx0XHRjb25zdCBvYmogPSB7XG5cdFx0XHRjb250cm9sbGVyczoge30sXG5cdFx0XHRmb2xkZXJzOiB7fVxuXHRcdH07XG5cblx0XHR0aGlzLmNvbnRyb2xsZXJzLmZvckVhY2goIGMgPT4ge1xuXG5cdFx0XHRpZiAoIGMgaW5zdGFuY2VvZiBGdW5jdGlvbkNvbnRyb2xsZXIgKSByZXR1cm47XG5cblx0XHRcdGlmICggYy5fbmFtZSBpbiBvYmouY29udHJvbGxlcnMgKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciggYENhbm5vdCBzYXZlIEdVSSB3aXRoIGR1cGxpY2F0ZSBwcm9wZXJ0eSBcIiR7Yy5fbmFtZX1cImAgKTtcblx0XHRcdH1cblxuXHRcdFx0b2JqLmNvbnRyb2xsZXJzWyBjLl9uYW1lIF0gPSBjLnNhdmUoKTtcblxuXHRcdH0gKTtcblxuXHRcdGlmICggcmVjdXJzaXZlICkge1xuXG5cdFx0XHR0aGlzLmZvbGRlcnMuZm9yRWFjaCggZiA9PiB7XG5cblx0XHRcdFx0aWYgKCBmLl90aXRsZSBpbiBvYmouZm9sZGVycyApIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoIGBDYW5ub3Qgc2F2ZSBHVUkgd2l0aCBkdXBsaWNhdGUgZm9sZGVyIFwiJHtmLl90aXRsZX1cImAgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG9iai5mb2xkZXJzWyBmLl90aXRsZSBdID0gZi5zYXZlKCk7XG5cblx0XHRcdH0gKTtcblxuXHRcdH1cblxuXHRcdHJldHVybiBvYmo7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBPcGVucyBhIEdVSSBvciBmb2xkZXIuIEdVSSBhbmQgZm9sZGVycyBhcmUgb3BlbiBieSBkZWZhdWx0LlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG9wZW4gUGFzcyBmYWxzZSB0byBjbG9zZS5cblx0ICogQHJldHVybnMge3RoaXN9XG5cdCAqIEBleGFtcGxlXG5cdCAqIGd1aS5vcGVuKCk7IC8vIG9wZW5cblx0ICogZ3VpLm9wZW4oIGZhbHNlICk7IC8vIGNsb3NlXG5cdCAqIGd1aS5vcGVuKCBndWkuX2Nsb3NlZCApOyAvLyB0b2dnbGVcblx0ICovXG5cdG9wZW4oIG9wZW4gPSB0cnVlICkge1xuXG5cdFx0dGhpcy5fc2V0Q2xvc2VkKCAhb3BlbiApO1xuXG5cdFx0dGhpcy4kdGl0bGUuc2V0QXR0cmlidXRlKCAnYXJpYS1leHBhbmRlZCcsICF0aGlzLl9jbG9zZWQgKTtcblx0XHR0aGlzLmRvbUVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSggJ2Nsb3NlZCcsIHRoaXMuX2Nsb3NlZCApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBDbG9zZXMgdGhlIEdVSS5cblx0ICogQHJldHVybnMge3RoaXN9XG5cdCAqL1xuXHRjbG9zZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5vcGVuKCBmYWxzZSApO1xuXHR9XG5cblx0X3NldENsb3NlZCggY2xvc2VkICkge1xuXHRcdGlmICggdGhpcy5fY2xvc2VkID09PSBjbG9zZWQgKSByZXR1cm47XG5cdFx0dGhpcy5fY2xvc2VkID0gY2xvc2VkO1xuXHRcdHRoaXMuX2NhbGxPbk9wZW5DbG9zZSggdGhpcyApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFNob3dzIHRoZSBHVUkgYWZ0ZXIgaXQncyBiZWVuIGhpZGRlbi5cblx0ICogQHBhcmFtIHtib29sZWFufSBzaG93XG5cdCAqIEByZXR1cm5zIHt0aGlzfVxuXHQgKiBAZXhhbXBsZVxuXHQgKiBndWkuc2hvdygpO1xuXHQgKiBndWkuc2hvdyggZmFsc2UgKTsgLy8gaGlkZVxuXHQgKiBndWkuc2hvdyggZ3VpLl9oaWRkZW4gKTsgLy8gdG9nZ2xlXG5cdCAqL1xuXHRzaG93KCBzaG93ID0gdHJ1ZSApIHtcblxuXHRcdHRoaXMuX2hpZGRlbiA9ICFzaG93O1xuXG5cdFx0dGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSB0aGlzLl9oaWRkZW4gPyAnbm9uZScgOiAnJztcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH1cblxuXHQvKipcblx0ICogSGlkZXMgdGhlIEdVSS5cblx0ICogQHJldHVybnMge3RoaXN9XG5cdCAqL1xuXHRoaWRlKCkge1xuXHRcdHJldHVybiB0aGlzLnNob3coIGZhbHNlICk7XG5cdH1cblxuXHRvcGVuQW5pbWF0ZWQoIG9wZW4gPSB0cnVlICkge1xuXG5cdFx0Ly8gc2V0IHN0YXRlIGltbWVkaWF0ZWx5XG5cdFx0dGhpcy5fc2V0Q2xvc2VkKCAhb3BlbiApO1xuXG5cdFx0dGhpcy4kdGl0bGUuc2V0QXR0cmlidXRlKCAnYXJpYS1leHBhbmRlZCcsICF0aGlzLl9jbG9zZWQgKTtcblxuXHRcdC8vIHdhaXQgZm9yIG5leHQgZnJhbWUgdG8gbWVhc3VyZSAkY2hpbGRyZW5cblx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoICgpID0+IHtcblxuXHRcdFx0Ly8gZXhwbGljaXRseSBzZXQgaW5pdGlhbCBoZWlnaHQgZm9yIHRyYW5zaXRpb25cblx0XHRcdGNvbnN0IGluaXRpYWxIZWlnaHQgPSB0aGlzLiRjaGlsZHJlbi5jbGllbnRIZWlnaHQ7XG5cdFx0XHR0aGlzLiRjaGlsZHJlbi5zdHlsZS5oZWlnaHQgPSBpbml0aWFsSGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0dGhpcy5kb21FbGVtZW50LmNsYXNzTGlzdC5hZGQoICd0cmFuc2l0aW9uJyApO1xuXG5cdFx0XHRjb25zdCBvblRyYW5zaXRpb25FbmQgPSBlID0+IHtcblx0XHRcdFx0aWYgKCBlLnRhcmdldCAhPT0gdGhpcy4kY2hpbGRyZW4gKSByZXR1cm47XG5cdFx0XHRcdHRoaXMuJGNoaWxkcmVuLnN0eWxlLmhlaWdodCA9ICcnO1xuXHRcdFx0XHR0aGlzLmRvbUVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSggJ3RyYW5zaXRpb24nICk7XG5cdFx0XHRcdHRoaXMuJGNoaWxkcmVuLnJlbW92ZUV2ZW50TGlzdGVuZXIoICd0cmFuc2l0aW9uZW5kJywgb25UcmFuc2l0aW9uRW5kICk7XG5cdFx0XHR9O1xuXG5cdFx0XHR0aGlzLiRjaGlsZHJlbi5hZGRFdmVudExpc3RlbmVyKCAndHJhbnNpdGlvbmVuZCcsIG9uVHJhbnNpdGlvbkVuZCApO1xuXG5cdFx0XHQvLyB0b2RvOiB0aGlzIGlzIHdyb25nIGlmIGNoaWxkcmVuJ3Mgc2Nyb2xsSGVpZ2h0IG1ha2VzIGZvciBhIGd1aSB0YWxsZXIgdGhhbiBtYXhIZWlnaHRcblx0XHRcdGNvbnN0IHRhcmdldEhlaWdodCA9ICFvcGVuID8gMCA6IHRoaXMuJGNoaWxkcmVuLnNjcm9sbEhlaWdodDtcblxuXHRcdFx0dGhpcy5kb21FbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoICdjbG9zZWQnLCAhb3BlbiApO1xuXG5cdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoICgpID0+IHtcblx0XHRcdFx0dGhpcy4kY2hpbGRyZW4uc3R5bGUuaGVpZ2h0ID0gdGFyZ2V0SGVpZ2h0ICsgJ3B4Jztcblx0XHRcdH0gKTtcblxuXHRcdH0gKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH1cblxuXHQvKipcblx0ICogQ2hhbmdlIHRoZSB0aXRsZSBvZiB0aGlzIEdVSS5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRpdGxlXG5cdCAqIEByZXR1cm5zIHt0aGlzfVxuXHQgKi9cblx0dGl0bGUoIHRpdGxlICkge1xuXHRcdC8qKlxuXHRcdCAqIEN1cnJlbnQgdGl0bGUgb2YgdGhlIEdVSS4gVXNlIGBndWkudGl0bGUoICdUaXRsZScgKWAgdG8gbW9kaWZ5IHRoaXMgdmFsdWUuXG5cdFx0ICogQHR5cGUge3N0cmluZ31cblx0XHQgKi9cblx0XHR0aGlzLl90aXRsZSA9IHRpdGxlO1xuXHRcdHRoaXMuJHRpdGxlLnRleHRDb250ZW50ID0gdGl0bGU7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogUmVzZXRzIGFsbCBjb250cm9sbGVycyB0byB0aGVpciBpbml0aWFsIHZhbHVlcy5cblx0ICogQHBhcmFtIHtib29sZWFufSByZWN1cnNpdmUgUGFzcyBmYWxzZSB0byBleGNsdWRlIGZvbGRlcnMgZGVzY2VuZGluZyBmcm9tIHRoaXMgR1VJLlxuXHQgKiBAcmV0dXJucyB7dGhpc31cblx0ICovXG5cdHJlc2V0KCByZWN1cnNpdmUgPSB0cnVlICkge1xuXHRcdGNvbnN0IGNvbnRyb2xsZXJzID0gcmVjdXJzaXZlID8gdGhpcy5jb250cm9sbGVyc1JlY3Vyc2l2ZSgpIDogdGhpcy5jb250cm9sbGVycztcblx0XHRjb250cm9sbGVycy5mb3JFYWNoKCBjID0+IGMucmVzZXQoKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFBhc3MgYSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbmV2ZXIgYSBjb250cm9sbGVyIGluIHRoaXMgR1VJIGNoYW5nZXMuXG5cdCAqIEBwYXJhbSB7ZnVuY3Rpb24oe29iamVjdDpvYmplY3QsIHByb3BlcnR5OnN0cmluZywgdmFsdWU6YW55LCBjb250cm9sbGVyOkNvbnRyb2xsZXJ9KX0gY2FsbGJhY2tcblx0ICogQHJldHVybnMge3RoaXN9XG5cdCAqIEBleGFtcGxlXG5cdCAqIGd1aS5vbkNoYW5nZSggZXZlbnQgPT4ge1xuXHQgKiBcdGV2ZW50Lm9iamVjdCAgICAgLy8gb2JqZWN0IHRoYXQgd2FzIG1vZGlmaWVkXG5cdCAqIFx0ZXZlbnQucHJvcGVydHkgICAvLyBzdHJpbmcsIG5hbWUgb2YgcHJvcGVydHlcblx0ICogXHRldmVudC52YWx1ZSAgICAgIC8vIG5ldyB2YWx1ZSBvZiBjb250cm9sbGVyXG5cdCAqIFx0ZXZlbnQuY29udHJvbGxlciAvLyBjb250cm9sbGVyIHRoYXQgd2FzIG1vZGlmaWVkXG5cdCAqIH0gKTtcblx0ICovXG5cdG9uQ2hhbmdlKCBjYWxsYmFjayApIHtcblx0XHQvKipcblx0XHQgKiBVc2VkIHRvIGFjY2VzcyB0aGUgZnVuY3Rpb24gYm91bmQgdG8gYG9uQ2hhbmdlYCBldmVudHMuIERvbid0IG1vZGlmeSB0aGlzIHZhbHVlXG5cdFx0ICogZGlyZWN0bHkuIFVzZSB0aGUgYGd1aS5vbkNoYW5nZSggY2FsbGJhY2sgKWAgbWV0aG9kIGluc3RlYWQuXG5cdFx0ICogQHR5cGUge0Z1bmN0aW9ufVxuXHRcdCAqL1xuXHRcdHRoaXMuX29uQ2hhbmdlID0gY2FsbGJhY2s7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRfY2FsbE9uQ2hhbmdlKCBjb250cm9sbGVyICkge1xuXG5cdFx0aWYgKCB0aGlzLnBhcmVudCApIHtcblx0XHRcdHRoaXMucGFyZW50Ll9jYWxsT25DaGFuZ2UoIGNvbnRyb2xsZXIgKTtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMuX29uQ2hhbmdlICE9PSB1bmRlZmluZWQgKSB7XG5cdFx0XHR0aGlzLl9vbkNoYW5nZS5jYWxsKCB0aGlzLCB7XG5cdFx0XHRcdG9iamVjdDogY29udHJvbGxlci5vYmplY3QsXG5cdFx0XHRcdHByb3BlcnR5OiBjb250cm9sbGVyLnByb3BlcnR5LFxuXHRcdFx0XHR2YWx1ZTogY29udHJvbGxlci5nZXRWYWx1ZSgpLFxuXHRcdFx0XHRjb250cm9sbGVyXG5cdFx0XHR9ICk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFBhc3MgYSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbmV2ZXIgYSBjb250cm9sbGVyIGluIHRoaXMgR1VJIGhhcyBmaW5pc2hlZCBjaGFuZ2luZy5cblx0ICogQHBhcmFtIHtmdW5jdGlvbih7b2JqZWN0Om9iamVjdCwgcHJvcGVydHk6c3RyaW5nLCB2YWx1ZTphbnksIGNvbnRyb2xsZXI6Q29udHJvbGxlcn0pfSBjYWxsYmFja1xuXHQgKiBAcmV0dXJucyB7dGhpc31cblx0ICogQGV4YW1wbGVcblx0ICogZ3VpLm9uRmluaXNoQ2hhbmdlKCBldmVudCA9PiB7XG5cdCAqIFx0ZXZlbnQub2JqZWN0ICAgICAvLyBvYmplY3QgdGhhdCB3YXMgbW9kaWZpZWRcblx0ICogXHRldmVudC5wcm9wZXJ0eSAgIC8vIHN0cmluZywgbmFtZSBvZiBwcm9wZXJ0eVxuXHQgKiBcdGV2ZW50LnZhbHVlICAgICAgLy8gbmV3IHZhbHVlIG9mIGNvbnRyb2xsZXJcblx0ICogXHRldmVudC5jb250cm9sbGVyIC8vIGNvbnRyb2xsZXIgdGhhdCB3YXMgbW9kaWZpZWRcblx0ICogfSApO1xuXHQgKi9cblx0b25GaW5pc2hDaGFuZ2UoIGNhbGxiYWNrICkge1xuXHRcdC8qKlxuXHRcdCAqIFVzZWQgdG8gYWNjZXNzIHRoZSBmdW5jdGlvbiBib3VuZCB0byBgb25GaW5pc2hDaGFuZ2VgIGV2ZW50cy4gRG9uJ3QgbW9kaWZ5IHRoaXMgdmFsdWVcblx0XHQgKiBkaXJlY3RseS4gVXNlIHRoZSBgZ3VpLm9uRmluaXNoQ2hhbmdlKCBjYWxsYmFjayApYCBtZXRob2QgaW5zdGVhZC5cblx0XHQgKiBAdHlwZSB7RnVuY3Rpb259XG5cdFx0ICovXG5cdFx0dGhpcy5fb25GaW5pc2hDaGFuZ2UgPSBjYWxsYmFjaztcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdF9jYWxsT25GaW5pc2hDaGFuZ2UoIGNvbnRyb2xsZXIgKSB7XG5cblx0XHRpZiAoIHRoaXMucGFyZW50ICkge1xuXHRcdFx0dGhpcy5wYXJlbnQuX2NhbGxPbkZpbmlzaENoYW5nZSggY29udHJvbGxlciApO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5fb25GaW5pc2hDaGFuZ2UgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdHRoaXMuX29uRmluaXNoQ2hhbmdlLmNhbGwoIHRoaXMsIHtcblx0XHRcdFx0b2JqZWN0OiBjb250cm9sbGVyLm9iamVjdCxcblx0XHRcdFx0cHJvcGVydHk6IGNvbnRyb2xsZXIucHJvcGVydHksXG5cdFx0XHRcdHZhbHVlOiBjb250cm9sbGVyLmdldFZhbHVlKCksXG5cdFx0XHRcdGNvbnRyb2xsZXJcblx0XHRcdH0gKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogUGFzcyBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoaXMgR1VJIG9yIGl0cyBkZXNjZW5kYW50cyBhcmUgb3BlbmVkIG9yIGNsb3NlZC5cblx0ICogQHBhcmFtIHtmdW5jdGlvbihHVUkpfSBjYWxsYmFja1xuXHQgKiBAcmV0dXJucyB7dGhpc31cblx0ICogQGV4YW1wbGVcblx0ICogZ3VpLm9uT3BlbkNsb3NlKCBjaGFuZ2VkR1VJID0+IHtcblx0ICogXHRjb25zb2xlLmxvZyggY2hhbmdlZEdVSS5fY2xvc2VkICk7XG5cdCAqIH0gKTtcblx0ICovXG5cdG9uT3BlbkNsb3NlKCBjYWxsYmFjayApIHtcblx0XHR0aGlzLl9vbk9wZW5DbG9zZSA9IGNhbGxiYWNrO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0X2NhbGxPbk9wZW5DbG9zZSggY2hhbmdlZEdVSSApIHtcblx0XHRpZiAoIHRoaXMucGFyZW50ICkge1xuXHRcdFx0dGhpcy5wYXJlbnQuX2NhbGxPbk9wZW5DbG9zZSggY2hhbmdlZEdVSSApO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5fb25PcGVuQ2xvc2UgIT09IHVuZGVmaW5lZCApIHtcblx0XHRcdHRoaXMuX29uT3BlbkNsb3NlLmNhbGwoIHRoaXMsIGNoYW5nZWRHVUkgKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogRGVzdHJveXMgYWxsIERPTSBlbGVtZW50cyBhbmQgZXZlbnQgbGlzdGVuZXJzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIEdVSS5cblx0ICovXG5cdGRlc3Ryb3koKSB7XG5cblx0XHRpZiAoIHRoaXMucGFyZW50ICkge1xuXHRcdFx0dGhpcy5wYXJlbnQuY2hpbGRyZW4uc3BsaWNlKCB0aGlzLnBhcmVudC5jaGlsZHJlbi5pbmRleE9mKCB0aGlzICksIDEgKTtcblx0XHRcdHRoaXMucGFyZW50LmZvbGRlcnMuc3BsaWNlKCB0aGlzLnBhcmVudC5mb2xkZXJzLmluZGV4T2YoIHRoaXMgKSwgMSApO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy5kb21FbGVtZW50LnBhcmVudEVsZW1lbnQgKSB7XG5cdFx0XHR0aGlzLmRvbUVsZW1lbnQucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCggdGhpcy5kb21FbGVtZW50ICk7XG5cdFx0fVxuXG5cdFx0QXJyYXkuZnJvbSggdGhpcy5jaGlsZHJlbiApLmZvckVhY2goIGMgPT4gYy5kZXN0cm95KCkgKTtcblxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgYW4gYXJyYXkgb2YgY29udHJvbGxlcnMgY29udGFpbmVkIGJ5IHRoaXMgR1VJIGFuZCBpdHMgZGVzY2VuZGVudHMuXG5cdCAqIEByZXR1cm5zIHtDb250cm9sbGVyW119XG5cdCAqL1xuXHRjb250cm9sbGVyc1JlY3Vyc2l2ZSgpIHtcblx0XHRsZXQgY29udHJvbGxlcnMgPSBBcnJheS5mcm9tKCB0aGlzLmNvbnRyb2xsZXJzICk7XG5cdFx0dGhpcy5mb2xkZXJzLmZvckVhY2goIGYgPT4ge1xuXHRcdFx0Y29udHJvbGxlcnMgPSBjb250cm9sbGVycy5jb25jYXQoIGYuY29udHJvbGxlcnNSZWN1cnNpdmUoKSApO1xuXHRcdH0gKTtcblx0XHRyZXR1cm4gY29udHJvbGxlcnM7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyBhbiBhcnJheSBvZiBmb2xkZXJzIGNvbnRhaW5lZCBieSB0aGlzIEdVSSBhbmQgaXRzIGRlc2NlbmRlbnRzLlxuXHQgKiBAcmV0dXJucyB7R1VJW119XG5cdCAqL1xuXHRmb2xkZXJzUmVjdXJzaXZlKCkge1xuXHRcdGxldCBmb2xkZXJzID0gQXJyYXkuZnJvbSggdGhpcy5mb2xkZXJzICk7XG5cdFx0dGhpcy5mb2xkZXJzLmZvckVhY2goIGYgPT4ge1xuXHRcdFx0Zm9sZGVycyA9IGZvbGRlcnMuY29uY2F0KCBmLmZvbGRlcnNSZWN1cnNpdmUoKSApO1xuXHRcdH0gKTtcblx0XHRyZXR1cm4gZm9sZGVycztcblx0fVxuXG59XG5cbmV4cG9ydCB7IEJvb2xlYW5Db250cm9sbGVyLCBDb2xvckNvbnRyb2xsZXIsIENvbnRyb2xsZXIsIEZ1bmN0aW9uQ29udHJvbGxlciwgR1VJLCBOdW1iZXJDb250cm9sbGVyLCBPcHRpb25Db250cm9sbGVyLCBTdHJpbmdDb250cm9sbGVyLCBHVUkgYXMgZGVmYXVsdCB9O1xuIiwiaW1wb3J0IEdVSSBmcm9tIFwibGlsLWd1aVwiO1xuaW1wb3J0IHsgcmVxdWVzdERldmljZSwgY29uZmlndXJlQ2FudmFzLCBjcmVhdGVTaGFkZXIsIGNyZWF0ZVBlcmZvcm1hbmNlUXVlcmllcywgc2V0dXBJbnRlcmFjdGlvbnMgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHJlbmRlckNvZGUgZnJvbSBcIi4vc2hhZGVycy9yZW5kZXIud2dzbFwiO1xuaW1wb3J0IHNpbXVsYXRlQ29kZSBmcm9tIFwiLi9zaGFkZXJzL3NpbXVsYXRlLndnc2xcIjtcblxuY29uc3QgU0NBTEUgPSAyOyAvLyBTY2FsZSBmYWN0b3IgZm9yIHRoZSBjYW52YXMgc2l6ZS4gZGV0ZXJtaW5lcyB0ZXh0dXJlIHJlc29sdXRpb25cbmNvbnN0IENBTlZBU19TVFJFVENIID0gMi4wOyAvLyBjYW52YXMgc2l6ZSBzdHJldGNoIGZhY3RvclxuY29uc3QgTUFYX1RFWF9TSVpFID0gMTAyNDtcbmNvbnN0IFdPUktHUk9VUF9TSVpFID0gMjU2O1xuXG4vLyBTaXplcyBpbiBieXRlcyAtIHVzZWZ1bCBmb3IgY2FsY3VsYXRpbmcgYnVmZmVyIHNpemVzIGFuZCBvZmZzZXRzXG5jb25zdCBzaXplcyA9IHtcbiAgZjMyOiA0LFxuICB1MzI6IDQsXG4gIGkzMjogNCxcbiAgdmVjMjogOCxcbiAgdmVjNDogMTYsXG59O1xuXG4vLyBVbmlmb3JtIHZhbHVlcyBjb250YWluZXJcbmNvbnN0IHVuaWZvcm1zID0ge1xuICBjb21wdXRlU3RlcHNQZXJGcmFtZTogMjAsXG4gIHRhcmdldEZQUzogMTIwLFxuICBhY3RpbkNvdW50OiA0MDAwMCwgLy8gNDAwMCBpcyBtaW5pbXVtIGZvciBuaWNlIGFjdGlvbi5cbiAgbWVtYnJhbmVDb3VudDogMjAwLFxuICBvbmx5QmluZFdoZW5BbmdsZTogMC4wMSxcbiAgZm9vZE5lYXJieVRocmVzaG9sZDogMC4wMSxcbiAgdW5iaW5kUHJvYjogMC4wMTYsXG4gIHBvbHltZXJSZXB1bHNpb246IDAuNDIyLFxuICBtZW1icmFuZUNvaGVzaW9uUmFuZ2U6IDE2LFxuICBhY3RpbkNvaGVzaW9uUmFuZ2U6IDEsXG4gIHN0YXJ0c051Y2xlYXRlZFByb2I6IDAuMDMsXG4gIGFjdGluU2Vuc29yUmFuZG9tT2Zmc2V0OiAwLjUsIC8vIGxvd2VyIGxvb2tzIG5lYXRlciwgYnV0IHJlc3VsdHMgaW4gcGFyYWxsZWwtdG8tbWVtYnJhbmUgcG9seW1lcnNcbiAgYWN0aW5TdGVyaWNGb3JjZTogMC41LFxuICBtZW1icmFuZVRlbnNpb246IDguNCxcbiAgZm9vZFNwYXduQXJlYTogMC43Nyxcbn07XG5cbmNvbnN0IGNvbnRyb2xzQnVmZmVyU2l6ZSA9IDYwOyAvLyBVcGRhdGVkIHRvIG1hdGNoIFdHU0wgc3RydWN0IHBhZGRlZCBzaXplXG5jb25zdCBjb250cm9sc0J1ZmZlckRhdGEgPSBuZXcgQXJyYXlCdWZmZXIoY29udHJvbHNCdWZmZXJTaXplKTtcbmNvbnN0IGNvbnRyb2xzRGF0YVZpZXcgPSBuZXcgRGF0YVZpZXcoY29udHJvbHNCdWZmZXJEYXRhKTtcblxuYXN5bmMgZnVuY3Rpb24gaW5kZXgoKSB7XG4gIC8vIHNldHVwIGFuZCBjb25maWd1cmUgV2ViR1BVXG4gIGNvbnN0IGRldmljZSA9IGF3YWl0IHJlcXVlc3REZXZpY2UoKTtcbiAgY29uc3QgY2FudmFzID0gY29uZmlndXJlQ2FudmFzKGRldmljZSk7XG4gIC8vIHNldCB0aW1lIHRvIGEgcmFuZG9tIGludCBiZXR3ZWVuIDAgYW5kIDEwMDBcbiAgbGV0IHRpbWUgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwKTtcbiAgY29uc29sZS5sb2coXCJUaW1lOiBcIiwgdGltZSk7XG5cbiAgLy8gVEVYVFVSRUxPQURJTkdJTkdOSUdJTklHTkcgLS0tLSBTVEFSVFxuICBjb25zdCBhcnRpc3RpY1RleHR1cmUgPSBkZXZpY2UuY3JlYXRlVGV4dHVyZSh7XG4gICAgc2l6ZTogW01BWF9URVhfU0laRSwgTUFYX1RFWF9TSVpFXSxcbiAgICBmb3JtYXQ6IFwicmdiYTh1bm9ybVwiLFxuICAgIHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuVEVYVFVSRV9CSU5ESU5HIHwgR1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNULFxuICB9KTtcblxuICAvLyBjcmVhdGUgYSBzYW1wbGVyIGZvciB0aGUgdGV4dHVyZVxuICBjb25zdCBzYW1wbGVyID0gZGV2aWNlLmNyZWF0ZVNhbXBsZXIoe1xuICAgIGFkZHJlc3NNb2RlVTogXCJyZXBlYXRcIixcbiAgICBhZGRyZXNzTW9kZVY6IFwicmVwZWF0XCIsXG4gICAgbWFnRmlsdGVyOiBcImxpbmVhclwiLFxuICAgIG1pbkZpbHRlcjogXCJsaW5lYXJcIixcbiAgICBtaXBtYXBGaWx0ZXI6IFwibGluZWFyXCIsXG4gIH0pO1xuXG4gIC8vIFRFWFRVUkVMT0FESU5HSU5HTklHSU5JR05HIC0tLS0gRU5EXG4gIGNvbnN0IHdpZHRoID0gTUFYX1RFWF9TSVpFIC8gU0NBTEU7IC8vIGNhbnZhcy5zaXplLndpZHRoIC8gU0NBTEU7XG5cbiAgLy8gQWZ0ZXIgY29uZmlndXJpbmcgdGhlIGNhbnZhcywgcmVzaXplIGl0IHRvIG1hdGNoIHRleHR1cmUgcmVzb2x1dGlvblxuICBjYW52YXMuY2FudmFzLndpZHRoID0gd2lkdGggKiBDQU5WQVNfU1RSRVRDSDtcbiAgY2FudmFzLmNhbnZhcy5oZWlnaHQgPSB3aWR0aCAqIENBTlZBU19TVFJFVENIO1xuICBjYW52YXMuY2FudmFzLnN0eWxlLndpZHRoID0gd2lkdGggKiBDQU5WQVNfU1RSRVRDSCArIFwicHhcIjtcbiAgY2FudmFzLmNhbnZhcy5zdHlsZS5oZWlnaHQgPSB3aWR0aCAqIENBTlZBU19TVFJFVENIICsgXCJweFwiO1xuICBjYW52YXMuY2FudmFzLnN0eWxlLm1heFdpZHRoID0gXCI5N3ZoXCI7XG4gIGNhbnZhcy5jYW52YXMuc3R5bGUubWF4SGVpZ2h0ID0gXCI5N3ZoXCI7XG5cbiAgY29uc3QgdGV4dHVyZXMgPSB7IHNpemU6IHsgd2lkdGg6IE1hdGguY2VpbCh3aWR0aCksIGhlaWdodDogTWF0aC5jZWlsKHdpZHRoKSB9IH07XG4gIGNvbnN0IFRFWFRVUkVfV09SS0dST1VQX0NPVU5UOiBbbnVtYmVyLCBudW1iZXJdID0gW1xuICAgIE1hdGguY2VpbCh0ZXh0dXJlcy5zaXplLndpZHRoIC8gTWF0aC5zcXJ0KFdPUktHUk9VUF9TSVpFKSksXG4gICAgTWF0aC5jZWlsKHRleHR1cmVzLnNpemUuaGVpZ2h0IC8gTWF0aC5zcXJ0KFdPUktHUk9VUF9TSVpFKSksXG4gIF07XG5cbiAgY29uc3QgdGV4dHVyZXNSZW5kZXJpbmcgPSB7IHNpemU6IHsgd2lkdGg6IE1hdGguY2VpbCh3aWR0aCksIGhlaWdodDogTWF0aC5jZWlsKHdpZHRoKSB9IH07XG5cbiAgY29uc3QgQlVGRkVSX1dPUktHUk9VUF9DT1VOVF9BQ1RJTiA9IE1hdGguY2VpbCh1bmlmb3Jtcy5hY3RpbkNvdW50IC8gV09SS0dST1VQX1NJWkUpO1xuICBjb25zdCBCVUZGRVJfV09SS0dST1VQX0NPVU5UX01FTUJSQU5FID0gTWF0aC5jZWlsKHVuaWZvcm1zLm1lbWJyYW5lQ291bnQgLyBXT1JLR1JPVVBfU0laRSk7XG5cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBTZXQgdXAgbWVtb3J5IHJlc291cmNlc1xuICBjb25zdCB2aXNpYmlsaXR5ID0gR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSB8IEdQVVNoYWRlclN0YWdlLkZSQUdNRU5UO1xuXG4gIGNvbnN0IHsgcXVlcnlTZXQsIHJlc29sdmVCdWZmZXIsIHJlc3VsdEJ1ZmZlciB9ID0gYXdhaXQgY3JlYXRlUGVyZm9ybWFuY2VRdWVyaWVzKGRldmljZSk7XG5cbiAgLy8gQ3JlYXRlIHN0b3JhZ2UgdGV4dHVyZXNcbiAgY29uc3Qgc3RvcmFnZVRleHR1cmVzID0gZGV2aWNlLmNyZWF0ZVRleHR1cmUoe1xuICAgIHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuU1RPUkFHRV9CSU5ESU5HIHwgR1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNULFxuICAgIGxhYmVsOiBcInN0b3JhZ2VUZXh0dXJlc1wiLFxuICAgIGZvcm1hdDogXCJyMzJmbG9hdFwiLFxuICAgIHNpemU6IHtcbiAgICAgIHdpZHRoOiB0ZXh0dXJlcy5zaXplLndpZHRoLFxuICAgICAgaGVpZ2h0OiB0ZXh0dXJlcy5zaXplLmhlaWdodCxcbiAgICAgIGRlcHRoT3JBcnJheUxheWVyczogMTEsXG4gICAgfSxcbiAgfSk7XG4gIGNvbnN0IHN0b3JhZ2VUZXh0dXJlc1JlbmRlcmluZyA9IGRldmljZS5jcmVhdGVUZXh0dXJlKHtcbiAgICB1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlNUT1JBR0VfQklORElORyB8IEdQVVRleHR1cmVVc2FnZS5DT1BZX0RTVCxcbiAgICBsYWJlbDogXCJzdG9yYWdlVGV4dHVyZXNSZW5kZXJpbmdcIixcbiAgICBmb3JtYXQ6IFwicjMyZmxvYXRcIixcbiAgICBzaXplOiB7XG4gICAgICB3aWR0aDogdGV4dHVyZXMuc2l6ZS53aWR0aCxcbiAgICAgIGhlaWdodDogdGV4dHVyZXMuc2l6ZS5oZWlnaHQsXG4gICAgICBkZXB0aE9yQXJyYXlMYXllcnM6IDYsXG4gICAgfSxcbiAgfSk7XG5cbiAgY29uc3Qgc3RvcmFnZVRleHR1cmVzTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XG4gICAgbGFiZWw6IFwic3RvcmFnZVRleHR1cmVzTGF5b3V0XCIsXG4gICAgZW50cmllczogW1xuICAgICAge1xuICAgICAgICB2aXNpYmlsaXR5LFxuICAgICAgICBiaW5kaW5nOiAwLFxuICAgICAgICBzdG9yYWdlVGV4dHVyZToge1xuICAgICAgICAgIGFjY2VzczogXCJyZWFkLXdyaXRlXCIsXG4gICAgICAgICAgZm9ybWF0OiBcInIzMmZsb2F0XCIsXG4gICAgICAgICAgdmlld0RpbWVuc2lvbjogXCIyZC1hcnJheVwiLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgdmlzaWJpbGl0eSwgYmluZGluZzogMSwgdGV4dHVyZToge30gfSxcbiAgICAgIHsgdmlzaWJpbGl0eSwgYmluZGluZzogMiwgc2FtcGxlcjoge30gfSxcbiAgICAgIHtcbiAgICAgICAgdmlzaWJpbGl0eSxcbiAgICAgICAgYmluZGluZzogMyxcbiAgICAgICAgc3RvcmFnZVRleHR1cmU6IHtcbiAgICAgICAgICBhY2Nlc3M6IFwicmVhZC13cml0ZVwiLFxuICAgICAgICAgIGZvcm1hdDogXCJyMzJmbG9hdFwiLFxuICAgICAgICAgIHZpZXdEaW1lbnNpb246IFwiMmQtYXJyYXlcIixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSk7XG5cbiAgY29uc3Qgc3RvcmFnZVRleHR1cmVzQmluZEdyb3VwID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG4gICAgbGFiZWw6IFwic3RvcmFnZVRleHR1cmVzQmluZEdyb3VwXCIsXG4gICAgbGF5b3V0OiBzdG9yYWdlVGV4dHVyZXNMYXlvdXQsXG4gICAgZW50cmllczogW1xuICAgICAgeyBiaW5kaW5nOiAwLCByZXNvdXJjZTogc3RvcmFnZVRleHR1cmVzLmNyZWF0ZVZpZXcoKSB9LFxuICAgICAgeyBiaW5kaW5nOiAxLCByZXNvdXJjZTogYXJ0aXN0aWNUZXh0dXJlLmNyZWF0ZVZpZXcoKSB9LFxuICAgICAgeyBiaW5kaW5nOiAyLCByZXNvdXJjZTogc2FtcGxlciB9LFxuICAgICAgeyBiaW5kaW5nOiAzLCByZXNvdXJjZTogc3RvcmFnZVRleHR1cmVzUmVuZGVyaW5nLmNyZWF0ZVZpZXcoKSB9LFxuICAgIF0sXG4gIH0pO1xuXG4gIC8vIFVuaWZvcm0gYnVmZmVyc1xuICBjb25zdCBjYW52YXNCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICBsYWJlbDogXCJDYW52YXMgVW5pZm9ybSBCdWZmZXJcIixcbiAgICBzaXplOiAxNiwgLy8gc2l6ZSAodmVjMjxpMzI+ID0gOCkgKyB0aW1lIChmMzIgPSA0KSArIHBhZGRpbmcgPSAxNlxuICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCB8IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0sXG4gIH0pO1xuXG4gIGNvbnN0IGNvbnRyb2xzQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgbGFiZWw6IFwiQ29udHJvbHMgVW5pZm9ybSBCdWZmZXJcIixcbiAgICBzaXplOiBjb250cm9sc0J1ZmZlclNpemUsXG4gICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNUIHwgR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSxcbiAgfSk7XG5cbiAgLy8gc2V0dXAgaW50ZXJhY3Rpb25zXG4gIGNvbnN0IGludGVyYWN0aW9ucyA9IHNldHVwSW50ZXJhY3Rpb25zKGRldmljZSwgY2FudmFzLmNvbnRleHQuY2FudmFzLCB0ZXh0dXJlcy5zaXplKTtcblxuICBjb25zdCB1bmlmb3Jtc0xheW91dCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xuICAgIGVudHJpZXM6IFtcbiAgICAgIHsgdmlzaWJpbGl0eSwgYmluZGluZzogMCwgYnVmZmVyOiB7IHR5cGU6IFwidW5pZm9ybVwiIH0gfSxcbiAgICAgIHsgdmlzaWJpbGl0eSwgYmluZGluZzogMSwgYnVmZmVyOiB7IHR5cGU6IFwidW5pZm9ybVwiIH0gfSxcbiAgICAgIHsgdmlzaWJpbGl0eSwgYmluZGluZzogMiwgYnVmZmVyOiB7IHR5cGU6IFwidW5pZm9ybVwiIH0gfSxcbiAgICBdLFxuICB9KTtcblxuICBjb25zdCB1bmlmb3Jtc0JpbmRHcm91cCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXAoe1xuICAgIGxhYmVsOiBcIlVuaWZvcm1zIEJpbmQgR3JvdXBcIixcbiAgICBsYXlvdXQ6IHVuaWZvcm1zTGF5b3V0LFxuICAgIGVudHJpZXM6IFtcbiAgICAgIHsgYmluZGluZzogMCwgcmVzb3VyY2U6IHsgYnVmZmVyOiBjYW52YXNCdWZmZXIgfSB9LFxuICAgICAgeyBiaW5kaW5nOiAxLCByZXNvdXJjZTogeyBidWZmZXI6IGNvbnRyb2xzQnVmZmVyIH0gfSxcbiAgICAgIHsgYmluZGluZzogMiwgcmVzb3VyY2U6IHsgYnVmZmVyOiBpbnRlcmFjdGlvbnMuYnVmZmVyIH0gfSxcbiAgICBdLFxuICB9KTtcblxuICAvLyBGdW5jdGlvbiB0byB3cml0ZSB0aGUgdW5pZm9ybXMgb2JqZWN0IGludG8gdGhlIEFycmF5QnVmZmVyIGFjY29yZGluZyB0byBXR1NMIHN0cnVjdCBsYXlvdXRcbiAgY29uc3Qgd3JpdGVVbmlmb3JtcyA9ICgpID0+IHtcbiAgICAvLyBXcml0ZSBjYW52YXMgc2l6ZSBhbmQgdGltZVxuICAgIGNvbnN0IGNhbnZhc0RhdGEgPSBuZXcgQXJyYXlCdWZmZXIoMTYpOyAvLyBVc2UgcGFkZGVkIHNpemVcbiAgICBjb25zdCBjYW52YXNWaWV3ID0gbmV3IERhdGFWaWV3KGNhbnZhc0RhdGEpO1xuICAgIGNhbnZhc1ZpZXcuc2V0SW50MzIoMCwgdGV4dHVyZXMuc2l6ZS53aWR0aCwgdHJ1ZSk7XG4gICAgY2FudmFzVmlldy5zZXRJbnQzMig0LCB0ZXh0dXJlcy5zaXplLmhlaWdodCwgdHJ1ZSk7XG4gICAgY2FudmFzVmlldy5zZXRGbG9hdDMyKDgsIHRpbWUsIHRydWUpOyAvLyBXcml0ZSB0aW1lIGhlcmVcbiAgICAvLyBCeXRlcyAxMi0xNSBhcmUgcGFkZGluZ1xuICAgIGRldmljZS5xdWV1ZS53cml0ZUJ1ZmZlcihjYW52YXNCdWZmZXIsIDAsIGNhbnZhc0RhdGEpO1xuXG4gICAgLy8gV3JpdGUgY29udHJvbHMgd2l0aCBhZGp1c3RlZCBvZmZzZXRzOlxuICAgIGNvbnRyb2xzRGF0YVZpZXcuc2V0VWludDMyKDAsIHVuaWZvcm1zLm1lbWJyYW5lQ291bnQsIHRydWUpOyAvLyBvZmZzZXQgMDogbWVtYnJhbmVDb3VudFxuICAgIGNvbnRyb2xzRGF0YVZpZXcuc2V0VWludDMyKDQsIHVuaWZvcm1zLmFjdGluQ291bnQsIHRydWUpOyAvLyBvZmZzZXQgNDogYWN0aW5Db3VudFxuICAgIGNvbnRyb2xzRGF0YVZpZXcuc2V0RmxvYXQzMig4LCB1bmlmb3Jtcy5vbmx5QmluZFdoZW5BbmdsZSwgdHJ1ZSk7IC8vIG9mZnNldCA4OiBzZXBhcmF0ZVN0cmVuZ3RoXG4gICAgY29udHJvbHNEYXRhVmlldy5zZXRGbG9hdDMyKDEyLCB1bmlmb3Jtcy5mb29kTmVhcmJ5VGhyZXNob2xkLCB0cnVlKTsgLy8gb2Zmc2V0IDEyOiBjb2hlc2lvblN0cmVuZ3RoXG4gICAgY29udHJvbHNEYXRhVmlldy5zZXRGbG9hdDMyKDE2LCB1bmlmb3Jtcy51bmJpbmRQcm9iLCB0cnVlKTsgLy8gb2Zmc2V0IDE2OiBkaXJlY3Rpb25TdHJlbmd0aFxuICAgIGNvbnRyb2xzRGF0YVZpZXcuc2V0RmxvYXQzMigyMCwgdW5pZm9ybXMucG9seW1lclJlcHVsc2lvbiwgdHJ1ZSk7IC8vIG9mZnNldCAyMDogcG9seW1lclJlcHVsc2lvblxuICAgIGNvbnRyb2xzRGF0YVZpZXcuc2V0SW50MzIoMjQsIHVuaWZvcm1zLm1lbWJyYW5lQ29oZXNpb25SYW5nZSwgdHJ1ZSk7IC8vIG9mZnNldCAyNDogbWVtYnJhbmVDb2hlc2lvblJhbmdlXG4gICAgY29udHJvbHNEYXRhVmlldy5zZXRJbnQzMigyOCwgdW5pZm9ybXMuYWN0aW5Db2hlc2lvblJhbmdlLCB0cnVlKTsgLy8gb2Zmc2V0IDI4OiBhY3RpbkNvaGVzaW9uUmFuZ2VcbiAgICBjb250cm9sc0RhdGFWaWV3LnNldEZsb2F0MzIoMzIsIHVuaWZvcm1zLnN0YXJ0c051Y2xlYXRlZFByb2IsIHRydWUpOyAvLyBvZmZzZXQgMzI6IGFuZ2xlXG4gICAgY29udHJvbHNEYXRhVmlldy5zZXRGbG9hdDMyKDM2LCB1bmlmb3Jtcy5hY3RpblNlbnNvclJhbmRvbU9mZnNldCwgdHJ1ZSk7IC8vIG9mZnNldCAzNjogblNlbnNvcnNcbiAgICBjb250cm9sc0RhdGFWaWV3LnNldEZsb2F0MzIoNDAsIHVuaWZvcm1zLmFjdGluU3RlcmljRm9yY2UsIHRydWUpOyAvLyBvZmZzZXQgNDA6IHNwZWVkXG4gICAgY29udHJvbHNEYXRhVmlldy5zZXRGbG9hdDMyKDQ0LCB1bmlmb3Jtcy5tZW1icmFuZVRlbnNpb24sIHRydWUpOyAvLyBvZmZzZXQgNDQ6IHBoZXJvbW9uZURlcG9zYWxcbiAgICBjb250cm9sc0RhdGFWaWV3LnNldEZsb2F0MzIoNDgsIHVuaWZvcm1zLmZvb2RTcGF3bkFyZWEsIHRydWUpOyAvLyBvZmZzZXQgNDg6IHN0aWdtZXJneUJsdXJTdHJlbmd0aFxuXG4gICAgZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKGNvbnRyb2xzQnVmZmVyLCAwLCBjb250cm9sc0J1ZmZlckRhdGEpO1xuICB9O1xuXG4gIHdyaXRlVW5pZm9ybXMoKTtcblxuICBjb25zdCBtZW1icmFuZUJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgIHNpemU6IHNpemVzLnZlYzIgKiAyICogdW5pZm9ybXMubWVtYnJhbmVDb3VudCwgLy8gdmVjMiAqIDIgZm9yIHBvc2l0aW9uIGFuZCBkaXJlY3Rpb25cbiAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSxcbiAgfSk7XG4gIGNvbnN0IGFjdGluZXNCVWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICBzaXplOiAoc2l6ZXMuZjMyICsgc2l6ZXMudmVjMiAqIDMpICogdW5pZm9ybXMuYWN0aW5Db3VudCwgLy8gdmVjMiAqIDMgZm9yIHBvc2l0aW9uIGFuZCBkaXJlY3Rpb24sIG5laWdoYm9yc1xuICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFLFxuICB9KTtcblxuICAvLyBBZGQgdGhlIGNvbm5lY3Rpb24gbG9ja3MgYnVmZmVyXG4gIGNvbnN0IGFjdGluQ29ubmVjdGlvbkxvY2tzQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgbGFiZWw6IFwiQWN0aW4gQ29ubmVjdGlvbiBMb2NrcyBCdWZmZXJcIixcbiAgICBzaXplOiBzaXplcy5pMzIgKiB1bmlmb3Jtcy5hY3RpbkNvdW50LCAvLyBPbmUgYXRvbWljPGkzMj4gcGVyIGFjdGluXG4gICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0UsXG4gIH0pO1xuXG4gIGNvbnN0IGFnZW50c0xheW91dCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xuICAgIGxhYmVsOiBcImFnZW50c0xheW91dFwiLFxuICAgIGVudHJpZXM6IFtcbiAgICAgIHsgdmlzaWJpbGl0eSwgYmluZGluZzogMCwgYnVmZmVyOiB7IHR5cGU6IFwic3RvcmFnZVwiIH0gfSxcbiAgICAgIHsgdmlzaWJpbGl0eSwgYmluZGluZzogMSwgYnVmZmVyOiB7IHR5cGU6IFwic3RvcmFnZVwiIH0gfSxcbiAgICAgIHsgdmlzaWJpbGl0eSwgYmluZGluZzogMiwgYnVmZmVyOiB7IHR5cGU6IFwic3RvcmFnZVwiIH0gfSxcbiAgICBdLFxuICB9KTtcbiAgY29uc3QgYWdlbnRzQmluZEdyb3VwID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG4gICAgbGFiZWw6IFwiYWdlbnRzIGJpbmRncm91cFwiLFxuICAgIGxheW91dDogYWdlbnRzTGF5b3V0LFxuICAgIGVudHJpZXM6IFtcbiAgICAgIHsgYmluZGluZzogMCwgcmVzb3VyY2U6IHsgYnVmZmVyOiBtZW1icmFuZUJ1ZmZlciB9IH0sXG4gICAgICB7IGJpbmRpbmc6IDEsIHJlc291cmNlOiB7IGJ1ZmZlcjogYWN0aW5lc0JVZmZlciB9IH0sXG4gICAgICB7IGJpbmRpbmc6IDIsIHJlc291cmNlOiB7IGJ1ZmZlcjogYWN0aW5Db25uZWN0aW9uTG9ja3NCdWZmZXIgfSB9LFxuICAgIF0sXG4gIH0pO1xuXG4gIC8vLy8vXG4gIC8vIE92ZXJhbGwgbWVtb3J5IGxheW91dFxuICBjb25zdCBsYXlvdXQgPSBkZXZpY2UuY3JlYXRlUGlwZWxpbmVMYXlvdXQoe1xuICAgIGJpbmRHcm91cExheW91dHM6IFtzdG9yYWdlVGV4dHVyZXNMYXlvdXQsIHVuaWZvcm1zTGF5b3V0LCBhZ2VudHNMYXlvdXRdLFxuICB9KTtcblxuICAvLyBDcmVhdGUgYSBzZXBhcmF0ZSBsYXlvdXQgZm9yIHRoZSByZW5kZXIgcGlwZWxpbmVcbiAgY29uc3QgcmVuZGVyUGlwZWxpbmVMYXlvdXQgPSBkZXZpY2UuY3JlYXRlUGlwZWxpbmVMYXlvdXQoe1xuICAgIGxhYmVsOiBcIlJlbmRlciBQaXBlbGluZSBMYXlvdXRcIixcbiAgICBiaW5kR3JvdXBMYXlvdXRzOiBbc3RvcmFnZVRleHR1cmVzTGF5b3V0LCB1bmlmb3Jtc0xheW91dF0sXG4gIH0pO1xuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gU2V0IHVwIGNvZGUgaW5zdHJ1Y3Rpb25zXG4gIGNvbnN0IG1vZHVsZSA9IGF3YWl0IGNyZWF0ZVNoYWRlcihkZXZpY2UsIHNpbXVsYXRlQ29kZSk7XG5cbiAgY29uc3QgcmVzZXRBY3RpblBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG4gICAgbGF5b3V0LFxuICAgIGNvbXB1dGU6IHsgbW9kdWxlLCBlbnRyeVBvaW50OiBcInJlc2V0X2FjdGluXCIgfSxcbiAgfSk7XG4gIGNvbnN0IHJlc2V0TWVtYnJhbmVQaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuICAgIGxheW91dCxcbiAgICBjb21wdXRlOiB7IG1vZHVsZSwgZW50cnlQb2ludDogXCJyZXNldF9tZW1icmFuZVwiIH0sXG4gIH0pO1xuXG4gIGNvbnN0IG1lbWJyYW5lUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlQ29tcHV0ZVBpcGVsaW5lKHtcbiAgICBsYXlvdXQsXG4gICAgY29tcHV0ZTogeyBtb2R1bGUsIGVudHJ5UG9pbnQ6IFwidXBkYXRlX21lbWJyYW5lXCIgfSxcbiAgfSk7XG4gIGNvbnN0IGFjdGluQmluZFBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG4gICAgbGF5b3V0LFxuICAgIGNvbXB1dGU6IHsgbW9kdWxlLCBlbnRyeVBvaW50OiBcImJpbmRfYWN0aW5fbW9ub21lclwiIH0sXG4gIH0pO1xuICBjb25zdCBhY3RpblBvbHltZXJQb3NpdGlvblBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG4gICAgbGF5b3V0LFxuICAgIGNvbXB1dGU6IHsgbW9kdWxlLCBlbnRyeVBvaW50OiBcInVwZGF0ZV9hY3Rpbl9wb2x5bWVyX3Bvc2l0aW9uXCIgfSxcbiAgfSk7XG4gIGNvbnN0IGFjdGluTW9ub21lclBvc2l0aW9uUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlQ29tcHV0ZVBpcGVsaW5lKHtcbiAgICBsYXlvdXQsXG4gICAgY29tcHV0ZTogeyBtb2R1bGUsIGVudHJ5UG9pbnQ6IFwidXBkYXRlX2FjdGluX21vbm9tZXJfcG9zaXRpb25cIiB9LFxuICB9KTtcbiAgY29uc3QgdW5iaW5kTWluUG9sZVBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG4gICAgbGF5b3V0LFxuICAgIGNvbXB1dGU6IHsgbW9kdWxlLCBlbnRyeVBvaW50OiBcInVuYmluZF9taW51c19lbmRcIiB9LFxuICB9KTtcblxuICBjb25zdCBtZW1icmFuZVRvVGV4dHVyZXNQaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuICAgIGxheW91dCxcbiAgICBjb21wdXRlOiB7IG1vZHVsZSwgZW50cnlQb2ludDogXCJtZW1icmFuZV90b190ZXh0dXJlc1wiIH0sXG4gIH0pO1xuXG4gIGNvbnN0IGFjdGluZXNUb1RleHR1cmVzUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlQ29tcHV0ZVBpcGVsaW5lKHtcbiAgICBsYXlvdXQsXG4gICAgY29tcHV0ZTogeyBtb2R1bGUsIGVudHJ5UG9pbnQ6IFwiYWN0aW5lc190b190ZXh0dXJlc1wiIH0sXG4gIH0pO1xuXG4gIGNvbnN0IGNsZWFyVGV4dHVyZXNQaXBlbGluZSA9IGRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuICAgIGxheW91dCxcbiAgICBjb21wdXRlOiB7IG1vZHVsZSwgZW50cnlQb2ludDogXCJjbGVhcl90ZXh0dXJlc1wiIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHRleHR1cmVzUGlwZWxpbmUgPSBkZXZpY2UuY3JlYXRlQ29tcHV0ZVBpcGVsaW5lKHtcbiAgICBsYXlvdXQsXG4gICAgY29tcHV0ZTogeyBtb2R1bGUsIGVudHJ5UG9pbnQ6IFwidXBkYXRlX3RleHR1cmVzXCIgfSxcbiAgfSk7XG5cbiAgY29uc3QgY29uc29saWRhdGVUZXh0dXJlc1BpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG4gICAgbGF5b3V0LFxuICAgIGNvbXB1dGU6IHsgbW9kdWxlLCBlbnRyeVBvaW50OiBcImNvbnNvbGlkYXRlX3RleHR1cmVzXCIgfSxcbiAgfSk7XG5cbiAgLy8gVHJhZGl0aW9uYWwgcmVuZGVyIHBpcGVsaW5lIG9mIHZlcnQgLT4gZnJhZ1xuICBjb25zdCByZW5kZXJNb2R1bGUgPSBhd2FpdCBjcmVhdGVTaGFkZXIoZGV2aWNlLCByZW5kZXJDb2RlKTtcblxuICBjb25zdCByZW5kZXJQaXBlbGluZSA9IGRldmljZS5jcmVhdGVSZW5kZXJQaXBlbGluZSh7XG4gICAgbGFiZWw6IFwiUmVuZGVyIFBpcGVsaW5lXCIsXG4gICAgbGF5b3V0OiByZW5kZXJQaXBlbGluZUxheW91dCxcbiAgICB2ZXJ0ZXg6IHtcbiAgICAgIG1vZHVsZTogcmVuZGVyTW9kdWxlLFxuICAgICAgZW50cnlQb2ludDogXCJ2ZXJ0XCIsXG4gICAgfSxcbiAgICBmcmFnbWVudDoge1xuICAgICAgbW9kdWxlOiByZW5kZXJNb2R1bGUsXG4gICAgICBlbnRyeVBvaW50OiBcImZyYWdcIixcbiAgICAgIHRhcmdldHM6IFt7IGZvcm1hdDogY2FudmFzLmZvcm1hdCB9XSwgLy8gU3RhZ2UgMSByZW5kZXJzIHRvIGludGVybWVkaWF0ZSB0ZXh0dXJlXG4gICAgfSxcbiAgICBwcmltaXRpdmU6IHtcbiAgICAgIHRvcG9sb2d5OiBcInRyaWFuZ2xlLWxpc3RcIixcbiAgICB9LFxuICB9KTtcblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gIC8vIFJVTiB0aGUgcmVzZXQgc2hhZGVyIGZ1bmN0aW9uXG4gIGNvbnN0IHJlc2V0ID0gKCkgPT4ge1xuICAgIC8vIFVuaWZvcm1zIGFyZSBwb3RlbnRpYWxseSBjaGFuZ2VkIGJ5IEdVSSBiZWZvcmUgcmVzZXQsIHNvIHdyaXRlIHRoZW0uXG4gICAgd3JpdGVVbmlmb3JtcygpO1xuXG4gICAgY29uc3QgZW5jb2RlciA9IGRldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xuICAgIGNvbnN0IHBhc3MgPSBlbmNvZGVyLmJlZ2luQ29tcHV0ZVBhc3MoKTtcblxuICAgIHBhc3Muc2V0QmluZEdyb3VwKDAsIHN0b3JhZ2VUZXh0dXJlc0JpbmRHcm91cCk7XG4gICAgcGFzcy5zZXRCaW5kR3JvdXAoMSwgdW5pZm9ybXNCaW5kR3JvdXApO1xuICAgIHBhc3Muc2V0QmluZEdyb3VwKDIsIGFnZW50c0JpbmRHcm91cCk7XG5cbiAgICBwYXNzLnNldFBpcGVsaW5lKHJlc2V0QWN0aW5QaXBlbGluZSk7XG4gICAgcGFzcy5kaXNwYXRjaFdvcmtncm91cHMoQlVGRkVSX1dPUktHUk9VUF9DT1VOVF9BQ1RJTik7XG5cbiAgICBwYXNzLnNldFBpcGVsaW5lKHJlc2V0TWVtYnJhbmVQaXBlbGluZSk7XG4gICAgcGFzcy5kaXNwYXRjaFdvcmtncm91cHMoQlVGRkVSX1dPUktHUk9VUF9DT1VOVF9NRU1CUkFORSk7XG5cbiAgICBwYXNzLmVuZCgpO1xuICAgIGRldmljZS5xdWV1ZS5zdWJtaXQoW2VuY29kZXIuZmluaXNoKCldKTtcbiAgfTtcbiAgcmVzZXQoKTtcblxuICB2YXIgYXZnVGltZSA9IDA7XG4gIGNvbnN0IGZyYW1lc1BlclRpbWVMb2cgPSAzMDtcbiAgY29uc3QgZ3B1VGltZURpc3BsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdwdVRpbWVcIikhO1xuICBjb25zdCBmcHNEaXNwbGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcHNDb3VudGVyXCIpITtcbiAgbGV0IGxhc3RUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gIGxldCBmcmFtZUNvdW50ID0gMDtcbiAgbGV0IHRvdGFsR3B1VGltZSA9IDA7XG4gIGxldCBtZWFzdXJlbWVudENvdW50ID0gMDtcblxuICAvLyBSVU4gdGhlIHNpbSBjb21wdXRlIGZ1bmN0aW9uIGFuZCByZW5kZXIgcGl4ZWxzXG4gIGZ1bmN0aW9uIHRpbWVzdGVwKCkge1xuICAgIHRpbWUrKztcbiAgICBkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoY2FudmFzQnVmZmVyLCA4LCBuZXcgRmxvYXQzMkFycmF5KFt0aW1lXSkuYnVmZmVyKTtcbiAgICBkZXZpY2UucXVldWUud3JpdGVCdWZmZXIoaW50ZXJhY3Rpb25zLmJ1ZmZlciwgMCwgaW50ZXJhY3Rpb25zLmRhdGEpO1xuXG4gICAgY29uc3QgZW5jb2RlciA9IGRldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xuICAgIGNvbnN0IHBhc3MgPSBlbmNvZGVyLmJlZ2luQ29tcHV0ZVBhc3Moe1xuICAgICAgLi4uKHF1ZXJ5U2V0ICYmIHtcbiAgICAgICAgdGltZXN0YW1wV3JpdGVzOiB7XG4gICAgICAgICAgcXVlcnlTZXQsXG4gICAgICAgICAgYmVnaW5uaW5nT2ZQYXNzV3JpdGVJbmRleDogMCxcbiAgICAgICAgICBlbmRPZlBhc3NXcml0ZUluZGV4OiAxLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICBwYXNzLnNldEJpbmRHcm91cCgwLCBzdG9yYWdlVGV4dHVyZXNCaW5kR3JvdXApO1xuICAgIHBhc3Muc2V0QmluZEdyb3VwKDEsIHVuaWZvcm1zQmluZEdyb3VwKTtcbiAgICBwYXNzLnNldEJpbmRHcm91cCgyLCBhZ2VudHNCaW5kR3JvdXApO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmlmb3Jtcy5jb21wdXRlU3RlcHNQZXJGcmFtZTsgaSsrKSB7XG4gICAgICBwYXNzLnNldFBpcGVsaW5lKGNsZWFyVGV4dHVyZXNQaXBlbGluZSk7XG4gICAgICBwYXNzLmRpc3BhdGNoV29ya2dyb3VwcyguLi5URVhUVVJFX1dPUktHUk9VUF9DT1VOVCk7XG5cbiAgICAgIHBhc3Muc2V0UGlwZWxpbmUobWVtYnJhbmVQaXBlbGluZSk7XG4gICAgICBwYXNzLmRpc3BhdGNoV29ya2dyb3VwcyhCVUZGRVJfV09SS0dST1VQX0NPVU5UX01FTUJSQU5FKTtcblxuICAgICAgcGFzcy5zZXRQaXBlbGluZShhY3RpbkJpbmRQaXBlbGluZSk7XG4gICAgICBwYXNzLmRpc3BhdGNoV29ya2dyb3VwcyhCVUZGRVJfV09SS0dST1VQX0NPVU5UX0FDVElOKTtcblxuICAgICAgcGFzcy5zZXRQaXBlbGluZShhY3RpblBvbHltZXJQb3NpdGlvblBpcGVsaW5lKTtcbiAgICAgIHBhc3MuZGlzcGF0Y2hXb3JrZ3JvdXBzKEJVRkZFUl9XT1JLR1JPVVBfQ09VTlRfQUNUSU4pO1xuXG4gICAgICBwYXNzLnNldFBpcGVsaW5lKGFjdGluTW9ub21lclBvc2l0aW9uUGlwZWxpbmUpO1xuICAgICAgcGFzcy5kaXNwYXRjaFdvcmtncm91cHMoQlVGRkVSX1dPUktHUk9VUF9DT1VOVF9BQ1RJTik7XG5cbiAgICAgIHBhc3Muc2V0UGlwZWxpbmUodW5iaW5kTWluUG9sZVBpcGVsaW5lKTtcbiAgICAgIHBhc3MuZGlzcGF0Y2hXb3JrZ3JvdXBzKEJVRkZFUl9XT1JLR1JPVVBfQ09VTlRfQUNUSU4pO1xuXG4gICAgICBwYXNzLnNldFBpcGVsaW5lKG1lbWJyYW5lVG9UZXh0dXJlc1BpcGVsaW5lKTtcbiAgICAgIHBhc3MuZGlzcGF0Y2hXb3JrZ3JvdXBzKEJVRkZFUl9XT1JLR1JPVVBfQ09VTlRfTUVNQlJBTkUpO1xuXG4gICAgICBwYXNzLnNldFBpcGVsaW5lKGFjdGluZXNUb1RleHR1cmVzUGlwZWxpbmUpO1xuICAgICAgcGFzcy5kaXNwYXRjaFdvcmtncm91cHMoQlVGRkVSX1dPUktHUk9VUF9DT1VOVF9BQ1RJTik7XG5cbiAgICAgIHBhc3Muc2V0UGlwZWxpbmUodGV4dHVyZXNQaXBlbGluZSk7XG4gICAgICBwYXNzLmRpc3BhdGNoV29ya2dyb3VwcyguLi5URVhUVVJFX1dPUktHUk9VUF9DT1VOVCk7XG5cbiAgICAgIC8vIHBhc3Muc2V0UGlwZWxpbmUoY29uc29saWRhdGVUZXh0dXJlc1BpcGVsaW5lKTtcbiAgICAgIC8vIHBhc3MuZGlzcGF0Y2hXb3JrZ3JvdXBzKC4uLlRFWFRVUkVfV09SS0dST1VQX0NPVU5UKTtcbiAgICB9XG4gICAgcGFzcy5lbmQoKTtcblxuICAgIGVuY29kZXIucmVzb2x2ZVF1ZXJ5U2V0KHF1ZXJ5U2V0LCAwLCBxdWVyeVNldC5jb3VudCwgcmVzb2x2ZUJ1ZmZlciwgMCk7XG4gICAgaWYgKHJlc3VsdEJ1ZmZlci5tYXBTdGF0ZSA9PT0gXCJ1bm1hcHBlZFwiKSB7XG4gICAgICBlbmNvZGVyLmNvcHlCdWZmZXJUb0J1ZmZlcihyZXNvbHZlQnVmZmVyLCAwLCByZXN1bHRCdWZmZXIsIDAsIHJlc3VsdEJ1ZmZlci5zaXplKTtcbiAgICB9XG5cbiAgICAvLyBGaW5hbGx5LCBydW4gdGhlIHJlbmRlciBwYXNzXG4gICAgY29uc3QgcmVuZGVyUGFzcyA9IGVuY29kZXIuYmVnaW5SZW5kZXJQYXNzKHtcbiAgICAgIGNvbG9yQXR0YWNobWVudHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHZpZXc6IGNhbnZhcy5jb250ZXh0LmdldEN1cnJlbnRUZXh0dXJlKCkuY3JlYXRlVmlldygpLFxuICAgICAgICAgIGxvYWRPcDogXCJsb2FkXCIsIC8vIExvYWQgZXhpc3RpbmcgY29udGVudCBmcm9tIHN0YWdlIDFcbiAgICAgICAgICBzdG9yZU9wOiBcInN0b3JlXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICAgIHJlbmRlclBhc3Muc2V0UGlwZWxpbmUocmVuZGVyUGlwZWxpbmUpO1xuXG4gICAgcmVuZGVyUGFzcy5zZXRCaW5kR3JvdXAoMCwgc3RvcmFnZVRleHR1cmVzQmluZEdyb3VwKTtcbiAgICByZW5kZXJQYXNzLnNldEJpbmRHcm91cCgxLCB1bmlmb3Jtc0JpbmRHcm91cCk7XG5cbiAgICByZW5kZXJQYXNzLmRyYXcoNiwgMSwgMCwgMCk7XG4gICAgcmVuZGVyUGFzcy5lbmQoKTtcbiAgICBkZXZpY2UucXVldWUuc3VibWl0KFtlbmNvZGVyLmZpbmlzaCgpXSk7XG5cbiAgICAvLyBUSU1FIEJFTkNITUFSS0lOR1xuICAgIGlmIChyZXN1bHRCdWZmZXIubWFwU3RhdGUgPT09IFwidW5tYXBwZWRcIikge1xuICAgICAgcmVzdWx0QnVmZmVyLm1hcEFzeW5jKEdQVU1hcE1vZGUuUkVBRCkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHRpbWVzID0gbmV3IEJpZ0ludDY0QXJyYXkocmVzdWx0QnVmZmVyLmdldE1hcHBlZFJhbmdlKCkpO1xuICAgICAgICBjb25zdCBncHVUaW1lID0gTnVtYmVyKHRpbWVzWzFdIC0gdGltZXNbMF0pIC8gMV8wMDBfMDAwO1xuICAgICAgICB0b3RhbEdwdVRpbWUgKz0gZ3B1VGltZTtcbiAgICAgICAgbWVhc3VyZW1lbnRDb3VudCsrO1xuICAgICAgICByZXN1bHRCdWZmZXIudW5tYXAoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEdQVSBwZXJmb3JtYW5jZSBzZWN0aW9uXG4gICAgaWYgKHRpbWUgJSBmcmFtZXNQZXJUaW1lTG9nID09IDApIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICBjb25zdCB0aW1lRWxhcHNlZCA9IGN1cnJlbnRUaW1lIC0gbGFzdFRpbWU7XG5cbiAgICAgIC8vIEdQVSBUaW1pbmcgLSBvbmx5IHVwZGF0ZSBpZiB3ZSBoYXZlIG1lYXN1cmVtZW50c1xuICAgICAgaWYgKG1lYXN1cmVtZW50Q291bnQgPiAwKSB7XG4gICAgICAgIGNvbnN0IGF2Z0dwdVRpbWUgPSAodG90YWxHcHVUaW1lIC8gbWVhc3VyZW1lbnRDb3VudCkudG9GaXhlZCgzKTtcbiAgICAgICAgZ3B1VGltZURpc3BsYXkudGV4dENvbnRlbnQgPSBgR1BVIFRpbWU6ICR7YXZnR3B1VGltZX0gbXNgO1xuICAgICAgICAvLyBSZXNldCBHUFUgdGltaW5nIGFjY3VtdWxhdG9yc1xuICAgICAgICB0b3RhbEdwdVRpbWUgPSAwO1xuICAgICAgICBtZWFzdXJlbWVudENvdW50ID0gMDtcbiAgICAgIH1cblxuICAgICAgLy8gRlBTIENhbGN1bGF0aW9uXG4gICAgICBjb25zdCBmcHMgPSBNYXRoLnJvdW5kKChmcmFtZUNvdW50ICogMTAwMCkgLyB0aW1lRWxhcHNlZCk7XG4gICAgICBmcHNEaXNwbGF5LnRleHRDb250ZW50ID0gYEZQUzogJHtmcHN9YDtcblxuICAgICAgLy8gUmVzZXQgY291bnRlcnNcbiAgICAgIGZyYW1lQ291bnQgPSAwO1xuICAgICAgbGFzdFRpbWUgPSBjdXJyZW50VGltZTtcbiAgICB9XG5cbiAgICAvLyBJbmNyZW1lbnQgZnJhbWUgY291bnRlclxuICAgIGZyYW1lQ291bnQrKztcbiAgfVxuXG4gIGxldCBndWkgPSBuZXcgR1VJKCk7XG5cbiAgZ3VpLmFkZCh1bmlmb3JtcywgXCJjb21wdXRlU3RlcHNQZXJGcmFtZVwiKS5taW4oMSkubWF4KDc1KS5zdGVwKDEpLm5hbWUoXCJDb21wdXRlIFN0ZXBzXCIpO1xuICBndWkuYWRkKHVuaWZvcm1zLCBcInRhcmdldEZQU1wiKS5taW4oMSkubWF4KDEyMCkuc3RlcCgxKS5uYW1lKFwiVGFyZ2V0IEZQU1wiKTtcbiAgZ3VpLmFkZCh1bmlmb3JtcywgXCJvbmx5QmluZFdoZW5BbmdsZVwiKS5taW4oMC4wMDAwMDAwMDEpLm1heCg0LjApLm5hbWUoXCJPbmx5IEJpbmQgV2hlbiBBbmdsZVwiKTtcbiAgZ3VpLmFkZCh1bmlmb3JtcywgXCJmb29kTmVhcmJ5VGhyZXNob2xkXCIpLm1pbigwLjAwMDAwMDEpLm1heCgxLjApLm5hbWUoXCJGb29kIE5lYXJieSBUaHJlc2hvbGRcIik7XG4gIGd1aS5hZGQodW5pZm9ybXMsIFwidW5iaW5kUHJvYlwiKS5taW4oMCkubWF4KDAuOTk5KS5uYW1lKFwidW5iaW5kIHByb2JhYmlsaXR5XCIpO1xuICBndWkuYWRkKHVuaWZvcm1zLCBcIm1lbWJyYW5lQ29oZXNpb25SYW5nZVwiKS5taW4oMSkubWF4KDUwKS5zdGVwKDEpLm5hbWUoXCJNZW1icmFuZSBDb2hlc2lvbiBSYW5nZVwiKTtcbiAgZ3VpLmFkZCh1bmlmb3JtcywgXCJhY3RpbkNvaGVzaW9uUmFuZ2VcIikubWluKDEpLm1heCgxMDApLnN0ZXAoMSkubmFtZShcIkFjdGluIENvaGVzaW9uIFJhbmdlXCIpO1xuICBndWkuYWRkKHVuaWZvcm1zLCBcInN0YXJ0c051Y2xlYXRlZFByb2JcIikubWluKDAuMCkubWF4KDAuMSkuc3RlcCgwLjAwMSkubmFtZShcIkFjdGluIHN0YXJ0cyBhcyBwb2x5bWVyXCIpO1xuICBndWkuYWRkKHVuaWZvcm1zLCBcImFjdGluU3RlcmljRm9yY2VcIikubWluKDAuMCkubWF4KDEuMCkubmFtZShcIkFjdGluIFN0ZXJpYyBGb3JjZVwiKTtcbiAgZ3VpLmFkZCh1bmlmb3JtcywgXCJtZW1icmFuZVRlbnNpb25cIikubWluKDAuMykubWF4KDMwLjApLm5hbWUoXCJNZW1icmFuZSBUZW5zaW9uXCIpO1xuICBndWkuYWRkKHVuaWZvcm1zLCBcImZvb2RTcGF3bkFyZWFcIikubWluKDAuMCkubWF4KDEuMCkubmFtZShcIkZvb2QgU3Bhd24gQXJlYVwiKTtcbiAgZ3VpLmFkZCh1bmlmb3JtcywgXCJwb2x5bWVyUmVwdWxzaW9uXCIpLm1pbigwLjApLm1heCgxLjApLm5hbWUoXCJQb2x5bWVyIFJlcHVsc2lvblwiKTtcbiAgZ3VpLmFkZCh1bmlmb3JtcywgXCJhY3RpblNlbnNvclJhbmRvbU9mZnNldFwiKS5taW4oMC4wKS5tYXgoMS4wKS5uYW1lKFwiQWN0aW4gU2Vuc29yIFJhbmRvbSBPZmZzZXRcIik7XG4gIGd1aS5hZGQoeyBleGVjdXRlRnVuY3Rpb246IHJlc2V0IH0sIFwiZXhlY3V0ZUZ1bmN0aW9uXCIpLm5hbWUoXCJSZXNldCBTaW11bGF0aW9uXCIpO1xuICBndWkub25DaGFuZ2Uod3JpdGVVbmlmb3Jtcyk7IC8vIFdyaXRlIGFsbCB1bmlmb3JtcyB0byBidWZmZXIgb24gYW55IEdVSSBjaGFuZ2VcbiAgZ3VpLmNsb3NlKCk7XG5cbiAgbGV0IGxhc3RGcmFtZVRpbWUgPSAwO1xuICBjb25zdCBnZXRGcmFtZUludGVydmFsID0gKCkgPT4gMTAwMCAvIHVuaWZvcm1zLnRhcmdldEZQUzsgLy8gQ29udmVydCBGUFMgdG8gbWlsbGlzZWNvbmRzXG5cbiAgZnVuY3Rpb24gZnJhbWUoY3VycmVudFRpbWU6IG51bWJlcikge1xuICAgIC8vIENoZWNrIGlmIGVub3VnaCB0aW1lIGhhcyBwYXNzZWQgYmFzZWQgb24gdGFyZ2V0IEZQU1xuICAgIGlmIChjdXJyZW50VGltZSAtIGxhc3RGcmFtZVRpbWUgPj0gZ2V0RnJhbWVJbnRlcnZhbCgpKSB7XG4gICAgICB0aW1lc3RlcCgpO1xuICAgICAgbGFzdEZyYW1lVGltZSA9IGN1cnJlbnRUaW1lO1xuICAgIH1cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuICB9XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZSk7XG4gIHJldHVybjtcbn1cblxuaW5kZXgoKTtcbiIsImZ1bmN0aW9uIHRocm93RGV0ZWN0aW9uRXJyb3IoZXJyb3I6IHN0cmluZyk6IG5ldmVyIHtcbiAgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIud2ViZ3B1LW5vdC1zdXBwb3J0ZWRcIikgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcbiAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGluaXRpYWxpemUgV2ViR1BVOiBcIiArIGVycm9yKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcXVlc3REZXZpY2UoXG4gIG9wdGlvbnM6IEdQVVJlcXVlc3RBZGFwdGVyT3B0aW9ucyA9IHtcbiAgICBwb3dlclByZWZlcmVuY2U6IFwiaGlnaC1wZXJmb3JtYW5jZVwiLFxuICB9LFxuICByZXF1aXJlZEZlYXR1cmVzOiBHUFVGZWF0dXJlTmFtZVtdID0gW10sXG4gIHJlcXVpcmVkTGltaXRzOiBSZWNvcmQ8c3RyaW5nLCB1bmRlZmluZWQgfCBudW1iZXI+ID0ge1xuICAgIG1heFN0b3JhZ2VUZXh0dXJlc1BlclNoYWRlclN0YWdlOiA4LFxuICB9XG4pOiBQcm9taXNlPEdQVURldmljZT4ge1xuICBpZiAoIW5hdmlnYXRvci5ncHUpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJXZWJHUFUgTk9UIFN1cHBvcnRlZFwiKTtcblxuICBjb25zdCBhZGFwdGVyID0gYXdhaXQgbmF2aWdhdG9yLmdwdS5yZXF1ZXN0QWRhcHRlcihvcHRpb25zKTtcbiAgaWYgKCFhZGFwdGVyKSB0aHJvd0RldGVjdGlvbkVycm9yKFwiTm8gR1BVIGFkYXB0ZXIgZm91bmRcIik7XG5cbiAgY29uc3QgY2FuVGltZXN0YW1wID0gYWRhcHRlci5mZWF0dXJlcy5oYXMoXCJ0aW1lc3RhbXAtcXVlcnlcIik7XG4gIGNvbnN0IGZlYXR1cmVzID0gWy4uLnJlcXVpcmVkRmVhdHVyZXNdO1xuXG4gIGlmIChjYW5UaW1lc3RhbXApIHtcbiAgICBmZWF0dXJlcy5wdXNoKFwidGltZXN0YW1wLXF1ZXJ5XCIpO1xuICB9XG5cbiAgcmV0dXJuIGFkYXB0ZXIucmVxdWVzdERldmljZSh7XG4gICAgcmVxdWlyZWRGZWF0dXJlczogZmVhdHVyZXMsXG4gICAgcmVxdWlyZWRMaW1pdHM6IHJlcXVpcmVkTGltaXRzLFxuICAgIC4uLihjYW5UaW1lc3RhbXAgPyBbXCJ0aW1lc3RhbXAtcXVlcnlcIl0gOiBbXSksXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlQ2FudmFzKFxuICBkZXZpY2U6IEdQVURldmljZSxcbiAgc2l6ZSA9IHsgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLCBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCB9XG4pOiB7XG4gIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gIGNvbnRleHQ6IEdQVUNhbnZhc0NvbnRleHQ7XG4gIGZvcm1hdDogR1BVVGV4dHVyZUZvcm1hdDtcbiAgc2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufSB7XG4gIC8vIG1ha2Ugc3VyZSB0aGUgY2FudmFzIGlzIHNxdWFyZSBmb3Igbm93XG4gIC8vIFRPRE86IHNxdWFyZSBmb3Igbm93LiBzdXBwb3J0IGFzc3ltZXRyaWMgY2FudmFzZXMgbGF0ZXJcbiAgY29uc3QgbWluU2l6ZSA9IE1hdGgubWluKHNpemUud2lkdGgsIHNpemUuaGVpZ2h0KTtcbiAgc2l6ZS53aWR0aCA9IG1pblNpemU7XG4gIHNpemUuaGVpZ2h0ID0gbWluU2l6ZTtcblxuICBjb25zdCBjYW52YXMgPSBPYmplY3QuYXNzaWduKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIiksIHNpemUpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cbiAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ3B1XCIpO1xuICBpZiAoIWNvbnRleHQpIHRocm93RGV0ZWN0aW9uRXJyb3IoXCJDYW52YXMgZG9lcyBub3Qgc3VwcG9ydCBXZWJHUFVcIik7XG5cbiAgY29uc3QgZm9ybWF0ID0gbmF2aWdhdG9yLmdwdS5nZXRQcmVmZXJyZWRDYW52YXNGb3JtYXQoKTtcbiAgY29udGV4dC5jb25maWd1cmUoe1xuICAgIGRldmljZTogZGV2aWNlLFxuICAgIGZvcm1hdDogZm9ybWF0LFxuICAgIHVzYWdlOiBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQsXG4gICAgYWxwaGFNb2RlOiBcInByZW11bHRpcGxpZWRcIixcbiAgfSk7XG5cbiAgcmV0dXJuIHsgY2FudmFzOiBjYW52YXMsIGNvbnRleHQ6IGNvbnRleHQsIGZvcm1hdDogZm9ybWF0LCBzaXplOiBzaXplIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVTaGFkZXIoZGV2aWNlOiBHUFVEZXZpY2UsIGNvZGU6IHN0cmluZyk6IFByb21pc2U8R1BVU2hhZGVyTW9kdWxlPiB7XG4gIGNvbnN0IG1vZHVsZSA9IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoeyBjb2RlIH0pO1xuICBjb25zdCBpbmZvID0gYXdhaXQgbW9kdWxlLmdldENvbXBpbGF0aW9uSW5mbygpO1xuICBpZiAoaW5mby5tZXNzYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgZm9yIChsZXQgbWVzc2FnZSBvZiBpbmZvLm1lc3NhZ2VzKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCR7bWVzc2FnZS5tZXNzYWdlfSBcbiAgYXQgbGluZSAke21lc3NhZ2UubGluZU51bX1gKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgY29tcGlsZSBzaGFkZXJgKTtcbiAgfVxuICByZXR1cm4gbW9kdWxlO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlUGVyZm9ybWFuY2VRdWVyaWVzKGRldmljZTogR1BVRGV2aWNlKTogUHJvbWlzZTx7XG4gIHF1ZXJ5U2V0OiBHUFVRdWVyeVNldDtcbiAgcmVzb2x2ZUJ1ZmZlcjogR1BVQnVmZmVyO1xuICByZXN1bHRCdWZmZXI6IEdQVUJ1ZmZlcjtcbn0+IHtcbiAgY29uc3QgY2FuVGltZXN0YW1wID0gZGV2aWNlLmZlYXR1cmVzLmhhcyhcInRpbWVzdGFtcC1xdWVyeVwiKTtcbiAgLy8gaWYgKCFjYW5UaW1lc3RhbXApIHtcbiAgLy8gICBjb25zb2xlLndhcm4oXCJUaW1lc3RhbXAgcXVlcmllcyBhcmUgbm90IHN1cHBvcnRlZCBieSB0aGlzIGRldmljZS5cIik7XG4gIC8vICAgcmV0dXJuIHt9O1xuICAvLyB9XG4gIGNvbnN0IHF1ZXJ5U2V0ID0gZGV2aWNlLmNyZWF0ZVF1ZXJ5U2V0KHtcbiAgICB0eXBlOiBcInRpbWVzdGFtcFwiLFxuICAgIGNvdW50OiAyLFxuICB9KTtcblxuICBjb25zdCByZXNvbHZlQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgc2l6ZTogcXVlcnlTZXQuY291bnQgKiA4LFxuICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5RVUVSWV9SRVNPTFZFIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9TUkMsXG4gIH0pO1xuXG4gIGNvbnN0IHJlc3VsdEJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgIHNpemU6IHJlc29sdmVCdWZmZXIuc2l6ZSxcbiAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QgfCBHUFVCdWZmZXJVc2FnZS5NQVBfUkVBRCxcbiAgfSk7XG5cbiAgcmV0dXJuIHsgcXVlcnlTZXQsIHJlc29sdmVCdWZmZXIsIHJlc3VsdEJ1ZmZlciB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBJbnRlcmFjdGlvbnMoXG4gIGRldmljZTogR1BVRGV2aWNlLFxuICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50IHwgT2Zmc2NyZWVuQ2FudmFzLFxuICB0ZXh0dXJlOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0sXG4gIHNpemU6IG51bWJlciA9IDEwXG4pOiB7XG4gIGJ1ZmZlcjogR1BVQnVmZmVyO1xuICBkYXRhOiBCdWZmZXJTb3VyY2UgfCBTaGFyZWRBcnJheUJ1ZmZlcjtcbiAgdHlwZTogR1BVQnVmZmVyQmluZGluZ1R5cGU7XG59IHtcbiAgbGV0IGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICB2YXIgc2lnbiA9IDE7XG5cbiAgbGV0IHBvc2l0aW9uID0geyB4OiAwLCB5OiAwIH07XG4gIGxldCB2ZWxvY2l0eSA9IHsgeDogMCwgeTogMCB9O1xuXG4gIGRhdGEuc2V0KFtwb3NpdGlvbi54LCBwb3NpdGlvbi55XSk7XG4gIGlmIChjYW52YXMgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkge1xuICAgIC8vIGRpc2FibGUgY29udGV4dCBtZW51XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSk7XG5cbiAgICAvLyBtb3ZlIGV2ZW50c1xuICAgIFtcIm1vdXNlbW92ZVwiLCBcInRvdWNobW92ZVwiXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgdHlwZSxcbiAgICAgICAgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICAgICAgICBjYXNlIGV2ZW50IGluc3RhbmNlb2YgTW91c2VFdmVudDpcbiAgICAgICAgICAgICAgcG9zaXRpb24ueCA9IGV2ZW50Lm9mZnNldFg7XG4gICAgICAgICAgICAgIHBvc2l0aW9uLnkgPSBldmVudC5vZmZzZXRZO1xuICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ6XG4gICAgICAgICAgICAgIHBvc2l0aW9uLnggPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICAgICAgICAgIHBvc2l0aW9uLnkgPSBldmVudC50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCB4ID0gTWF0aC5mbG9vcigocG9zaXRpb24ueCAvIGNhbnZhcy53aWR0aCkgKiB0ZXh0dXJlLndpZHRoKTtcbiAgICAgICAgICBsZXQgeSA9IE1hdGguZmxvb3IoKHBvc2l0aW9uLnkgLyBjYW52YXMuaGVpZ2h0KSAqIHRleHR1cmUuaGVpZ2h0KTtcblxuICAgICAgICAgIGRhdGEuc2V0KFt4LCB5XSk7XG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFzc2l2ZTogdHJ1ZSB9XG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgLy8gem9vbSBldmVudHMgVE9ETyhAZ3N6ZXApIGFkZCBwaW5jaCBhbmQgc2Nyb2xsIGZvciB0b3VjaCBkZXZpY2VzXG4gICAgW1wid2hlZWxcIl0uZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIHR5cGUsXG4gICAgICAgIChldmVudCkgPT4ge1xuICAgICAgICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgICAgICAgY2FzZSBldmVudCBpbnN0YW5jZW9mIFdoZWVsRXZlbnQ6XG4gICAgICAgICAgICAgIHZlbG9jaXR5LnggPSBldmVudC5kZWx0YVk7XG4gICAgICAgICAgICAgIHZlbG9jaXR5LnkgPSBldmVudC5kZWx0YVk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNpemUgKz0gdmVsb2NpdHkueTtcbiAgICAgICAgICBkYXRhLnNldChbc2l6ZV0sIDIpO1xuICAgICAgICB9LFxuICAgICAgICB7IHBhc3NpdmU6IHRydWUgfVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIC8vIGNsaWNrIGV2ZW50cyBUT0RPKEBnc3plcCkgaW1wbGVtZW50IHJpZ2h0IGNsaWNrIGVxdWl2YWxlbnQgZm9yIHRvdWNoIGRldmljZXNcbiAgICBbXCJtb3VzZWRvd25cIiwgXCJ0b3VjaHN0YXJ0XCJdLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICB0eXBlLFxuICAgICAgICAoZXZlbnQpID0+IHtcbiAgICAgICAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgICAgICAgIGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBNb3VzZUV2ZW50OlxuICAgICAgICAgICAgICBzaWduID0gMSAtIGV2ZW50LmJ1dHRvbjtcbiAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgZXZlbnQgaW5zdGFuY2VvZiBUb3VjaEV2ZW50OlxuICAgICAgICAgICAgICBzaWduID0gZXZlbnQudG91Y2hlcy5sZW5ndGggPiAxID8gLTEgOiAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkYXRhLnNldChbc2lnbiAqIHNpemVdLCAyKTtcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXNzaXZlOiB0cnVlIH1cbiAgICAgICk7XG4gICAgfSk7XG4gICAgW1wibW91c2V1cFwiLCBcInRvdWNoZW5kXCJdLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICB0eXBlLFxuICAgICAgICAoZXZlbnQpID0+IHtcbiAgICAgICAgICBkYXRhLnNldChbTmFOXSwgMik7XG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFzc2l2ZTogdHJ1ZSB9XG4gICAgICApO1xuICAgIH0pO1xuICB9XG4gIGNvbnN0IHVuaWZvcm1CdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICBsYWJlbDogXCJJbnRlcmFjdGlvbiBCdWZmZXJcIixcbiAgICBzaXplOiBkYXRhLmJ5dGVMZW5ndGgsXG4gICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCxcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBidWZmZXI6IHVuaWZvcm1CdWZmZXIsXG4gICAgZGF0YTogZGF0YSxcbiAgICB0eXBlOiBcInVuaWZvcm1cIixcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==