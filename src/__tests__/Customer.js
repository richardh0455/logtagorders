import React from 'react';
import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import Customer from '../pages/Customer';


describe('First React component test with Enzyme', () => {
   it('renders without crashing', () => {
      shallow(<Customer />);
    });
});
