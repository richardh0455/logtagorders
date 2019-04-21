import React from 'react';
import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import OrderItem from '../pages/createOrder/OrderItem';


describe('First React component test with Enzyme', () => {
   it('renders without crashing', () => {
      var item = {key:"1",variant:"",variant_id:"",quantity:"",price:""}
      shallow(<OrderItem item={item} />);
    });
});
