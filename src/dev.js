/**
 * @module main
 *
 * @desc
 * Entry point
 */
import './css/main.css';
import './css/combobox.scss';
import { offices, offices2 } from './js/offices';
import ComboBox from './js/ComboBox';

new ComboBox( 'pickup-input', { items: offices, onSelect: sync } );

const dropoff = new ComboBox( 'dropoff-input', { items: offices } );

function sync( li ) {
  dropoff.select( li );
}

new ComboBox( 'green-location', { items: offices2, onFilter: filter, highlight_color: '#ffc' } );

function filter( item ) {
  const { electric_cars } = item;
  return ( electric_cars ) ? true : false;
}

new ComboBox( 'itcities', { endpoint: 'http://localhost/www/www.parkandfly.com/www/api/?method=getitcities&q=', onFetch: returnItems } );

function returnItems( json ) {
  let itcities = [];
  if( json.Status === '00' && json.Itcities ) {
    itcities = json.Itcities.map( item => {
      return { id: item.CC, name: item.CityName, descr: item.Descr }
    } );
  }

  return itcities;
}