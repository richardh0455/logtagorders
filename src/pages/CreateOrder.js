import React from 'react';
import Amplify from 'aws-amplify';
import { Auth, API } from 'aws-amplify';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import OrderList from './createOrder/OrderList';
import Select from 'react-select';

const customersAPI = 'CustomersAPI';
const getAllPath = '/all';

const productsAPI = 'ProductsAPI';

const createPath = '/create';
const orderAPI = 'OrdersAPI';

class CreateOrder extends React.Component{

  constructor(props) {
    super(props);



	this.state = {
      currentlySelectedCustomer: null,
      currentlySelectedShippingAddress: null,
	  customer: null,
    purchaseOrderNumber:''
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
        body: {"customerID": this.state.currentlySelectedCustomer.value, "invoiceLines": invoiceLines, "purchaseOrderNumber":this.state.purchaseOrderNumber}
      };
      return await API.post(orderAPI, createPath, apiRequest)
  }

  handleCustomerChange = (event) => {
	   this.setState({currentlySelectedCustomer: event})
     this.getCustomer(event.value)
     .then(response => {
       this.setState({customer: response.body})
       this.handleShippingAddressChange(null);
     });


  }

  handleShippingAddressChange = (event) => {
	   this.setState({currentlySelectedShippingAddress: event})
  }

  handlePurchaseOrderNumberChange = (event) => {
    this.setState({purchaseOrderNumber: event.target.value})
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

 required(field) {
   if(field  === null) {
    return <span style={{'font-size': '12px', 'color':'#ba090c'}}>Please Select a Value</span>

   }

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
                {this.required(this.state.currentlySelectedCustomer)}
              </div>
              <div data-field-span="1" >
                <label>Shipping Address</label>
                <Select value={this.state.currentlySelectedShippingAddress} onChange={this.handleShippingAddressChange} options={this.generateShippingAddressList(JSON.parse(this.state.customer))} placeholder="Select a Shipping Address"/>
                {this.required(this.state.currentlySelectedShippingAddress)}
              </div>

            </div>
            <div data-row-span="2">
              <div data-field-span="1" >
                <label>Purchase Order Number</label>
                <input type="text" value={this.state.purchaseOrderNumber}  onChange={this.handlePurchaseOrderNumberChange} />
              </div>
            </div>
            <div className="OrderList" style={{marginTop: 50 + 'px'}}>
				<h2>Product</h2>
                <OrderList create_invoice_handler={this.createInvoice.bind(this)} products={this.props.products} shippingAddress ={this.state.currentlySelectedShippingAddress} purchaseOrderNumber={this.state.purchaseOrderNumber} customer={{...this.state.currentlySelectedCustomer,...JSON.parse(this.state.customer)}}/>
            </div>
        </fieldset>
        </form>
      </section>


      </div>
    );
  }
}

export default withRouter(CreateOrder);
