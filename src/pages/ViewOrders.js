import React from 'react';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Select from 'react-select';
import { Auth, API } from 'aws-amplify';
import Accordian  from './Accordian';


const getAll = '/all';
const ordersAPI = 'OrdersAPI';

class ViewOrders extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
        currentlySelectedCustomer: null,
        currentlySelectedOrder: {Order:{}, OrderLines:[]},
        orders: []
      };
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
  }

  handleCustomerChange = (event) => {
    this.setState({currentlySelectedCustomer: event})
    this.getOrders(event.value)
  }


  async getOrders(customerID) {
    const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        }
      };
      API.get(ordersAPI, '/'+customerID, apiRequest)
	  .then(response => {
      this.setState({orders: JSON.parse(response.body)});
	  })
	  .catch(err => {

	  })
  }

  async getSingleOrder(customerID, orderID) {
    const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        }
      };
    API.get(ordersAPI, '/'+customerID+'/'+orderID, apiRequest)
	  .then(response => {
      this.setState({currentlySelectedOrder: JSON.parse(response.body)})
	  })
	  .catch(err => {

	  })
  }

  getOrderDetails = (invoiceID) => {
    //reset to default before retrieving new data
    this.setState({currentlySelectedOrder: {Order:{}, OrderLines:[]}});
    this.getSingleOrder(this.state.currentlySelectedCustomer.value,invoiceID )
  }


  render() {
    return (
      <div>
        <section>
          <form className="grid-form">
            <fieldset>
			        <div data-row-span="2">
                <div data-field-span="1">
                  <label>Customer</label>
                  <Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
                </div>
              </div>
            </fieldset>
          </form>
        </section>
        <section>
          <Accordian onClick={this.getOrderDetails}>
            {this.state.orders.map((item) => (
              <div label={item.InvoiceID} id={item.InvoiceID}>
                <span>Invoice Number: {this.state.currentlySelectedOrder["Order"]["LogtagInvoiceNumber"]}-{item.InvoiceID}</span>
                <br/>
                <span>Payment Date: {this.state.currentlySelectedOrder["Order"]["PaymentDate"]}</span>
                <br/>
                <span>Shipped Date: {this.state.currentlySelectedOrder["Order"]["ShippedDate"]}</span>
                <br/>
                <table>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    </tr>
                {this.state.currentlySelectedOrder["OrderLines"].map((line) => (
                    <tr>
                      <td>{line["ProductID"]}</td>
                      <td>{line["Pricing"]}</td>
                      <td>{line["Quantity"]}</td>
                    </tr>
                ))}
                </table>
              </div>
            ))}
          </Accordian>
        </section>
      </div>
    );
  }
}

export default withRouter(ViewOrders);
