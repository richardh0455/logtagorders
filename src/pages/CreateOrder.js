import React from 'react';
import Amplify from 'aws-amplify';
import { Auth, API } from 'aws-amplify';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import OrderList from './OrderList';
import Select from 'react-select';

const customersAPI = 'CustomersAPI';
const getAllPath = '/all';

const productsAPI = 'ProductsAPI';

const createPath = '/create';
const orderAPI = 'OrderAPI';

class CreateOrder extends React.Component{

  constructor(props) {
    super(props);

	this.handleCustomerChange = this.handleCustomerChange.bind(this);
	this.handleShippingAddressChange = this.handleShippingAddressChange.bind(this);

	this.state = {
      currentlySelectedCustomer: null,
      currentlySelectedShippingAddress: null,
	  customer: null
    };
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });


  }


  async getCustomer(id) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    return await API.get(customersAPI, '/'+id, apiRequest)
  }


  async createInvoice(invoiceLines) {
        const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        },
        body: {"customerID": this.state.currentlySelectedCustomer.value, "invoiceLines": invoiceLines}
      };
      return await API.post(orderAPI, createPath, apiRequest)
  }

  async handleCustomerChange(event) {
	this.setState({currentlySelectedCustomer: event})
    var customer = await this.getCustomer(event.value);
    this.setState({customer: customer.body})
	this.handleShippingAddressChange(null);
  }

  handleShippingAddressChange(event) {
	this.setState({currentlySelectedShippingAddress: event})
  }

   generateShippingAddressList(customer) {
    let shippingAddresses = [];
    if(customer && "ShippingAddresses" in customer){
        shippingAddresses = customer.ShippingAddresses.map((address) =>
			{return {value:address.ShippingAddressID, label: address.ShippingAddress}}
        );
    }
    return shippingAddresses;
  }



  render() {
    return (
      <div >
      <section>
        <form className="grid-form">
          <fieldset>
            <h2>Customer</h2>
            <div data-row-span="2">
              <div data-field-span="1" >
                <label>Customer</label>
                <Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
              </div>
              <div data-field-span="1" >
                <label>Shipping Address</label>
                <Select value={this.state.currentlySelectedShippingAddress} onChange={this.handleShippingAddressChange} options={this.generateShippingAddressList(JSON.parse(this.state.customer))} placeholder="Select a Shipping Address"/>
              </div>
            </div>
            <div className="OrderList" style={{marginTop: 50 + 'px'}}>
				<h2>Product</h2>
                <OrderList create_invoice_handler={this.createInvoice.bind(this)} products={this.props.products} shippingAddress ={this.state.currentlySelectedShippingAddress} customer={this.state.currentlySelectedCustomer}/>
            </div>
        </fieldset>
        </form>
      </section>


      </div>
    );
  }
}

export default withRouter(CreateOrder);
