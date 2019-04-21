import React from 'react';
import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import ViewCustomers from '../pages/ViewCustomers';


describe('First React component test with Enzyme', () => {
   it('renders without crashing', () => {
      shallow(<ViewCustomers />);
    });
});
