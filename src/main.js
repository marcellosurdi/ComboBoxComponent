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

new ComboBox( document.querySelector( 'input#itcities' ), [], { api: { endpoint: 'http://localhost/www/www.parkandfly.com/www/api/?method=getitcities&q=', callback: returnItems } } );

function returnItems( json ) {
  let itcities = [];
  if( json.Status === '00' && json.Itcities ) {
    itcities = json.Itcities.map( item => {
      return { id: item.CC, name: item.CityName, descr: item.Descr }
    } );
  }

  console.log(itcities);
  return itcities;
}