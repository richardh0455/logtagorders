import React from 'react';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Select from 'react-select';
import { Auth, API } from 'aws-amplify';


const getAll = '/all';
const ordersAPI = 'OrdersAPI';

class ViewOrders extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
        currentlySelectedCustomer: null
      };

    this.handleCustomerChange = this.handleCustomerChange.bind(this);
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
  }

  async handleCustomerChange(event) {
    console.log(event)
    this.setState({currentlySelectedCustomerID: event.value})
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
      console.log(response);
	  })
	  .catch(err => {

	  })

  }



  render() {
    return (
      <div>
        <section>
          <form className="grid-form">
            <fieldset>
			        <div data-row-span="2">
                <div data-field-span="1">
                  <label>Product</label>
                  <Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
                </div>
              </div>
            </fieldset>
          </form>
        </section>
      </div>
    );
  }
}

export default withRouter(ViewOrders);
