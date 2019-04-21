import React from 'react';
import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import ViewOrders from '../pages/ViewOrders';


describe('First React component test with Enzyme', () => {
   it('renders without crashing', () => {
      shallow(<ViewOrders />);
    });
});
