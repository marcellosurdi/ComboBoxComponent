/**
 * @module main
 *
 * @desc
 * Entry point
 */
import './main.css';
import './combobox.scss';
import { offices } from './offices';
import ComboBox from './ComboBox';

new ComboBox( document.querySelector( 'input#pickup-input' ), offices, { onSelect: sync } );

const dropoff = new ComboBox( document.querySelector( 'input#dropoff-input' ), offices );

function sync( li ) {
  dropoff.select( li );
}

new ComboBox( document.querySelector( 'input#green-location' ), offices, { onFilter: filter, hbg: '#ffc' } );

function filter( item ) {
  const { electric_cars } = item;
  return ( electric_cars ) ? true : false;
}

new ComboBox( document.querySelector( 'input#itcities' ), [], { endpoint: 'http://localhost' } );