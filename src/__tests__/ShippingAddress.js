import React from 'react';
import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import ShippingAddress from '../pages/ShippingAddress';


describe('First React component test with Enzyme', () => {
   it('renders without crashing', () => {
      var shippingAddress = {ShippingAddress:"Test Address 1, City, Country"}
      shallow(<ShippingAddress address= {shippingAddress}/>);
    });
});
