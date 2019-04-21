import React from 'react';
import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import CreateProduct from '../pages/CreateProduct';


describe('First React component test with Enzyme', () => {
   it('renders without crashing', () => {
      shallow(<CreateProduct />);
    });
});
