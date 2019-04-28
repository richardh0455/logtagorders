import React from 'react';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Select from 'react-select';
import { Auth, API } from 'aws-amplify';
import Accordian  from './Accordian';


const customersAPI = 'CustomersAPI';

class ViewCustomers extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
        currentlySelectedCustomer: {
          ContactInfo:{
            PrimaryContact:{}
          },
          ShippingAddresses:[]
        },
        currentlySelectedCustomerID:""
      };
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
  }

  getCustomer = (id) => {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    this.setState({currentlySelectedCustomerID:id})
    API.get(customersAPI, '/'+id, apiRequest)
    .then(response => {
      this.setState({currentlySelectedCustomer: JSON.parse(response.body)})
    })
  }

  deleteCustomer = () => {
    var id = this.state.currentlySelectedCustomerID
    if (window.confirm('Are you sure?')) {
      const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        }
      };
      API.del(customersAPI, '/'+id+'/delete', apiRequest)
      .then(response => {
        if(response.body["AffectedRows"] === 1)
        {
          var sleep = 3000;
          NotificationManager.success('', 'Customer Successfully Deleted', sleep);
          this.sleep(sleep).then(() => {
            this.props.get_all_customers();
          })
        }
        else {
          NotificationManager.error('Failed to Deleted Customer', 'Error', 5000, () => {});
        }
      })
    }

  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  render() {
    return (
      <div>
        <section>
          <Accordian onClick={this.getCustomer}>
            {this.props.customers.map((customer) => (
              <div label={customer.label} id={customer.value}>
                <span>Name: {customer.label}</span>
                <br/>
                <span>Billing Address: {this.state.currentlySelectedCustomer["ContactInfo"]["Billing_Address"]} </span>
                <br/>
                <span>Contact Email: {this.state.currentlySelectedCustomer["ContactInfo"]["Contact_Email"]} </span>
                <br/>
                <span>Primary Contact: {this.state.currentlySelectedCustomer["ContactInfo"]["PrimaryContact"]["Name"]} </span>
                <br/>
                <span>Fax: {this.state.currentlySelectedCustomer["ContactInfo"]["PrimaryContact"]["Fax"]} </span>
                <br/>
                <span>Phone: {this.state.currentlySelectedCustomer["ContactInfo"]["PrimaryContact"]["Phone"]} </span>
                <br/>
                <span>Region: {this.state.currentlySelectedCustomer["ContactInfo"]["Region"]} </span>
                <br/>
                <span>Shipping Addresses: </span>
                <br/>
                {this.state.currentlySelectedCustomer["ShippingAddresses"].map( (line) => (

                    <span>{line.ShippingAddress} </span>
                  ))
                }

                <button onClick={this.deleteCustomer} >Delete Customer</button>
              </div>
            ))}
          </Accordian>
        </section>
      </div>
    );
  }
}
export default withRouter(ViewCustomers);
