import React from 'react';
import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import OrderList from '../pages/createOrder/OrderList';


describe('First React component test with Enzyme', () => {
   it('renders without crashing', () => {
      shallow(<OrderList />);
    });
});
